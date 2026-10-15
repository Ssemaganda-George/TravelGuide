import Link from "next/link";
import { authClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const sb = await authClient();
  const { data: { user } } = await sb.auth.getUser();
  return (
    <>
      {user && (
        <nav className="adminnav wrap" aria-label="Admin">
          <Link href="/admin">Enquiries</Link><Link href="/admin/referrals">Referrals</Link>
          <Link href="/admin/partners">Partners</Link><Link href="/admin/content">Content</Link>
          <Link href="/admin/insights">Insights</Link>
        </nav>
      )}
      {children}
    </>
  );
}
