import Link from "next/link";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { NotificationHandler } from "@/components/NotificationWrapper";
import { SignOutButton } from "@/components/SignOutButton";
import { SITE_NAME } from "@/lib/site";
import MobileAdminMenu from "@/components/MobileAdminMenu";

const SECTIONS: Record<string, { title: string; sub: string }> = {
  "/admin": { title: "Enquiries", sub: "Manage traveller enquiries and reply to guests." },
  "/admin/referrals": { title: "Referrals & commissions", sub: "Track partner referrals and commissions due." },
  "/admin/partners": { title: "Partners", sub: "Lodges, operators, drivers and activity partners." },
  "/admin/content": { title: "Destination content", sub: "Edit destination pages, stories, activities and stays." },
  "/admin/insights": { title: "Insights", sub: "Views, visitors and enquiry trends over the last 30 days." },
  "/admin/reviews": { title: "Review moderation", sub: "Approve or reject traveller reviews before they appear publicly." },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await authClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return children;
  return (
    <div className="appshell">
      <MobileAdminMenu user={user} />
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
