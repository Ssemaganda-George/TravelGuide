import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import Image from "next/image";
import PageView from "@/components/PageView";
import StickyCta from "@/components/StickyCta";
import BackToTop from "@/components/BackToTop";
import { DialogProvider } from "@/components/DialogContext";
import { ToastContainer } from "@/components/Toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChatBot } from "@/components/ChatBot";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import { SITE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";
import "./tailwind-entry.css";

const head = Bricolage_Grotesque({ subsets: ["latin"], variable: "--head" });
const body = Source_Serif_4({ subsets: ["latin"], variable: "--body" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_TAGLINE,
  verification: process.env.NEXT_PUBLIC_GSC_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } : undefined,
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "en_GB",
    url: SITE,
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [
      {
        url: `${SITE}/og-default.jpg`,
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
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [`${SITE}/og-default.jpg`],
  },
  robots: { index: true, follow: true },
};

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${head.variable} ${body.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={SITE} />
      </head>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <DialogProvider>
          <main id="main">{children}</main>
          <footer className="about site-footer">
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
          {process.env.NEXT_PUBLIC_ANALYTICS_SRC && <Script defer data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} src={process.env.NEXT_PUBLIC_ANALYTICS_SRC} />}
          <PageView />
          <StickyCta />
          <ToastContainer />
          <WhatsAppButton />
          <ChatBot />
          <BackToTop />
        </DialogProvider>
      </body>
    </html>
  );
}