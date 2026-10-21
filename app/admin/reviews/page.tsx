import Link from "next/link";
import { notFound } from "next/navigation";
import { admin } from "@/lib/admin";
import { revalidatePath } from "next/cache";
import { authClient } from "@/lib/supabase/server";
import { getCountry, getDestinations } from "@/lib/data";

export const dynamic = "force-dynamic";

// Server actions defined inline to avoid webpack module resolution issues in Next.js 15.5.28
async function setReviewStatus(fd: FormData) {
  "use server";
  const sb = await authClient();
  const id = String(fd.get("id"));
  const status = String(fd.get("status"));
  await sb.from("destination_reviews").update({
    status: status as any, reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath("/admin/reviews");
}

async function archiveReview(fd: FormData) {
  "use server";
  const sb = await authClient();
  const id = String(fd.get("id"));
  await sb.from("destination_reviews").update({
    archived: true, reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath("/admin/reviews");
}

async function unarchiveReview(fd: FormData) {
  "use server";
  const sb = await authClient();
  const id = String(fd.get("id"));
  await sb.from("destination_reviews").update({
    archived: false, reviewed_at: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath("/admin/reviews");
}

export default async function Reviews() {
  const sb = await admin();
  if (!sb) return <div className="wrap page"><h1>No access</h1></div>;

  const [{ data: reviews }, { data: countries }] = await Promise.all([
    sb.from("destination_reviews").select("*, places(name,slug,parent_id)").order("created_at", { ascending: false }),
    sb.from("places").select("id,name,slug,parent_id").eq("type", "country"),
  ]);
  const rows = (reviews ?? []).filter(r => r.places?.parent_id && !r.archived);

  // Build country -> destination map
  const countryMap = new Map((countries ?? []).map(c => [c.id, c]));
  const destMap = new Map<string, { name: string; slug: string; country: string }>();
  for (const r of rows) {
    const p = r.places as { name: string; slug: string; parent_id: string } | null;
    if (!p) continue;
    const c = countryMap.get(p.parent_id);
    destMap.set(r.place_id, { name: p.name, slug: p.slug, country: c?.name ?? "Unknown" });
  }

  const byStatus = {
    pending: rows.filter(r => r.status === "pending"),
    approved: rows.filter(r => r.status === "approved"),
    rejected: rows.filter(r => r.status === "rejected"),
  };

  return (
    <div className="wrap page">
      <h1>Review moderation</h1>
      <p className="hook">{byStatus.pending.length} pending · {byStatus.approved.length} approved · {byStatus.rejected.length} rejected</p>

      <section className="fsec">
        <h3>Pending reviews</h3>
        {byStatus.pending.length === 0 && <p className="meta">No reviews waiting for approval.</p>}
        {byStatus.pending.map(r => (
          <div className="item" key={r.id}>
            <div className="ihead">
              <strong>{r.author}</strong>
              <span className="badge badge-new">Pending</span>
            </div>
            <div className="meta">{destMap.get(r.place_id)?.name ?? "Unknown"} · {destMap.get(r.place_id)?.country ?? ""}</div>
            <div className="stars" style={{ margin: "6px 0" }}>{stars(r.rating)}</div>
            {r.comment && <p>{r.comment}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <form action={setReviewStatus} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="approved" />
                <button className="go" style={{ width: "auto", padding: "6px 14px" }}>Approve</button>
              </form>
              <form action={setReviewStatus} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="rejected" />
                <button className="chip" style={{ width: "auto", padding: "6px 14px", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>Reject</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="fsec">
        <h3>Approved reviews</h3>
        {byStatus.approved.length === 0 && <p className="meta">No approved reviews yet.</p>}
        {byStatus.approved.map(r => (
          <div className="item" key={r.id}>
            <div className="ihead">
              <strong>{r.author}</strong>
              <span className="badge badge-approved">Approved</span>
            </div>
            <div className="meta">{destMap.get(r.place_id)?.name ?? "Unknown"} · {new Date(r.created_at).toLocaleDateString()}</div>
            <div className="stars" style={{ margin: "6px 0" }}>{stars(r.rating)}</div>
            {r.comment && <p>{r.comment}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <form action={setReviewStatus} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="pending" />
                <button className="chip" style={{ width: "auto", padding: "6px 14px", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>Unapprove</button>
              </form>
              <form action={setReviewStatus} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="rejected" />
                <button className="chip" style={{ width: "auto", padding: "6px 14px", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>Reject</button>
              </form>
              <form action={archiveReview} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={r.id} />
                <button className="chip" style={{ width: "auto", padding: "6px 14px", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>Archive</button>
              </form>
            </div>
          </div>
        ))}
      </section>

      <section className="fsec">
        <h3>Rejected reviews</h3>
        {byStatus.rejected.length === 0 && <p className="meta">No rejected reviews.</p>}
        {byStatus.rejected.map(r => (
          <div className="item" key={r.id}>
            <div className="ihead">
              <strong>{r.author}</strong>
              <span className="badge badge-rejected">Rejected</span>
            </div>
            <div className="meta">{destMap.get(r.place_id)?.name ?? "Unknown"} · {new Date(r.created_at).toLocaleDateString()}</div>
            <div className="stars" style={{ margin: "6px 0" }}>{stars(r.rating)}</div>
            {r.comment && <p>{r.comment}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <form action={setReviewStatus} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="status" value="pending" />
                <button className="chip" style={{ width: "auto", padding: "6px 14px", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>Recall</button>
              </form>
              <form action={archiveReview} style={{ margin: 0 }}>
                <input type="hidden" name="id" value={r.id} />
                <button className="chip" style={{ width: "auto", padding: "6px 14px", background: "transparent", borderColor: "var(--muted)", color: "var(--muted)" }}>Archive</button>
              </form>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function stars(n: number) {
  const full = Math.floor(n);
  const half = n % 1 >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <span className="stars" aria-label={`${n.toFixed(1)} of 5`}>
      {Array.from({ length: full }).map(() => "★")}
      {half && "☆"}
      {Array.from({ length: empty }).map(() => "☆")}
    </span>
  );
}
