import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Browse from "@/components/Browse";
import { getActivitiesForPlaces, getCountry, getDestinations, getEngagementForPlaces, getStaysCounts, getViewCounts } from "@/lib/data";

export const revalidate = 3600; // regenerate at most hourly, no redeploy needed after content edits

type P = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await getCountry((await params).country);
  return c ? { title: `${c.name} travel guides`, description: `Honest travel times, rough costs and local tips for ${c.name}, from a guide who takes people there.` } : {};
}

export default async function Country({ params }: P) {
  const c = await getCountry((await params).country);
  if (!c) notFound();
  const items = await getDestinations(c.id);
  const placeIds = items.map(i => i.place_id);
  const paths = items.map(i => `/${c.slug}/${i.places.slug}`);
  noStore();
  const [activitiesByPlace, viewCounts, engagement, staysCount] = await Promise.all([
    getActivitiesForPlaces(placeIds),
    getViewCounts(paths),
    getEngagementForPlaces(placeIds),
    getStaysCounts(placeIds),
  ]);
  return (
    <>
      <section className="hero"><div className="wrap">
        <h1>Know {c.name}, before you go.</h1>
        {/* <h1>Know your Destination before you go.</h1> */}
        <p>Best Travel times, rough costs and a local tip for every destination.</p>
      </div></section>
      <Browse country={c.slug} items={items} activitiesByPlace={activitiesByPlace} viewCounts={viewCounts} engagement={engagement} staysCount={staysCount} />
    </>
  );
}
