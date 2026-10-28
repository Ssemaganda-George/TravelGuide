import Country from "./[country]/page";
import type { Metadata } from "next";
import { SITE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_TAGLINE,
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    type: "website",
    locale: "en_GB",
    url: SITE,
    siteName: SITE_NAME,
    images: [{ url: `${SITE}/logo/logo1.png`, width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [`${SITE}/logo/logo1.png`],
  },
  robots: { index: true, follow: true },
};

// Home shows Uganda for now. Add a country picker when a second country exists.
export default async function Home() {
  return Country({ params: Promise.resolve({ country: "uganda" }) });
}
