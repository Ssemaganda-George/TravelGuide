import type { MetadataRoute } from "next";
import { getCountries, getDestinations } from "@/lib/data";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const out: MetadataRoute.Sitemap = [{ url: absoluteUrl("/") }];
  for (const c of await getCountries()) {
    out.push({ url: absoluteUrl(`/${c.slug}`) });
    for (const d of await getDestinations(c.id, c.slug)) {
      out.push({
        url: absoluteUrl(`/${c.slug}/${d.places.slug}`),
        lastModified: d.last_checked ?? undefined,
      });
    }
  }
  return out;
}
