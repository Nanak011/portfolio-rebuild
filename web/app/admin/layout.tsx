import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <nav
        style={{
          display: "flex",
          gap: 20,
          alignItems: "center",
          borderBottom: "2px solid var(--line)",
          paddingBottom: 16,
          marginBottom: 32,
        }}
      >
        <span className="hud-title" style={{ letterSpacing: "0.15em" }}>ADMIN</span>
        <Link href="/admin">dashboard</Link>
        <Link href="/admin/profile">profile</Link>
        <Link href="/admin/education">education</Link>
        <Link href="/admin/experience">experience</Link>
        <Link href="/admin/skills">skills</Link>
        <Link href="/admin/projects">projects</Link>
        <Link href="/admin/certifications">certifications</Link>
        <Link href="/admin/stats">stats</Link>
        <Link href="/admin/sections">sections</Link>
        <Link href="/admin/resume">resume</Link>
        <span style={{ flex: 1 }} />
        <Link href="/">view site</Link>
        <SignOutButton />
      </nav>
      {children}
    </div>
  );
}
