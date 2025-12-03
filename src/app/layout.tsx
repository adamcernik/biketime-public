import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthProvider from "@/components/AuthProvider";
import CookieBanner from "@/components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Biketime",
  description: "Biketime – kola Bulls v ČR",
  metadataBase: new URL('https://biketime.cz'),
  openGraph: {
    title: "Biketime – kola Bulls v ČR",
    description: "Objevte kompletní nabídku kol Bulls. E-bikes, horská kola, trekingová kola a další.",
    url: 'https://biketime.cz',
    siteName: 'Biketime',
    // Explicitly add image to ensure it's picked up by all platforms
    // Next.js will also auto-detect opengraph-image.png, but this ensures compatibility
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Biketime – kola Bulls v ČR',
      },
    ],
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Biketime – kola Bulls v ČR",
    description: "Objevte kompletní nabídku kol Bulls. E-bikes, horská kola, trekingová kola a další.",
    images: ['/opengraph-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
          <CookieBanner />
        </AuthProvider>
      </body>
    </html>
  );
}
