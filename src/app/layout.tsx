import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import AuthProvider from "@/components/AuthProvider";
import CookieBanner from "@/components/CookieBanner";
import CSPostHogProvider from '@/components/PostHogProvider'
import PostHogPageView from "@/components/PostHogPageView"
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kola a elektrokola BULLS – Oficiální distribuce | Biketime.cz",
  description: "Objevte špičková německá kola BULLS. Biketime zajišťuje velkoobchodní prodej a technickou podporu pro partnery. Najděte nejnovější modely Sonic, Vuca a další.",
  metadataBase: new URL('https://biketime.cz'),
  openGraph: {
    title: "Kola a elektrokola BULLS – Oficiální distribuce | Biketime.cz",
    description: "Objevte špičková německá kola BULLS. Biketime zajišťuje velkoobchodní prodej a technickou podporu pro partnery. Najděte nejnovější modely Sonic, Vuca a další.",
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
    title: "Kola a elektrokola BULLS – Oficiální distribuce | Biketime.cz",
    description: "Objevte špičková německá kola BULLS. Biketime zajišťuje velkoobchodní prodej a technickou podporu pro partnery. Najděte nejnovější modely Sonic, Vuca a další.",
    images: ['/opengraph-image.png'],
  },
  verification: {
    google: "kVOuQFee61z35i09I0b0Ow2CRM8F6GTg-yTyIWHBoMU",
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
          <CSPostHogProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <SiteHeader />
            {children}
            <SiteFooter />
            <CookieBanner />
          </CSPostHogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
