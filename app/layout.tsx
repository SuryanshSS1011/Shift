import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { ServiceWorkerRegistration } from "@/components/providers/ServiceWorkerRegistration";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Shift - AI-Powered Sustainability Actions",
  description: "One personalized micro-action per day to reduce your carbon footprint",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shift",
  },
  openGraph: {
    title: "Shift - AI-Powered Sustainability Actions",
    description: "One personalized micro-action per day to reduce your carbon footprint",
    type: "website",
    siteName: "Shift",
  },
  twitter: {
    card: "summary_large_image",
    title: "Shift - AI-Powered Sustainability Actions",
    description: "One personalized micro-action per day to reduce your carbon footprint",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased dark`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <Suspense fallback={null}>
          <PostHogProvider>
            <ServiceWorkerRegistration />
            {children}
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  );
}
