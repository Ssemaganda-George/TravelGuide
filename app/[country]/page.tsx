import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Browse from "@/components/Browse";
import { getActivitiesForPlaces, getCountry, getDestinations, getEngagementForPlaces, getStaysCounts, getStays, getViewCounts } from "@/lib/data";
import { SITE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 3600; // regenerate at most hourly, no redeploy needed after content edits

type P = { params: Promise<{ country: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const c = await getCountry((await params).country);
  if (!c) return {};
  const ogImage = `${SITE}/og-default.jpg`;
  return {
    title: `${c.name} travel guides`,
    description: `Honest travel times, rough costs and local tips for ${c.name}, from a guide who takes people there.`,
    openGraph: {
      title: `${c.name} travel guides | ${SITE_NAME}`,
      description: `Honest travel times, rough costs and local tips for ${c.name}, from a guide who takes people there.`,
      type: "website",
      locale: "en_GB",
      url: `${SITE}/${c.slug}`,
      siteName: SITE_NAME,
      images: [{ url: `${SITE}/og-default.jpg`, width: 1200, height: 630, alt: `${c.name} travel guides` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${c.name} travel guides | ${SITE_NAME}`,
      description: `Honest travel times, rough costs and local tips for ${c.name}.`,
      images: [`${SITE}/og-default.jpg`],
    },
  };
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
  // Fetch stays for all destinations
  const allStays = await Promise.all(
    placeIds.map(pid => getStays(pid))
  );
  const staysByPlace: Record<string, any[]> = {};
  placeIds.forEach((pid, i) => {
    staysByPlace[pid] = allStays[i];
  });
  return (
    <>
      <section className="hero"><div className="wrap">
        <h1>Know Your Destination, before you go.</h1>
        {/* <h1>Know your Destination before you go.</h1> */}
        <p>{SITE_TAGLINE}</p>
      </div></section>
      <Browse country={c.slug} items={items} activitiesByPlace={activitiesByPlace} viewCounts={viewCounts} engagement={engagement} staysCount={staysCount} staysByPlace={staysByPlace} />
    </>
  );
}
