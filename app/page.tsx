import Country from "./[country]/page";
import type { Metadata } from "next";
import { SITE_HOME_TITLE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: SITE_HOME_TITLE },
  description: SITE_TAGLINE,
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_HOME_TITLE,
    description: SITE_TAGLINE,
    type: "website",
    locale: "en_GB",
    url: "/",
    siteName: SITE_NAME,
    images: [{ url: "/logo/logo1.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_HOME_TITLE,
    description: SITE_TAGLINE,
    images: ["/logo/logo1.png"],
  },
  robots: { index: true, follow: true },
};

// Home shows Uganda for now. Add a country picker when a second country exists.
export default async function Home() {
  return Country({ params: Promise.resolve({ country: "uganda" }) });
}
