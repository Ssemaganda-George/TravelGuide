import type { Metadata } from "next";
import Script from "next/script";
import PageView from "@/components/PageView";
import { ToastContainer } from "@/components/Toast";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ChatBot } from "@/components/ChatBot";
import { Bricolage_Grotesque, Source_Serif_4 } from "next/font/google";
import { SITE, SITE_NAME, SITE_TAGLINE } from "@/lib/site";
import "./globals.css";

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
  },
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
        <header className="site-header">
          <div className="wrap">
            <a href="/" className="brand" aria-label={`${SITE_NAME} - Home`}>
              <svg className="brand-icon" viewBox="0 0 32 32" aria-hidden="true">
                <rect width="32" height="32" rx="6" fill="var(--lake)"/>
                <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fontFamily="system-ui, sans-serif" fontWeight="700" fontSize="18" fill="white">TI</text>
              </svg>
              <span className="brand-text">{SITE_NAME}</span>
            </a>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="about"><div className="wrap">
          <strong>Written by George.</strong> I&apos;m a Kampala-based guide and tech person who takes travellers around the World. These are the tips I give my own clients and i am happy to share with You. Know your next destination before you go.
        </div></footer>
        {process.env.NEXT_PUBLIC_ANALYTICS_SRC && <Script defer data-domain={process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN} src={process.env.NEXT_PUBLIC_ANALYTICS_SRC} />}
        <PageView />
        <ToastContainer />
        <WhatsAppButton />
        <ChatBot />
      </body>
    </html>
  );
}
