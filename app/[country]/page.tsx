import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Browse from "@/components/Browse";
import { getCountry, getDestinations } from "@/lib/data";

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
  return (
    <>
      <section className="hero"><div className="wrap">
        <h1>{c.name}, and Tourism around Africa.</h1>
        <p>Best Travel times, rough costs and a local tip for every destination.</p>
      </div></section>
      <Browse country={c.slug} items={items} />
    </>
  );
}
