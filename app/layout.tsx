import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import type { Metadata } from "next";
import Script from "next/script";
import PageView from "@/components/PageView";
import { ToastContainer } from "@/components/Toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChatBot } from "@/components/ChatBot";
import BackToTop from "@/components/BackToTop";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import { SITE, SITE_HOME_TITLE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

const fontHead = Bricolage_Grotesque({ subsets: ["latin"], variable: "--head" });
const fontBody = Source_Serif_4({ subsets: ["latin"], variable: "--body" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: SITE_HOME_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_TAGLINE,
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION }
    : undefined,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_GB",
    url: "/",
    title: SITE_HOME_TITLE,
    description: SITE_TAGLINE,
    images: [
      {
        // Relative to metadataBase — avoids double-host bugs if SITE_URL is mis-set
        url: "/logo/logo1.png",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@tripinsights",
    creator: "@george_travels",
    title: SITE_HOME_TITLE,
    description: SITE_TAGLINE,
    images: ["/logo/logo1.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg" }],
  },
  manifest: "/manifest.json",
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontHead.variable} ${fontBody.variable}`}>
      <head />
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <SiteHeader />
        <main id="main">{children}</main>
        <footer className="about">
          <div className="wrap">
            <div className="footer-content">
              <div className="footer-about">
                <Link href="/about" className="footer-about-link">
                  About
                </Link>
              </div>
              <div className="footer-links">
                <Link href="/terms">Terms</Link>
                <Link href="/privacy">Privacy</Link>
                <a
                  href="https://www.linkedin.com/company/trip-insights/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  style={{
                    color: "var(--lake)",
                    textDecoration: "none",
                    marginLeft: 16,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  <Image src="/logo/Linkedin.png" alt="LinkedIn" width={20} height={20} style={{ display: "block" }} />
                </a>
              </div>
            </div>
          </div>
        </footer>
        {process.env.NEXT_PUBLIC_ANALYTICS_SRC && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN}
            src={process.env.NEXT_PUBLIC_ANALYTICS_SRC}
          />
        )}
        <PageView />
        <ToastContainer />
        <WhatsAppButton />
        <ChatBot />
        <BackToTop />
      </body>
    </html>
  );
}
