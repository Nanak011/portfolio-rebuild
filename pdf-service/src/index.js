const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const { execFile } = require("child_process");
const fs = require("fs/promises");
const path = require("path");
const os = require("os");
const { buildTex } = require("./buildTex");

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RETENTION_LIMIT = 10;

// Shared-secret auth — the only caller is the Next.js admin API route.
function requireAdminSecret(req, res, next) {
  const provided = req.header("x-admin-secret");
  if (!provided || provided !== process.env.ADMIN_API_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/generate", requireAdminSecret, async (req, res) => {
  const label = req.body?.label || new Date().toISOString();
  // Every section defaults to included unless explicitly set to false.
  const sections = {
    education: true,
    experience: true,
    skills: true,
    projects: true,
    certifications: true,
    ...(req.body?.sections || {}),
  };
  const order = Array.isArray(req.body?.order) ? req.body.order : undefined;
  let tmpDir;

  try {
    // 1. Fetch all content the template needs.
    const [
      { data: profile, error: profileErr },
      { data: education, error: eduErr },
      { data: experience, error: expErr },
      { data: skillGroups, error: skillErr },
      { data: certificationGroups, error: certErr },
      { data: projectsRaw, error: projErr },
    ] = await Promise.all([
      supabase.from("profile").select("*").limit(1).single(),
      sections.education
        ? supabase.from("education").select("*").order("sort_order")
        : Promise.resolve({ data: [], error: null }),
      sections.experience
        ? supabase.from("experience").select("*, experience_bullets(*)").order("sort_order")
        : Promise.resolve({ data: [], error: null }),
      sections.skills
        ? supabase.from("skill_groups").select("*, skills(*)").order("sort_order")
        : Promise.resolve({ data: [], error: null }),
      sections.certifications
        ? supabase.from("certification_groups").select("*, certifications(*)").order("sort_order")
        : Promise.resolve({ data: [], error: null }),
      sections.projects
        ? supabase.from("projects").select("*, project_tags(*)").order("sort_order")
        : Promise.resolve({ data: [], error: null }),
    ]);

    // Extra admin-defined sections (CTFs, publications, etc.) — always fetched
    // cheaply; inclusion is controlled per-section via `sections`/`order`.
    const { data: extraSectionsRaw } = await supabase
      .from("homepage_sections")
      .select("*, homepage_entries(*)")
      .order("sort_order");
    const extraSections = (extraSectionsRaw || [])
      .filter((s) => s.homepage_entries && s.homepage_entries.length > 0)
      .map((s) => ({ slug: s.slug, label: s.label, entries: s.homepage_entries }));

    const firstError = profileErr || eduErr || expErr || skillErr || certErr || projErr;
    if (firstError) throw new Error(`Content fetch failed: ${firstError.message}`);

    const experienceWithBullets = experience.map((e) => ({
      ...e,
      bullets: e.experience_bullets,
    }));

    const projects = (projectsRaw || []).map((p) => ({
      ...p,
      tags: (p.project_tags || []).map((t) => t.tag),
    }));

    // 2. Build the .tex source.
    const texSource = buildTex({
      profile,
      education,
      experience: experienceWithBullets,
      skillGroups,
      certificationGroups,
      projects,
      extraSections,
      sections,
      order,
    });

    // 3. Write to a temp dir and compile with tectonic.
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "resume-"));
    const texPath = path.join(tmpDir, "resume.tex");
    const pdfPath = path.join(tmpDir, "resume.pdf");
    await fs.writeFile(texPath, texSource, "utf8");

    await new Promise((resolve, reject) => {
      execFile(
        "tectonic",
        ["--outdir", tmpDir, texPath],
        { timeout: 30_000 },
        (err, stdout, stderr) => {
          if (err) return reject(new Error(`tectonic failed: ${stderr || err.message}`));
          resolve();
        }
      );
    });

    const pdfBuffer = await fs.readFile(pdfPath);

    // 4. Upload to Supabase Storage.
    const storagePath = `resumes/${Date.now()}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("resumes")
      .upload(storagePath, pdfBuffer, { contentType: "application/pdf" });
    if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`);

    // 5. Insert history row (not automatically current — admin chooses in the UI).
    const { data: newRow, error: insertErr } = await supabase
      .from("resume_generations")
      .insert({ label, storage_path: storagePath, is_current: false })
      .select()
      .single();
    if (insertErr) throw new Error(`DB insert failed: ${insertErr.message}`);

    // 6. Enforce rolling retention at the application level (handles Storage
    //    cleanup, which the DB-only SQL trigger in schema.sql cannot do).
    const { data: allRows } = await supabase
      .from("resume_generations")
      .select("id, storage_path, created_at")
      .order("created_at", { ascending: true });

    if (allRows && allRows.length > RETENTION_LIMIT) {
      const excess = allRows.slice(0, allRows.length - RETENTION_LIMIT);
      await supabase.storage.from("resumes").remove(excess.map((r) => r.storage_path));
      await supabase
        .from("resume_generations")
        .delete()
        .in("id", excess.map((r) => r.id));
    }

    res.json({ ok: true, generation: newRow });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`pdf-service listening on ${port}`));
