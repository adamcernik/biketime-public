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
  metadataBase: new URL('https://biketime.cz'), // Replace with your actual domain
  // Next.js automatically uses /src/app/opengraph-image.png for Open Graph!
  // No need to manually specify the image - it's detected automatically
  openGraph: {
    title: "Biketime – kola Bulls v ČR",
    description: "Objevte kompletní nabídku kol Bulls. E-bikes, horská kola, trekingová kola a další.",
    url: 'https://biketime.cz',
    siteName: 'Biketime',
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Biketime – kola Bulls v ČR",
    description: "Objevte kompletní nabídku kol Bulls. E-bikes, horská kola, trekingová kola a další.",
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
