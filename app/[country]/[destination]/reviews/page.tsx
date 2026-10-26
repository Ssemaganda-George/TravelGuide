import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import ReviewForm from "@/components/reviews/ReviewForm";
import ActivityCards from "@/components/ActivityCards";
import { getCountry, getDestinations, getStays, getActivities } from "@/lib/data";
import { authClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

type P = { params: Promise<{ country: string; destination: string }> };

export default async function ReviewsPage({ params }: P) {
  const { country, destination } = await params;
  const c = await getCountry(country);
  if (!c) notFound();
  const d = (await getDestinations(c.id)).find(x => x.places.slug === destination);
  if (!d) notFound();

  const sb = await authClient();
  const { data: { user } } = await sb.auth.getUser();

  const path = `/${c.slug}/${d.places.slug}`;
  const [activities, stayCount] = await Promise.all([
    getActivities(d.place_id),
    getStays(d.place_id).then(s => s.length),
  ]);

  return (
    <div className="wrap page">
      <Link className="back" href={path}>Back to {d.title}</Link>
      <h1>Reviews for {d.title}</h1>
      <p className="meta">{stayCount} place{stayCount !== 1 ? "s" : ""} to stay nearby</p>

      {activities.length > 0 && (
        <ActivityCards activities={activities} country={c.slug} placeId={d.place_id} destinationTitle={d.title} />
      )}

      <ReviewForm placeId={d.place_id} title={d.title} user={user} />
    </div>
  );
}
