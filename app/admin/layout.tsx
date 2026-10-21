import Link from "next/link";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NotificationHandler } from "@/components/NotificationWrapper";
import { SignOutButton } from "@/components/SignOutButton";

const NAV: { href: string; label: string }[] = [
  { href: "/admin", label: "Enquiries" },
  { href: "/admin/referrals", label: "Referrals" },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/insights", label: "Insights" },
  { href: "/admin/reviews", label: "Reviews" },
];

const SECTIONS: Record<string, { title: string; sub: string }> = {
  "/admin": { title: "Enquiries", sub: "Manage traveller enquiries and reply to guests." },
  "/admin/referrals": { title: "Referrals & commissions", sub: "Track partner referrals and commissions due." },
  "/admin/partners": { title: "Partners", sub: "Lodges, operators, drivers and activity partners." },
  "/admin/content": { title: "Destination content", sub: "Edit destination pages, stories, activities and stays." },
  "/admin/insights": { title: "Insights", sub: "Views, visitors and enquiry trends over the last 30 days." },
  "/admin/reviews": { title: "Review moderation", sub: "Approve or reject traveller reviews before they appear publicly." },
};

async function signOut(fd: FormData) {
  "use server";
  const sb = await authClient();
  await sb.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await authClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return children;
  return (
    <div className="appshell">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <Link className="admin-brand" href="/admin">Travel Guide</Link>
        <nav className="admin-nav">
          {NAV.map(n => (
            <Link key={n.href} href={n.href} className="admin-nav-link">{n.label}</Link>
          ))}
        </nav>
        <div className="admin-foot">
          <span className="admin-user">{user.email ?? "Admin"}</span>
          <SignOutButton action={signOut} />
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-header">
          <div className="admin-headleft">
            <h1 className="admin-title">Admin</h1>
          </div>
          <div className="admin-headright">
            <Link href="/" className="chip" style={{ background: "transparent", borderColor: "rgba(255,255,255,.5)", color: "#fff" }}>View site</Link>
          </div>
        </header>
        <NotificationHandler>{children}</NotificationHandler>
      </main>
    </div>
  );
}
