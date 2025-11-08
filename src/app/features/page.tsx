import { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import {
  MessageCircle,
  Users,
  Bell,
  Heart,
  Search,
  Shield,
  Zap,
  Globe,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features - LifeDrop",
  description:
    "Discover all the features that make LifeDrop the best blood donation coordination platform.",
};

export default function FeaturesPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gradient-to-b from-surface-card to-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="mb-4 text-4xl font-bold text-primary sm:text-5xl">
              Powerful Features for Life-Saving Coordination
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-secondary">
              Everything you need to connect donors with those in need, all in one platform.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Heart className="h-8 w-8" />}
              title="Blood Request Management"
              description="Create, track, and manage blood requests with detailed information including blood type, location, hospital details, and urgency level."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Donor Network"
              description="Access a verified network of blood donors. Search by blood type, location, and availability to find the perfect match quickly."
            />
            <FeatureCard
              icon={<MessageCircle className="h-8 w-8" />}
              title="Real-time Chat"
              description="Communicate directly with donors and requesters through our secure messaging system with file attachments and read receipts."
            />
            <FeatureCard
              icon={<Bell className="h-8 w-8" />}
              title="Smart Notifications"
              description="Get instant alerts for new requests, messages, and donor responses. Never miss an urgent blood need in your area."
            />
            <FeatureCard
              icon={<Search className="h-8 w-8" />}
              title="Advanced Search"
              description="Filter and search through requests, donors, and members with powerful search capabilities and smart filters."
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Verified Donors"
              description="All donors go through a verification process with medical information and ID verification for safety and trust."
            />
            <FeatureCard
              icon={<Zap className="h-8 w-8" />}
              title="Quick Response"
              description="Average 14-minute response time from request posting to first donor response through optimized matching."
            />
            <FeatureCard
              icon={<Globe className="h-8 w-8" />}
              title="Location-Based Matching"
              description="Automatically match requests with nearby donors based on geographic location for faster coordination."
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Social Network"
              description="Build your network by connecting with friends, family, and other donors to coordinate donations together."
            />
          </div>

          {/* CTA Section */}
          <div className="mt-16 rounded-3xl border border-soft bg-surface-card p-12 text-center shadow-soft">
            <h2 className="mb-4 text-3xl font-bold text-primary">
              Ready to Get Started?
            </h2>
            <p className="mb-8 text-lg text-secondary">
              Join thousands of donors making a difference in their communities.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center rounded-lg bg-accent px-8 py-3 font-semibold text-white transition-colors hover:bg-accent/90"
              >
                Sign Up Free
              </Link>
              <Link
                href="/docs/getting-started"
                className="inline-flex items-center rounded-lg border border-soft bg-surface-card px-8 py-3 font-semibold text-primary transition-colors hover:bg-surface-hover"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-soft bg-surface-card p-6 transition-all hover:border-accent/50 hover:shadow-lg">
      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3 text-accent">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-primary">{title}</h3>
      <p className="text-secondary">{description}</p>
    </div>
  );
}
