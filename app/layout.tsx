import type { Metadata, Viewport } from "next";
import { Big_Shoulders, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

// "Big Shoulders Display" is now "Big Shoulders" on Google Fonts; the display cut is its high opsz range.
const display = Big_Shoulders({ subsets: ["latin"], axes: ["opsz"], variable: "--font-big-shoulders" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex-mono" });
const sans = Instrument_Sans({ subsets: ["latin"], variable: "--font-instrument" });

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "WEI THE DOG",
  description:
    "A colonist alone on Mars, sending ETH home to his family. A rover that turned hostile. And a dog that cannot die, as long as the chain lives.",
  openGraph: { images: ["/wei-assets/hero.jpg"] },
  twitter: { card: "summary_large_image", images: ["/wei-assets/hero.jpg"] },
};

export const viewport: Viewport = { themeColor: "#120A07" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${mono.variable} ${sans.variable}`}>
      <head>
        {/* Lets CSS hide scroll-reveal elements only when JS will reveal them. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
