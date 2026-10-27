"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { SITE_NAME } from "@/lib/site";
import { useState } from "react";
import { signOut } from "@/app/admin/actions";

const NAV: { href: string; label: string }[] = [
  { href: "/admin", label: "Enquiries" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default function MobileAdminMenu({ user }: { user: { email?: string | null } | null }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle menu" aria-expanded={sidebarOpen}>
        ☰
      </button>
      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Admin navigation">
        <Link className="admin-brand" href="/admin" aria-label={`${SITE_NAME} - Admin`} />
        <nav className="admin-nav">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="admin-nav-link" onClick={() => setSidebarOpen(false)}>{n.label}</Link>
          ))}
        </nav>
        <div className="admin-foot">
          <span className="admin-user">{user?.email ?? "Admin"}</span>
          <SignOutButton action={signOut} />
        </div>
      </aside>
      <div className={`admin-sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)}></div>
    </>
  );
}

