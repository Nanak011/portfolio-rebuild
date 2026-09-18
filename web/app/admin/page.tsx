import Link from "next/link";

export default function AdminDashboard() {
  return (
    <main>
      <h1>Admin Dashboard</h1>
      <p className="muted section">Content management for the public site.</p>
      <ul className="section">
        <li>
          <Link href="/admin/projects">Manage projects</Link>
        </li>
        <li>
          <Link href="/admin/resume">Generate &amp; manage resume PDFs</Link>
        </li>
      </ul>
    </main>
  );
}
