-- ============================================================================
-- Portfolio Rebuild — Supabase Postgres Schema
-- Public side: read-only. Admin side: single authenticated user, full CRUD.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILE / SUMMARY (single row — your name, contact, professional summary)
-- ----------------------------------------------------------------------------
create table if not exists profile (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  location text,
  phone text,
  email text,
  linkedin_url text,
  github_url text,
  summary text not null,
  proof_statement text, -- "I build security pipelines that isolate the threat..."
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. EDUCATION
-- ----------------------------------------------------------------------------
create table if not exists education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  location text,
  degree text not null,
  start_date date,
  end_date date, -- null = expected/ongoing
  is_expected boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 3. EXPERIENCE (resume-style entries with bullet points)
-- ----------------------------------------------------------------------------
create table if not exists experience (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  location text,
  role_title text not null,
  employment_type text, -- e.g. "Part-time", "Full-time"
  start_date date,
  end_date date, -- null = current
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists experience_bullets (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references experience(id) on delete cascade,
  content text not null,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 4. SKILLS (grouped: Tools / Concepts / Programming & AI Tools, etc.)
-- ----------------------------------------------------------------------------
create table if not exists skill_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null, -- "Tools", "Concepts", "Programming & AI Tools"
  sort_order int not null default 0
);

create table if not exists skills (
  id uuid primary key default gen_random_uuid(),
  skill_group_id uuid not null references skill_groups(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 5. CERTIFICATIONS (two single-column lists post-ATS-fix, not side-by-side)
-- ----------------------------------------------------------------------------
create table if not exists certification_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null, -- "Professional Certifications", "Coursework & Technical Training"
  sort_order int not null default 0
);

create table if not exists certifications (
  id uuid primary key default gen_random_uuid(),
  certification_group_id uuid not null references certification_groups(id) on delete cascade,
  name text not null,
  issuer text,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 6. PROJECTS (rich case-study format: problem / what I did / what came of it)
-- ----------------------------------------------------------------------------
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  is_flagship boolean not null default false,
  icon text not null default 'shield', -- one of: shield | network | terminal | lock
  problem text not null,
  what_i_did text not null,
  what_came_of_it text not null,
  repo_url text,
  demo_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  tag text not null
);

-- Real many-to-many skill links (replaces guessing from tag text alone).
create table if not exists project_skills (
  project_id uuid not null references projects(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (project_id, skill_id)
);
create table if not exists experience_skills (
  experience_id uuid not null references experience(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  primary key (experience_id, skill_id)
);

-- Arbitrary labeled links per project (GitHub, live site, dataset, write-up, etc.)
create table if not exists project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  label text not null,
  url text not null,
  sort_order int not null default 0
);

-- Admin-defined HUD dial stats for the homepage telemetry strip.
create table if not exists homepage_stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value numeric not null,
  max_value numeric not null default 100,
  unit text,
  sort_order int not null default 0
);

-- ----------------------------------------------------------------------------
-- 7b. HOMEPAGE SECTIONS (extensible — CTFs, publications, research papers,
-- talks, etc. Each section is a labeled group; each entry is one item in it.
-- A section only renders on the public homepage once it has at least one entry.
-- ----------------------------------------------------------------------------
create table if not exists homepage_sections (
  id uuid primary key default gen_random_uuid(),
  label text not null,       -- e.g. "CTFs & Competitions", "Publications"
  slug text unique not null, -- e.g. "ctfs"
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists homepage_entries (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references homepage_sections(id) on delete cascade,
  title text not null,
  description text,
  url text,
  entry_date date,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. RESUME GENERATION HISTORY (admin-triggered tectonic compiles)
-- ----------------------------------------------------------------------------
create table if not exists resume_generations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  label text not null, -- custom name or defaults to timestamp
  storage_path text not null, -- path in Supabase Storage private bucket
  is_current boolean not null default false
);

-- Enforce "only one row true at a time" for is_current
create unique index if not exists one_current_resume
  on resume_generations (is_current)
  where is_current = true;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Public (anon) role: SELECT only, on content tables. No access to
-- resume_generations directly — that's served through an admin-only endpoint
-- (or a public "current resume" view, see below).
-- Admin (authenticated, single user) role: full CRUD everywhere.
-- ============================================================================

alter table profile enable row level security;
alter table education enable row level security;
alter table experience enable row level security;
alter table experience_bullets enable row level security;
alter table skill_groups enable row level security;
alter table skills enable row level security;
alter table certification_groups enable row level security;
alter table certifications enable row level security;
alter table projects enable row level security;
alter table project_tags enable row level security;
alter table project_skills enable row level security;
alter table experience_skills enable row level security;
alter table project_links enable row level security;
alter table homepage_stats enable row level security;
alter table homepage_sections enable row level security;
alter table homepage_entries enable row level security;
alter table resume_generations enable row level security;

-- Public read policies
create policy "public read profile" on profile for select using (true);
create policy "public read education" on education for select using (true);
create policy "public read experience" on experience for select using (true);
create policy "public read experience_bullets" on experience_bullets for select using (true);
create policy "public read skill_groups" on skill_groups for select using (true);
create policy "public read skills" on skills for select using (true);
create policy "public read certification_groups" on certification_groups for select using (true);
create policy "public read certifications" on certifications for select using (true);
create policy "public read projects" on projects for select using (true);
create policy "public read project_tags" on project_tags for select using (true);
create policy "public read project_skills" on project_skills for select using (true);
create policy "public read experience_skills" on experience_skills for select using (true);
create policy "public read project_links" on project_links for select using (true);
create policy "public read homepage_stats" on homepage_stats for select using (true);
create policy "public read homepage_sections" on homepage_sections for select using (true);
create policy "public read homepage_entries" on homepage_entries for select using (true);

-- resume_generations: NOT publicly selectable (contains full history/labels).
-- The public "Download Resume" button should call a small server route that
-- looks up the is_current=true row server-side and streams the file — it
-- never queries this table directly from the browser.

-- Admin (authenticated) full access — single user, so `auth.role() = 'authenticated'`
-- is sufficient (no need to check a specific user_id since only you can sign in).
create policy "admin all profile" on profile for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all education" on education for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all experience" on experience for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all experience_bullets" on experience_bullets for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all skill_groups" on skill_groups for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all skills" on skills for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all certification_groups" on certification_groups for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all certifications" on certifications for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all projects" on projects for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all project_tags" on project_tags for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all project_skills" on project_skills for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all experience_skills" on experience_skills for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all project_links" on project_links for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all homepage_stats" on homepage_stats for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all homepage_sections" on homepage_sections for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all homepage_entries" on homepage_entries for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin all resume_generations" on resume_generations for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ============================================================================
-- RETENTION TRIGGER: rolling 10 generations — 11th insert deletes the oldest
-- (DB row here; delete the matching Storage object in your app code, since
-- Storage deletion can't happen from a plain SQL trigger).
-- ============================================================================

create or replace function enforce_resume_retention()
returns trigger as $$
declare
  excess_count int;
begin
  select count(*) - 10 into excess_count from resume_generations;
  if excess_count > 0 then
    -- Return the ids of rows to delete so the app layer can also clean up Storage.
    -- (This trigger only prunes the DB rows; call a matching Storage cleanup
    -- from your API route using the same ids, or use a Supabase Edge Function
    -- that listens for these deletes.)
    delete from resume_generations
    where id in (
      select id from resume_generations
      order by created_at asc
      limit excess_count
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_resume_retention
  after insert on resume_generations
  for each row
  execute function enforce_resume_retention();

-- ============================================================================
-- SEED DATA — from your current resume, so tables aren't empty on first run
-- ============================================================================

insert into profile (full_name, location, phone, email, linkedin_url, github_url, summary, proof_statement)
values (
  'Gurunanak Adhikari',
  'Nepaltar, Kathmandu, Nepal',
  '+977 9844643891',
  'gurunanakadhari1@gmail.com',
  'https://linkedin.com/in/gurunanakadhikari',
  'https://github.com/Nanak011',
  'Cybersecurity student and ISC2 CC with technical exposure to Blue Team and Red Team fundamentals through structured internships, labs, and projects. Experienced in AWS cloud, basic web application testing, network traffic analysis, SIEM fundamentals, CTF challenges, and Python-based security scripting. Seeking opportunities in cybersecurity.',
  'I build security pipelines that isolate the threat, alert the human, and prove it worked.'
);

insert into education (institution, location, degree, start_date, end_date, is_expected, sort_order)
values (
  'IIMS College (Affiliated with Taylor''s University)',
  'Kathmandu, Nepal',
  'Bachelor of Computer Science (Specialization in Cybersecurity)',
  '2023-01-01',
  '2027-01-01',
  true,
  0
);

-- Experience ------------------------------------------------------------
with e1 as (
  insert into experience (company, location, role_title, employment_type, start_date, end_date, sort_order)
  values ('FlyRank AI', 'Remote', 'Backend AI Engineer Intern', 'Part-time', '2026-07-01', '2026-09-30', 0)
  returning id
), e2 as (
  insert into experience (company, location, role_title, employment_type, start_date, end_date, sort_order)
  values ('Cloudmandap', 'Kathmandu, Nepal', 'Data Automation and AI Fellow (AWS DevOps)', null, '2026-02-01', '2026-08-31', 1)
  returning id
), e3 as (
  insert into experience (company, location, role_title, employment_type, start_date, end_date, sort_order)
  values ('Guided Virtual Internships', 'Remote', 'Cyber Security Extern (ShadowFox, Redynox, HACK SECURE)', null, '2025-04-01', '2025-08-31', 2)
  returning id
)
insert into experience_bullets (experience_id, content, sort_order)
select id, content, sort_order from (
  select (select id from e1) as id, 'Built Node.js/Express REST APIs for task management using repository patterns.' as content, 0 as sort_order
  union all
  select (select id from e1), 'Containerized PostgreSQL database and application stack via Docker Compose.', 1
  union all
  select (select id from e1), 'Implemented Supabase JWT authentication, protected routes, and middleware.', 2
  union all
  select (select id from e1), 'Developed web scraping pipeline with caching, throttling, and Zod validation.', 3
  union all
  select (select id from e1), 'Designed and built Google Forms Scam Analyzer, a Chrome extension + FastAPI backend capstone that classifies scam risk via LLM tactic analysis (Groq/Gemini fallback) and concurrent OSINT reputation checks, deployed live with a bring-your-own-key architecture and per-IP rate limiting.', 4
  union all
  select (select id from e2), 'Deployed, configured, and managed lab-scale AWS infrastructure using core services, DevOps workflows, and security-focused automation principles.', 0
  union all
  select (select id from e2), 'Completed curriculum tracks for AWS Cloud Practitioner and Solutions Architect Associate pathways.', 1
  union all
  select (select id from e3), 'Traffic Analysis & Reconnaissance: Inspected packet flow and protocol behavior via Wireshark; executed subdomain discovery, DNS analysis, and web asset gathering.', 0
  union all
  select (select id from e3), 'Vulnerability Assessment & Hardening: Evaluated system logs for anomalies and assessed open ports/firewall rules within guided sandbox environments.', 1
  union all
  select (select id from e3), 'Application Security Foundations: Solved foundational web security CTFs (SQLi/XSS) and built Python security scripts for sniffing and password verification.', 2
) as rows;

-- Skills ------------------------------------------------------------------
with sg_tools as (
  insert into skill_groups (label, sort_order) values ('Tools', 0) returning id
), sg_concepts as (
  insert into skill_groups (label, sort_order) values ('Concepts', 1) returning id
), sg_prog as (
  insert into skill_groups (label, sort_order) values ('Programming & AI Tools', 2) returning id
)
insert into skills (skill_group_id, name, sort_order)
select id, name, sort_order from (
  select (select id from sg_tools) as id, unnest(array[
    'OWASP ZAP','Netlify','GCP Compute Engine','Wireshark','Nmap','SQLmap','Snort','Splunk','Kali Linux','Docker','Nginx'
  ]) as name, generate_series(0, 10) as sort_order
  union all
  select (select id from sg_concepts), unnest(array[
    'Application Security (AppSec)','DAST','Cloud Security Architecture (AWS/GCP)','Incident Automation (SOAR)','Log Analysis & SIEM','Network Security','Threat Hunting'
  ]), generate_series(0, 6)
  union all
  select (select id from sg_prog), unnest(array[
    'Basic Python for security scripting','JavaScript/HTML/CSS','Lovable AI','GitHub Copilot','Cline','Cursor'
  ]), generate_series(0, 5)
) as rows;

-- Certifications (post-ATS-fix: two stacked single-column groups) ---------
with cg_prof as (
  insert into certification_groups (label, sort_order) values ('Professional Certifications', 0) returning id
), cg_course as (
  insert into certification_groups (label, sort_order) values ('Coursework & Technical Training', 1) returning id
)
insert into certifications (certification_group_id, name, issuer, sort_order)
values
  ((select id from cg_prof), 'Certified in Cybersecurity (CC)', 'ISC2', 0),
  ((select id from cg_prof), 'AWS Cloud Practitioner', null, 1),
  ((select id from cg_course), 'Splunk Knowledge Manager & Search Expert', 'Coursera', 0),
  ((select id from cg_course), 'Solutions Architect & Cloud Practitioner', 'AWS Academy', 1),
  ((select id from cg_course), 'Cybersecurity Professional Certificate', 'Google, IBM', 2);

-- Projects (full case-study versions) -------------------------------------
with p1 as (
  insert into projects (title, slug, is_flagship, problem, what_i_did, what_came_of_it, sort_order)
  values (
    'AWS SOAR Engine',
    'aws-soar-engine',
    true,
    'AWS tutorials only alert via email on incidents; email gets ignored. Wanted the fastest way to notify a human the moment an attack happens.',
    'DVWA on Docker behind AWS WAF/ALB; on Layer-7 attack detection, a Lambda function parses S3 threat logs, moves the EC2 instance into a zero-ingress quarantine security group, and places a Twilio voice call stating the attack, attacker IP, and remediation taken. Chose a phone call over Slack/SMS deliberately, since it is harder to ignore. Real failure modes hit and fixed: calls not firing or arriving late (fixed by testing one attack at a time, waiting to confirm before the next, sometimes using a second IP to disambiguate), WAF silently blocking most attacks without logging (worked around by only testing attack types WAF actually logged), and manual security-group reset needed after each quarantine.',
    'Working proof of concept, documented with a GitHub repo and video demo, presented at a fellowship session where the instructor called it a genuinely novel approach. Torn down afterward to avoid ongoing AWS cost, since it was built to prove the concept, not run in production.',
    0
  ) returning id
), p2 as (
  insert into projects (title, slug, is_flagship, problem, what_i_did, what_came_of_it, sort_order)
  values (
    'Multi-Node Threat Intelligence Pipeline (Honeypot)',
    'multi-node-threat-intelligence-pipeline',
    false,
    'Wanted one project touching everything learned: cloud, automation, DevOps, AI integration, data, visualization, security. Not another off-the-shelf Cowrie/T-Pot deployment.',
    'Three architecture iterations over roughly five weeks. V1: single DigitalOcean droplet logging HTTP requests, Gemini-cleaned, cron-pushed to GitHub Pages, which proved bots find an unadvertised IP within hours but overloaded one droplet doing everything. V2: split across three droplets writing to Supabase, with hourly GitHub Actions pulling, cleaning, and pushing. Over 100 commits in one day tuning batch size and timeout triggered GitHub''s anomaly detection and broke the Actions schedule, requiring a rebuild in a fresh repo to recover. Also hit Gemini free-tier rate limits and fell about 95% behind on cleaning, so switched to paid Vertex AI Gemini.',
    '47,598 total probes, 5,095 unique IPs, 11,366 critical and 14,501 high severity classified, published openly as a dataset with a Zenodo DOI, and 1,755 high-severity IPs reported to AbuseIPDB. Audited AI severity labels against 100 human-reviewed samples, improving Cohen''s kappa from 0.66 to 0.80.',
    1
  ) returning id
), p3 as (
  insert into projects (title, slug, is_flagship, problem, what_i_did, what_came_of_it, sort_order)
  values (
    'AWS & Splunk SOC Lab',
    'aws-splunk-soc-lab',
    false,
    'AWS has built-in SIEM tooling, but many companies already run Splunk and may lack budget for a fully separate native stack. Wanted to prove the two could be bridged.',
    'Ubuntu EC2 instance, Docker + DVWA exposed publicly, Splunk Universal Forwarder shipping JSON container logs to a locally hosted Splunk Enterprise instance. Validated with two real attacks: simulated directory traversal and path traversal, confirming logs landed and parsed correctly.',
    'A confirmed, working log pipeline from a cloud-hosted vulnerable app to a locally hosted SIEM, validated end-to-end with two live, traceable attack types.',
    2
  ) returning id
)
insert into project_tags (project_id, tag)
select id, tag from (
  select (select id from p1) as id, unnest(array['AWS','Lambda','WAF','Twilio','SOAR']) as tag
  union all
  select (select id from p2), unnest(array['DigitalOcean','Supabase','GitHub Actions','Gemini','Open Dataset'])
  union all
  select (select id from p3), unnest(array['AWS','Splunk','Docker','SIEM'])
) as rows;

-- Note: "Google Forms Scam Analyzer" case study is intentionally left out of
-- this seed — per the handoff, confirm its current build status before
-- writing its case study, since it may have progressed past the one-pager.
