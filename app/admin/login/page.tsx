import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false } };

async function signIn(fd: FormData) {
  "use server";
  const sb = await authClient();
  const { error } = await sb.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
  redirect(error ? "/admin/login?error=1" : "/admin");
}

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <div className="wrap page">
      <h1>Admin sign in</h1>
      <form className="form" action={signIn}>
        <label htmlFor="email">Email</label><input id="email" name="email" type="email" required autoComplete="email" />
        <label htmlFor="password">Password</label><input id="password" name="password" type="password" required autoComplete="current-password" />
        <button className="go">Sign in</button>
        {error && <p className="msg" role="alert">Wrong email or password.</p>}
      </form>
    </div>
  );
}
