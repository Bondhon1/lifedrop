import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { Providers } from "./providers";
import { generateOrganizationSchema, generateWebsiteSchema } from "@/lib/seo-schemas";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Lifedrop | Blood Donation Coordination Platform",
    template: "%s | Lifedrop",
  },
  description: "Lifedrop connects patients, donors, and coordinators with real-time communication and transparent tracking for every blood donation request. Find blood donors near you or become a life-saving donor today.",
  keywords: [
    "blood donation",
    "blood donor",
    "find blood donor",
    "donate blood",
    "emergency blood request",
    "blood donation platform",
    "donor network",
    "lifedrop",
    "blood bank",
    "save lives",
    "blood group matching",
    "urgent blood needed",
    "blood donation coordination",
    "real-time blood requests",
    "blood donation management",
    "Blood donor needed",
    "Blood donation app",
    "Find blood donors near me",
    "blood donation coordination platform",
    "Blood donors needed"
  ],
  authors: [{ name: "Lifedrop Team" }],
  creator: "Lifedrop",
  publisher: "Lifedrop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://www.lifedrop.live"),

  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lifedrop",
    title: "Lifedrop | Blood Donation Coordination Platform",
    description: "Connect with blood donors in real-time. Save lives through our transparent blood donation coordination platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lifedrop - Blood Donation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lifedrop | Blood Donation Coordination Platform",
    description: "Connect with blood donors in real-time. Save lives through our transparent blood donation coordination platform.",
    images: ["/og-image.png"],
    creator: "@lifedrop",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/favicon.png", type: "image/png", sizes: "64x64" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
        { url: "/logo.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/logo.png",
  },
  verification: {
    google: "3910f7d6f9032e3a",
    // yandex: "your-yandex-verification-code",
    // yahoo: "your-yahoo-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebsiteSchema();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
