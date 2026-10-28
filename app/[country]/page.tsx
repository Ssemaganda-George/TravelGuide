import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import Browse from "@/components/Browse";
import JourneyAnimation from "@/components/JourneyAnimation";
import { getActivitiesForPlaces, getCountry, getDestinations, getEngagementForPlaces, getStaysCounts, getStays, getViewCounts } from "@/lib/data";
import { SITE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 3600; // regenerate at most hourly, no redeploy needed after content edits

type P = { params: Promise<{ country: string }>; searchParams?: Promise<{ [key: string]: string | string[] | undefined }> };

export async function generateMetadata({ params, searchParams }: P): Promise<Metadata> {
  const c = await getCountry((await params).country);
  if (!c) return {};
  const ogImage = `${SITE}/logo/logo1.png`;
  const sp = (await searchParams) ?? {};
  const hasFilters = Boolean(sp.destination || sp.tag || sp.q);
  const title = `${c.name} Travel Guide: Best Time to Visit, Costs & Local Tips | ${SITE_NAME}`;
  const description = `Honest travel times, rough costs and local tips for ${c.name}. Gorilla trekking, Jinja, Murchison Falls and more from a Kampala-based guide.`;
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/${c.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_GB",
      url: `${SITE}/${c.slug}`,
      siteName: SITE_NAME,
      images: [{ url: `${SITE}/logo/logo1.png`, width: 1200, height: 630, alt: `${c.name} travel guides` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${SITE}/logo/logo1.png`],
    },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default async function Country({ params }: P) {
  const c = await getCountry((await params).country);
  if (!c) notFound();
  const items = await getDestinations(c.id, c.slug);
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
      <section className="hero">
        <JourneyAnimation />
        <div className="wrap" style={{ position: "relative", zIndex: 1 }}>
          <h1>Know Your Destination, before you go.</h1>
          {/* <h1>Know your Destination before you go.</h1> */}
          <p>{SITE_TAGLINE}</p>
        </div>
      </section>
      <Browse country={c.slug} items={items} activitiesByPlace={activitiesByPlace} viewCounts={viewCounts} engagement={engagement} staysCount={staysCount} staysByPlace={staysByPlace} />
    </>
  );
}
