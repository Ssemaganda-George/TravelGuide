import type { MetadataRoute } from "next";
import { SITE, getCountries, getDestinations } from "@/lib/data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [{ url: SITE }];
  for (const c of await getCountries()) {
    out.push({ url: `${SITE}/${c.slug}` });
    for (const d of await getDestinations(c.id)) out.push({ url: `${SITE}/${c.slug}/${d.places.slug}`, lastModified: d.last_checked ?? undefined });
  }
  return out;
}
