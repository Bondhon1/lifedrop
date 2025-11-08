import Link from "next/link";
import type { ReactNode } from "react";
import { Heart } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import Image from "next/image";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <PublicNavbar />
      
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl">
        {/* Left side - Form */}
        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Right side - Image (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-accent/10 lg:to-accent/5">
          <div className="relative h-full w-full p-12">
            <div className="flex h-full flex-col items-center justify-center gap-8 text-center">
              <div className="rounded-3xl bg-white/80 p-8 shadow-xl backdrop-blur dark:bg-gray-900/80">
                <Heart className="mx-auto h-24 w-24 text-accent" fill="currentColor" />
              </div>
              <div className="max-w-md">
                <h2 className="mb-4 text-3xl font-bold text-primary">
                  Save Lives Together
                </h2>
                <p className="text-lg text-secondary">
                  Join 8,500+ verified donors making a difference in their communities through real-time blood donation coordination.
                </p>
              </div>
              <div className="grid w-full max-w-sm gap-4">
                <div className="rounded-xl border border-soft bg-surface-card/50 p-4 backdrop-blur">
                  <div className="text-3xl font-bold text-accent">3.2k</div>
                  <div className="text-sm text-secondary">Requests Matched</div>
                </div>
                <div className="rounded-xl border border-soft bg-surface-card/50 p-4 backdrop-blur">
                  <div className="text-3xl font-bold text-accent">14 min</div>
                  <div className="text-sm text-secondary">Avg Response Time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
