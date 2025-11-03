import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blood Donation Network",
  description:
    "Find donors, manage blood requests, and collaborate in real time with a modern, full-stack experience.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-page text-primary antialiased overflow-x-hidden`}
      >
        <Providers>
          <div className="relative mx-auto min-h-screen w-full max-w-[1440px] px-4 pb-12 pt-6 sm:px-8">
            {children}
          </div>
          <Analytics />
        </Providers>
      </body>
    </html>
  );
}
