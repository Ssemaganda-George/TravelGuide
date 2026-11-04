import { revalidatePath } from "next/cache";
import { admin } from "@/lib/admin";
import { authClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function setReviewStatus(fd: FormData) {
  "use server";
  const sb = await authClient();
  await sb.from("destination_reviews").update({
    status: String(fd.get("status")) as "pending" | "approved" | "rejected",
    reviewed_at: new Date().toISOString(),
  }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/reviews");
}

async function archiveReview(fd: FormData) {
  "use server";
  const sb = await authClient();
  await sb.from("destination_reviews").update({
    archived: true, reviewed_at: new Date().toISOString(),
  }).eq("id", String(fd.get("id")));
  revalidatePath("/admin/reviews");
}

type Review = {
  id: string;
  author: string;
  place_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  status: string;
};

function ReviewCard({ review: r, destination }: { review: Review; destination: string }) {
  const actions = r.status === "pending"
    ? [["Approve", "approved"], ["Reject", "rejected"]]
    : r.status === "approved"
      ? [["Unapprove", "pending"], ["Reject", "rejected"]]
      : [["Recall", "pending"]];

  return <Card className="min-w-0">
    <CardHeader className="pb-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <CardTitle className="break-words text-base font-semibold">{r.author}</CardTitle>
        <Badge variant={r.status === "approved" ? "secondary" : r.status === "rejected" ? "destructive" : "outline"} className="capitalize">{r.status}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{destination} · {new Date(r.created_at).toLocaleDateString("en-GB")}</p>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-foreground" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(Math.max(0, Math.min(5, Math.floor(r.rating))))}{"☆".repeat(Math.max(0, 5 - Math.floor(r.rating)))}</p>
      {r.comment && <p className="max-w-prose whitespace-pre-wrap break-words text-sm leading-6">{r.comment}</p>}
      <div className="flex flex-wrap gap-2 pt-1">
        {actions.map(([label, status]) => <form action={setReviewStatus} key={status}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="status" value={status} />
          <Button type="submit" size="sm" variant={status === "approved" ? "default" : "outline"}>{label}</Button>
        </form>)}
        {r.status !== "pending" && <form action={archiveReview}>
          <input type="hidden" name="id" value={r.id} />
          <Button type="submit" size="sm" variant="ghost">Archive</Button>
        </form>}
      </div>
    </CardContent>
  </Card>;
}

export default async function Reviews() {
  const sb = await admin();
  if (!sb) return <div className="p-6"><h1>No access</h1></div>;
  const [{ data: reviews }, { data: countries }] = await Promise.all([
    sb.from("destination_reviews").select("*, places(name,slug,parent_id)").order("created_at", { ascending: false }),
    sb.from("places").select("id,name,slug,parent_id").eq("type", "country"),
  ]);
  const rows = (reviews ?? []).filter(r => r.places?.parent_id && !r.archived) as Review[];
  const countryMap = new Map((countries ?? []).map(c => [c.id, c]));
  const destinations = new Map<string, string>();
  for (const r of reviews ?? []) {
    const place = r.places as { name: string; parent_id: string } | null;
    if (place) destinations.set(r.place_id, `${place.name} · ${countryMap.get(place.parent_id)?.name ?? "Unknown"}`);
  }
  const groups = [
    { status: "pending", title: "Pending reviews", empty: "No reviews waiting for approval." },
    { status: "approved", title: "Approved reviews", empty: "No approved reviews yet." },
    { status: "rejected", title: "Rejected reviews", empty: "No rejected reviews." },
  ];

  return <div className="mx-auto w-full max-w-5xl space-y-8 py-2">
    <div><h1 className="text-2xl font-semibold tracking-tight">Review moderation</h1>
      <p className="mt-2 text-sm text-muted-foreground">{rows.filter(r => r.status === "pending").length} pending · {rows.filter(r => r.status === "approved").length} approved · {rows.filter(r => r.status === "rejected").length} rejected</p>
    </div>
    {groups.map(group => {
      const items = rows.filter(r => r.status === group.status);
      return <section key={group.status} className="space-y-3">
        <h2 className="text-lg font-semibold">{group.title}</h2>
        {items.length ? <div className="space-y-3">{items.map(r => <ReviewCard key={r.id} review={r} destination={destinations.get(r.place_id) ?? "Unknown destination"} />)}</div>
          : <p className="rounded-lg border bg-card px-5 py-6 text-sm text-muted-foreground">{group.empty}</p>}
      </section>;
    })}
  </div>;
}
