"use client";

import Link from "next/link";
import { Droplets } from "lucide-react";
import Image from "next/image";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function PublicNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-soft bg-surface-card/95 backdrop-blur supports-[backdrop-filter]:bg-surface-card/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-card shadow-soft overflow-hidden">
                <Image src="/logo.png" alt="Lifedrop" width={44} height={44} className="object-contain" />
              </div>
              <span className="text-lg font-semibold text-primary">Lifedrop</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-6">
              <Link
                href="/docs/getting-started"
                className="text-sm font-medium text-secondary transition-colors hover:text-primary"
              >
                Getting Started
              </Link>
              <Link
                href="/features"
                className="text-sm font-medium text-secondary transition-colors hover:text-primary"
              >
                Features
              </Link>
              <Link
                href="/about"
                className="text-sm font-medium text-secondary transition-colors hover:text-primary"
              >
                About
              </Link>
              <Link
                href="/contact"
                className="text-sm font-medium text-secondary transition-colors hover:text-primary"
              >
                Contact
              </Link>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Sign Up</Button>
            </Link>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-secondary hover:bg-surface-hover hover:text-primary"
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-soft py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <Link
                href="/docs/getting-started"
                className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Getting Started
              </Link>
              <Link
                href="/features"
                className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="/about"
                className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link
                href="/contact"
                className="rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/login"
                className="mt-2 rounded-lg px-3 py-2 text-sm font-medium text-secondary transition-colors hover:bg-surface-hover hover:text-primary sm:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Log In
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
