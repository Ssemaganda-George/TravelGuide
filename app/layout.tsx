import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import PageView from "@/components/PageView";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import { SITE } from "@/lib/data";
import "./globals.css";

const head = Bricolage_Grotesque({ subsets: ["latin"], variable: "--head" });
const body = Source_Serif_4({ subsets: ["latin"], variable: "--body" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Uganda Guide", template: "%s | Uganda Guide" },
  description: "Uganda, told by a guide who takes people there.",
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`}>
      <body>
        <header><div className="wrap"><Link className="brand" href="/">Uganda Guide</Link></div></header>
        <main>{children}</main>
        <footer className="about"><div className="wrap">
          <strong>Written by George.</strong> I&apos;m a Kampala-based guide and tech person who takes travellers around Uganda. These guides come from real trips, with the tips I give my own clients. Prices and times are approximate; each page shows when it was last checked. Page views are counted anonymously, without cookies or stored IP addresses.
        </div></footer>
      {process.env.NEXT_PUBLIC_ANALYTICS_SRC && <Script defer data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} src={process.env.NEXT_PUBLIC_ANALYTICS_SRC} />}
      <PageView />
      </body>
    </html>
  );
}
