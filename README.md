# Portfolio Rebuild — Setup, Test, Deploy

Two-sides architecture: a public read-only site and an authenticated admin panel,
backed by Supabase (DB + Auth + Storage), with a separate Fly.io service that
compiles your resume PDF using `tectonic`.

```
portfolio-rebuild/
├── schema.sql          ← run this in Supabase first
├── web/                ← Next.js app (public site + admin panel) → deploy to Vercel
└── pdf-service/        ← Express + tectonic → deploy to Fly.io
```

Everything below is one pass, start to finish. Work through it in order —
each step depends on the one before it — but there's no "wait for phase 2"
gate; it's all here.

---

## 1. GitHub

```bash
cd portfolio-rebuild
git init
git add .
git commit -m "Initial portfolio rebuild: schema, web app, pdf-service"
```

Create a new **empty** repo on GitHub (no README/license, you already have one), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/portfolio-rebuild.git
git branch -M main
git push -u origin main
```

`.gitignore` is already set up to keep `node_modules/`, `.env*`, and `.next/` out of the repo.

---

## 2. Supabase project

1. Go to [supabase.com](https://supabase.com) → **New Project**. Pick a region close to you (Singapore is closest to Kathmandu).
2. Once it's provisioned: **SQL Editor** → paste the entire contents of `schema.sql` → **Run**.
   This creates every table, RLS policy, the retention trigger, and seeds your profile/education/experience/skills/certifications/projects from your current resume.
3. **Storage** → **New bucket** → name it exactly `resumes` → set it **Private** (not public). The public download route uses short-lived signed URLs, so it never needs to be public.
4. **Authentication** → **Users** → **Add user** → create your own admin login (your email + a real password). This is the *only* account that should ever exist — there's no public signup flow in this app by design.
5. **Project Settings → API** — copy these three values, you'll need them next:
   - `Project URL`
   - `anon` `public` key
   - `service_role` `secret` key (never expose this to the browser)

---

## 3. Local environment setup

### web/

```bash
cd web
cp .env.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
PDF_SERVICE_URL=http://localhost:8080          # local pdf-service for now
PDF_SERVICE_SECRET=pick-any-long-random-string  # must match pdf-service's ADMIN_API_SECRET
```

```bash
npm install
npm run dev
```
Visit `http://localhost:3000` — you should see your seeded profile, experience, education, and skills. Visit `http://localhost:3000/projects` for the three seeded case studies.

### pdf-service/

```bash
cd ../pdf-service
cp .env.example .env
```

Fill in `.env`:
```
SUPABASE_URL=...                    # same Project URL as above
SUPABASE_SERVICE_ROLE_KEY=...       # same service_role key as above
ADMIN_API_SECRET=pick-any-long-random-string   # must match web/.env.local's PDF_SERVICE_SECRET
```

This service needs `tectonic` installed locally to run outside Docker. Easiest path: skip local testing of this service and test it via Docker instead (next section) — it avoids installing a LaTeX engine on your own machine.

---

## 4. Test locally end-to-end

**Option A — full Docker test (recommended, matches production):**
```bash
cd pdf-service
docker build -t pdf-service .
docker run --env-file .env -p 8080:8080 pdf-service
```
In another terminal, confirm it's up:
```bash
curl http://localhost:8080/health
```

**Then, with `web` running (`npm run dev` in `/web`) and `pdf-service` running (Docker, above) on port 8080:**

1. Go to `http://localhost:3000/admin/login`, sign in with the Supabase user you created.
2. `/admin/resume` → click **Generate PDF**. This calls `web`'s `/api/admin/generate-pdf`, which calls `pdf-service`'s `/generate`, which fetches your seeded content, compiles it with `tectonic`, uploads to the `resumes` Storage bucket, and inserts a `resume_generations` row.
3. Click **set as current** on the new row.
4. Go to `http://localhost:3000/api/resume` in a new tab — it should redirect to a signed URL and download your compiled PDF.
5. `/admin/projects` → confirm you can edit/create/delete a project and see it reflected on `/projects`.

If `/generate` fails, check the pdf-service container logs — the most common issue is a LaTeX package `tectonic` couldn't resolve (it fetches packages on first run, so the very first call may be slow).

---

## 5. Deploy pdf-service to Fly.io

```bash
cd pdf-service
fly auth login          # if you haven't already
fly launch --no-deploy  # answer prompts; when it asks about fly.toml, keep the one already here
```

Set secrets (these replace the `.env` file in production):
```bash
fly secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
fly secrets set ADMIN_API_SECRET=the-same-long-random-string-from-before
```

```bash
fly deploy
```

Confirm it's live:
```bash
curl https://YOUR-APP-NAME.fly.dev/health
```

---

## 6. Deploy web to Vercel

1. [vercel.com](https://vercel.com) → **New Project** → import your GitHub repo.
2. **Root Directory**: set to `web` (this is a monorepo — Vercel needs to know which folder is the Next.js app).
3. Add environment variables (**Project Settings → Environment Variables**), same as your `.env.local` but pointing `PDF_SERVICE_URL` at the real Fly.io URL from step 5:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   PDF_SERVICE_URL=https://YOUR-APP-NAME.fly.dev
   PDF_SERVICE_SECRET=the-same-long-random-string
   ```
4. Deploy.

---

## 7. Post-deploy smoke test

Repeat the same steps as local testing (section 4), but against your live Vercel URL:
- Log into `/admin/login`
- Generate a PDF, set it current
- Confirm `/api/resume` on the **public** site serves it with zero LaTeX compilation happening in the visitor's request path (check Vercel's function logs for that request — it should only show a Storage signed-URL lookup, nothing tectonic-related)
- Edit a project in `/admin/projects`, confirm it shows up on the public `/projects` page

---

## Known follow-ups (not blockers, just noted)

- **Departure Mono font file**: `globals.css` references `/fonts/DepartureMono-Regular.woff2`, which isn't included here (check the font's license terms before bundling it — Helena Zhang's font page has the details). Until you add it, the site falls back to a system monospace font, so nothing breaks.
- **Google Forms Scam Analyzer case study**: intentionally left out of the seed data — confirm the capstone's actual current state against the resume description before writing its case study text (per your handoff notes), then add it via `/admin/projects`.
- **`tectonic` version pin**: the Dockerfile pulls the *latest* release on each build. Once you've confirmed a version compiles your template cleanly, consider pinning the exact release tag in the Dockerfile so future builds don't silently change behavior.
- **Retention**: the SQL trigger in `schema.sql` prunes old DB rows as a backstop, but the *authoritative* retention logic (including deleting the matching Storage file) runs in `pdf-service`'s `/generate` handler after each successful generation.
