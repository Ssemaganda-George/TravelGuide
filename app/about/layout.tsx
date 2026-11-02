import type { Metadata } from "next";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const metadata: Metadata = {
  title: `About ${SITE_NAME} — Kampala-based Uganda travel guides`,
  description:
    "Trip Insights is run by George, a Kampala-based guide. Honest Uganda travel guides for diaspora and global travellers — real costs, travel times, and local tips.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: `About ${SITE_NAME}`,
    description: SITE_TAGLINE,
    url: "/about",
    images: [{ url: "/logo/logo1.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
