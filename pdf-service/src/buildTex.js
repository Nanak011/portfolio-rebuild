// Escapes LaTeX special characters in plain-text content pulled from the DB.
function esc(str = "") {
  return String(str)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/\{/g, "\\{")
    .replace(/\}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

// Turns multi-line content into a LaTeX bullet list. A line written as
// "Label: rest of the sentence" gets the label bolded — matches the
// "Bold Lead-in: detail" bullet style. Lines with no colon just render plain.
function linesToBullets(text = "") {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "";
  return lines
    .map((line) => {
      const match = line.match(/^([^:]{2,60}):\s*(.+)$/);
      if (match) {
        return `    \\item \\textbf{${esc(match[1])}:} ${esc(match[2])}`;
      }
      return `    \\item ${esc(line)}`;
    })
    .join("\n");
}

function formatDateRange(start, end, isExpected) {
  const s = start ? new Date(start).getFullYear() : "";
  const e = end ? new Date(end).getFullYear() : isExpected ? "Expected" : "Present";
  return `${s} -- ${e}`;
}

/**
 * @param {object} content - all resume content fetched from Supabase
 * content.profile, content.education[], content.experience[] (each with .bullets[]),
 * content.skillGroups[] (each with .skills[]), content.certificationGroups[] (each with .certifications[]),
 * content.projects[] (each with .tags[])
 */
function buildTex(content) {
  const { profile, education, experience, skillGroups, certificationGroups, projects, extraSections = [], sections = {} } = content;
  const show = {
    education: true,
    experience: true,
    skills: true,
    projects: true,
    certifications: true,
    ...Object.fromEntries(extraSections.map((s) => [`extra_${s.slug}`, true])),
    ...sections,
  };

  const educationBlock = education
    .map(
      (ed) => `\\textbf{${esc(ed.institution)}} \\hfill ${esc(ed.location)} \\\\
\\textit{${esc(ed.degree)}} \\hfill ${formatDateRange(ed.start_date, ed.end_date, ed.is_expected)}`
    )
    .join("\n\n");

  const experienceBlock = experience
    .map((exp) => {
      const bullets = (exp.bullets || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((b) => `    \\item ${esc(b.content)}`)
        .join("\n");
      // return `\\textbf{${esc(exp.company)}} \\hfill ${esc(exp.location)} \\\\
      return `\\textbf{${exp.company_url ? `\\href{${exp.company_url}}{${esc(exp.company)}}` : esc(exp.company)}} \\hfill ${esc(exp.location)} \\\\
\\textit{${esc(exp.role_title)}${exp.employment_type ? ` (${esc(exp.employment_type)})` : ""}} \\hfill ${formatDateRange(exp.start_date, exp.end_date, false)}
\\begin{itemize}[leftmargin=*, noitemsep]
${bullets}
\\end{itemize}`;
    })
    .join("\n\n");

  const skillsBlock = skillGroups
    .map((g) => {
      const names = (g.skills || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s) => esc(s.name))
        .join(", ");
      return `    \\item \\textbf{${esc(g.label)}:} ${names}`;
    })
    .join("\n");

  // ATS fix applied here: two STACKED single-column lists, not side-by-side minipages.
  const certificationsBlock = certificationGroups
    .map((g) => {
      const items = (g.certifications || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => {
          const nameTex = c.credential_url ? `\\href{${c.credential_url}}{${esc(c.name)}}` : esc(c.name);
          return `        \\item ${c.issuer ? `\\textbf{${esc(c.issuer)}:} ` : ""}${nameTex}`;
        })
        .join("\n");
      return `\\textbf{${esc(g.label)}}
    \\begin{itemize}[leftmargin=*, noitemsep]
${items}
    \\end{itemize}`;
    })
    .join("\n\n");

  const projectsBlock = (projects || [])
    .map((p) => {
      const link = p.repo_url ? ` \\hfill \\href{${p.repo_url}}{GitHub}` : "";
      const bullets = linesToBullets(p.what_i_did) || `    \\item ${esc(p.problem)}`;
      return `\\textbf{${esc(p.title)}}${p.is_flagship ? " \\textit{(flagship)}" : ""}${link}
\\begin{itemize}[leftmargin=*, noitemsep]
${bullets}
\\end{itemize}`;
    })
    .join("\n");

  const SECTION_BLOCKS = {
    education: `\\section{Education}\n${educationBlock}`,
    experience: `\\section{Professional Experience}\n\n${experienceBlock}`,
    skills: `\\section{Technical Skills}\n\\begin{itemize}[leftmargin=*, noitemsep]\n${skillsBlock}\n\\end{itemize}`,
    projects: `\\section{Projects}\n${projectsBlock}`,
    certifications: `\\section{Certifications \\& Professional Development}\n${certificationsBlock}`,
  };

  for (const s of extraSections) {
    const items = (s.entries || [])
      .map((e) => {
        const dateStr = e.entry_date ? ` \\hfill ${esc(String(e.entry_date).slice(0, 10))}` : "";
        const titleTex = e.url ? `\\href{${e.url}}{${esc(e.title)}}` : esc(e.title);
        const descTex = e.description ? ` — ${esc(e.description)}` : "";
        return `    \\item \\textbf{${titleTex}}${descTex}${dateStr}`;
      })
      .join("\n");
    SECTION_BLOCKS[`extra_${s.slug}`] = `\\section{${esc(s.label)}}\n\\begin{itemize}[leftmargin=*, noitemsep]\n${items}\n\\end{itemize}`;
  }

  const sectionOrder =
    content.order && content.order.length > 0
      ? content.order
      : [
          "education",
          "experience",
          "skills",
          "projects",
          "certifications",
          ...extraSections.map((s) => `extra_${s.slug}`),
        ];

  return `\\documentclass[10pt, letterpaper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage{titlesec}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing{\\section}{0pt}{8pt}{4pt}

\\begin{document}

\\begin{center}
    {\\huge \\textbf{${esc(profile.full_name)}}} \\\\
    \\vspace{2pt}
    ${esc(profile.location)} $|$ ${esc(profile.phone)} \\\\
    ${esc(profile.email)} \\quad ${esc(profile.linkedin_url)} \\quad ${esc(profile.github_url)}
\\end{center}

\\section{Professional Summary}
${esc(profile.summary)}

${sectionOrder
  .filter((key) => show[key] && SECTION_BLOCKS[key])
  .map((key) => SECTION_BLOCKS[key])
  .join("\n\n")}

\\end{document}
`;
}

module.exports = { buildTex };
