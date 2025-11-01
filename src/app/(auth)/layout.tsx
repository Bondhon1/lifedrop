import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold text-primary">
            Lifedrop
          </Link>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-xl rounded-3xl border border-soft bg-surface-card p-8 shadow-soft">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
