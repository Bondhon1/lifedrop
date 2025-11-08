import { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - LifeDrop",
  description:
    "Learn about LifeDrop's mission to save lives through better blood donation coordination.",
};

export default function AboutPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gradient-to-b from-surface-card to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-accent/10 p-4">
              <Heart className="h-12 w-12 text-accent" fill="currentColor" />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-primary sm:text-5xl">
              About LifeDrop
            </h1>
            <p className="text-xl text-secondary">
              Connecting donors with those in need, one drop at a time.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <section className="rounded-2xl border border-soft bg-surface-card p-8">
              <h2 className="mb-4 text-2xl font-bold text-primary">Our Mission</h2>
              <p className="text-lg leading-relaxed text-secondary">
                LifeDrop exists to eliminate the chaos and delays in blood donation coordination.
                We believe that finding a blood donor should be as simple as a few clicks, not
                hours of desperate phone calls. Our platform connects patients, donors, and
                hospitals in real-time, ensuring that every urgent blood need is met quickly
                and efficiently.
              </p>
            </section>

            <section className="rounded-2xl border border-soft bg-surface-card p-8">
              <h2 className="mb-4 text-2xl font-bold text-primary">What We Do</h2>
              <p className="mb-4 text-lg leading-relaxed text-secondary">
                LifeDrop is a comprehensive blood donation coordination platform that:
              </p>
              <ul className="space-y-3 text-lg text-secondary">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span>
                  <span>Connects blood donors with patients in need through intelligent matching</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span>
                  <span>Provides real-time notifications for urgent blood requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span>
                  <span>Enables direct communication between donors and requesters</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span>
                  <span>Maintains a verified network of active blood donors</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent"></span>
                  <span>Tracks and manages blood donation requests transparently</span>
                </li>
              </ul>
            </section>

            <section className="rounded-2xl border border-soft bg-surface-card p-8">
              <h2 className="mb-4 text-2xl font-bold text-primary">Our Impact</h2>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-accent">8,500+</div>
                  <div className="text-secondary">Verified Donors</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-accent">3,200</div>
                  <div className="text-secondary">Requests Matched</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-4xl font-bold text-accent">14 min</div>
                  <div className="text-secondary">Avg Response Time</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-soft bg-surface-card p-8">
              <h2 className="mb-4 text-2xl font-bold text-primary">Our Values</h2>
              <div className="space-y-4 text-lg text-secondary">
                <div>
                  <h3 className="mb-1 font-semibold text-primary">Speed</h3>
                  <p>Every second counts when someone needs blood. We optimize for the fastest possible response times.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-primary">Trust</h3>
                  <p>We verify all donors and maintain transparent records to ensure safety and reliability.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-primary">Community</h3>
                  <p>We believe in the power of community and make it easy for people to help each other.</p>
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-primary">Accessibility</h3>
                  <p>Our platform is free and easy to use, ensuring everyone can access life-saving help.</p>
                </div>
              </div>
            </section>

            {/* CTA */}
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
              <h2 className="mb-4 text-2xl font-bold text-primary">
                Join Our Community
              </h2>
              <p className="mb-6 text-lg text-secondary">
                Be part of a movement that saves lives every day.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center rounded-lg bg-accent px-8 py-3 font-semibold text-white transition-colors hover:bg-accent/90"
                >
                  Get Started
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-lg border border-soft bg-surface-card px-8 py-3 font-semibold text-primary transition-colors hover:bg-surface-hover"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
