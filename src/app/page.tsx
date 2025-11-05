import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowRight,
  Droplet,
  HeartHandshake,
  LifeBuoy,
  LineChart,
  MessageSquareHeart,
  ShieldCheck,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Lifedrop | Blood Donation Coordination Platform - Connect Patients with Donors",
  description: "Lifedrop is the leading blood donation coordination platform connecting patients, donors, and hospitals in real-time. Find blood donors near you, post urgent blood requests, and save lives with transparent tracking and instant notifications. Join 8.5k+ verified donors today.",
  keywords: [
    "blood donation platform",
    "find blood donor",
    "urgent blood needed",
    "blood donation coordination",
    "donate blood",
    "blood donor network",
    "emergency blood request",
    "blood bank platform",
    "realtime donor matching",
    "lifedrop",
    "save lives blood donation",
    "blood group matching",
    "hospital blood coordination",
    "volunteer blood donors",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lifedrop",
    title: "Lifedrop | Connect Patients with Blood Donors Instantly",
    description: "Real-time blood donation coordination platform. 8.5k+ donors, 14-minute average response time. Find blood donors near you or become a life-saving donor.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lifedrop - Blood Donation Coordination Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lifedrop | Connect Patients with Blood Donors Instantly",
    description: "Real-time blood donation coordination. 8.5k+ verified donors, 14-min response time. Save lives today.",
    images: ["/og-image.png"],
    creator: "@lifedrop",
  },
  alternates: {
    canonical: "/",
  },
};

const stats = [
  { label: "Registered donors", value: "8.5k+", detail: "Verified and ready to respond" },
  { label: "Requests matched", value: "3.2k", detail: "Completed with successful transfusions" },
  { label: "Average response", value: "14 min", detail: "Time to first donor reply" },
  { label: "Communities onboard", value: "64", detail: "Hospitals, NGOs, and local groups" },
];

const featureHighlights = [
  {
    title: "Realtime coordination",
    description: "Match urgent requests with nearby donors via live notifications and chat.",
    icon: MessageSquareHeart,
  },
  {
    title: "Transparent tracking",
    description: "Monitor fulfillment progress, approvals, and medical readiness in one place.",
    icon: LineChart,
  },
  {
    title: "Safer verifications",
    description: "Built-in document checks and audit trails keep your donor network trustworthy.",
    icon: ShieldCheck,
  },
  {
    title: "Community momentum",
    description: "Broadcast success stories, milestones, and campaigns to keep donors engaged.",
    icon: HeartHandshake,
  },
];

const workflow = [
  {
    title: "Publish an urgent need",
    detail: "Capture patient details, location, and required units with guided forms in under a minute.",
    highlights: [
      "Smart prompts make sure critical details—like blood group, hospital contact, and urgency—are never missed.",
      "Reusable templates pre-fill your organization’s info so submitting repeat requests takes seconds.",
    ],
  },
  {
    title: "Alert compatible donors",
    detail: "Automated matching pings nearby donors, friends, and hospital partners instantly.",
    highlights: [
      "Filters consider blood group, last donation date, and geo radius to create a prioritized outreach list.",
      "Email, SMS, and in-app notifications go out simultaneously so the first responder gets there fast.",
    ],
  },
  {
    title: "Coordinate and confirm",
    detail: "Chat, share attachments, and log confirmations while the system tracks every milestone.",
    highlights: [
      "Timeline view shows who accepted, when they’re en route, and when transfusion is complete.",
      "Post-request summaries auto-generate for record keeping and future audits.",
    ],
  },
];

const testimonials = [
  {
    quote:
      "We move twice as fast now. Lifedrop keeps our volunteer list warm and our response time reliable even during midnight emergencies.",
    name: "Farzana Rahman",
    role: "Coordinator, Dhaka Community Hospital",
  },
  {
    quote:
      "The friend network features are game-changing. Families rally donors in hours instead of days, and the records stay organized.",
    name: "Sabbir Ahmed",
    role: "Founder, Blood Bridge NGO",
  },
];

export default function Home() {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  // Structured Data for Homepage
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Lifedrop Blood Donation Platform",
    description: "Real-time blood donation coordination platform connecting patients with verified donors",
    brand: {
      "@type": "Brand",
      name: "Lifedrop",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "850",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does Lifedrop connect blood donors with patients?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Lifedrop uses automated matching to ping nearby compatible donors based on blood group, location, and last donation date. Donors receive instant notifications via email, SMS, and in-app alerts.",
        },
      },
      {
        "@type": "Question",
        name: "Is Lifedrop free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, Lifedrop is free for individual donors and patients. We also offer organization plans for hospitals and NGOs.",
        },
      },
      {
        "@type": "Question",
        name: "How fast is the average response time?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Our average response time is 14 minutes from request posting to first donor response, thanks to our real-time notification system.",
        },
      },
    ],
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Find Blood Donors with Lifedrop",
    description: "Step-by-step guide to posting urgent blood requests and finding compatible donors",
    step: [
      {
        "@type": "HowToStep",
        name: "Publish an urgent need",
        text: "Capture patient details, location, and required units with guided forms in under a minute.",
      },
      {
        "@type": "HowToStep",
        name: "Alert compatible donors",
        text: "Automated matching pings nearby donors, friends, and hospital partners instantly based on blood group and location.",
      },
      {
        "@type": "HowToStep",
        name: "Coordinate and confirm",
        text: "Chat, share attachments, and log confirmations while the system tracks every milestone.",
      },
    ],
  };

  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <main className="relative z-10 flex flex-col gap-10">
      <header className="flex items-center justify-between rounded-3xl border border-soft bg-surface-card px-6 py-4 shadow-soft">
        <Link href="/" className="text-sm font-semibold text-primary">
          Lifedrop
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      <section className="grid gap-8 rounded-3xl border border-soft bg-surface-card p-10 shadow-card lg:grid-cols-2 lg:items-center">
        <div className="flex flex-col gap-6">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--color-border-primary)] bg-surface-primary-soft px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-danger)]">
            Save Lives Together
          </span>
          <h1 className="text-balance text-4xl font-semibold leading-tight text-primary sm:text-6xl">
            Coordinate life-saving donations without the late-night scramble.
          </h1>
          <p className="max-w-2xl text-pretty text-base text-secondary sm:text-lg">
            Lifedrop centralizes donor discovery, medical verification, and real-time chat so every request reaches the right
            people in minutes—not hours.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-full bg-primary-solid px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
            >
              Register
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] px-6 py-3 text-sm font-semibold text-primary transition hover:text-secondary"
            >
              Log in
            </Link>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted">
            <div className="flex items-center gap-2">
              <Droplet className="h-4 w-4 text-[var(--color-text-danger)]" /> Verified donors in 10+ blood groups
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-text-danger)]" /> Built for coordinators and hospitals
            </div>
          </div>
        </div>

        <div className="relative mx-auto h-full w-full max-w-xl">
          <div className="absolute inset-0 rounded-[48px] bg-surface-primary-soft blur-2xl" />
          <div className="relative overflow-hidden rounded-[32px] border border-subtle bg-surface-card shadow-card">
            <Image
              src="/images/hero-illustration.png"
              alt="Coordinators matching blood donors"
              width={640}
              height={480}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-soft bg-surface-card p-8 shadow-soft sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border border-subtle bg-surface-card-muted">
            <CardHeader className="gap-2">
              <CardTitle className="text-3xl font-semibold">{stat.value}</CardTitle>
              <CardDescription className="text-sm font-medium text-secondary">{stat.label}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted">{stat.detail}</CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 rounded-3xl border border-soft bg-surface-card p-8 shadow-soft">
        <header className="flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-semibold text-primary">Everything you need to mobilize donors</h2>
          <p className="text-base text-secondary">
            Purpose-built tools for request owners, donor leads, and support volunteers.
          </p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {featureHighlights.map((feature) => (
            <Card key={feature.title} className="border border-subtle bg-surface-card-muted">
              <CardHeader className="flex flex-row items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-primary-soft text-[var(--color-text-danger)]">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-soft bg-surface-card p-8 shadow-soft lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="grid gap-5">
          <h2 className="text-3xl font-semibold text-primary">How coordination flows</h2>
          <p className="text-base text-secondary">
            Lifedrop keeps every stage guided and auditable so nothing falls through the cracks.
          </p>
          <ol className="grid gap-4">
            {workflow.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3 rounded-2xl border border-subtle bg-surface-primary-soft p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-solid text-sm font-semibold text-white shadow-soft">
                    {index + 1}
                  </div>
                  <div className="grid gap-1">
                    <p className="text-base font-semibold text-primary">{step.title}</p>
                    <p className="text-sm text-secondary">{step.detail}</p>
                  </div>
                </div>
                {step.highlights?.length ? (
                  <ul className="grid gap-1.5 pl-14 text-sm text-muted">
                    {step.highlights.map((highlight) => (
                      <li key={highlight} className="relative pl-3">
                        <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-[var(--color-text-danger)]" aria-hidden />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="relative mx-auto w-full max-w-[420px] sm:max-w-[520px] lg:max-w-[600px] rounded-[32px] border border-subtle bg-surface-card-muted p-4 lg:p-6 shadow-card">
          <Image
            src="/images/impact-map.png"
            alt="Impact across communities"
            width={800}
            height={560}
            sizes="(min-width: 1280px) 560px, (min-width: 1024px) 50vw, (min-width: 768px) 60vw, 90vw"
            className="mx-auto h-auto w-full"
          />
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-soft bg-surface-card p-8 shadow-soft">
        <header className="flex flex-col gap-2 text-center">
          <h2 className="text-3xl font-semibold text-primary">Trusted by coordinators everywhere</h2>
          <p className="text-base text-secondary">Stories from teams who turned chaos into coordinated impact.</p>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.name} className="border border-subtle bg-surface-card-muted">
              <CardContent className="gap-4">
                <p className="text-base leading-relaxed text-secondary">“{testimonial.quote}”</p>
                <div className="grid gap-1 text-sm text-muted">
                  <span className="font-semibold text-primary">{testimonial.name}</span>
                  <span>{testimonial.role}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-[var(--color-border-primary)] bg-surface-primary-soft p-8 text-center shadow-soft">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary-solid text-white shadow-soft">
          <LifeBuoy className="h-6 w-6" />
        </div>
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold text-primary">Ready to mobilize your blood donor community?</h2>
          <p className="text-base text-secondary">
            Launch your workspace in minutes. Bring your volunteers, hospitals, and local heroes under one coordinated platform.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full bg-primary-solid px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
          >
            Create free account
          </Link>
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-primary)] px-6 py-3 text-sm font-semibold text-primary transition hover:text-secondary"
          >
            Explore documentation
          </Link>
        </div>
      </section>
      <footer className="grid gap-8 rounded-3xl border border-soft bg-surface-card p-8 shadow-soft">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-lg">
            <Link href="/" className="text-lg font-semibold text-primary">
              Lifedrop
            </Link>
            <p className="mt-3 text-sm text-secondary">
              A trusted platform for coordinators, hospitals, and donor communities to keep blood requests moving quickly and safely.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
              <span>© {new Date().getFullYear()} Lifedrop</span>
              <span>•</span>
              <span>All rights reserved</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Product</p>
              <Link href="/features" className="text-secondary transition hover:text-primary">
                Features
              </Link>
              <Link href="/pricing" className="text-secondary transition hover:text-primary">
                Pricing
              </Link>
              <Link href="/demo" className="text-secondary transition hover:text-primary">
                Request a demo
              </Link>
              <Link href="/playbooks" className="text-secondary transition hover:text-primary">
                Playbooks
              </Link>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Company</p>
              <Link href="/about" className="text-secondary transition hover:text-primary">
                About
              </Link>
              <Link href="/careers" className="text-secondary transition hover:text-primary">
                Careers
              </Link>
              <Link href="/press" className="text-secondary transition hover:text-primary">
                Press
              </Link>
              <Link href="/contact" className="text-secondary transition hover:text-primary">
                Contact
              </Link>
            </div>

            <div className="grid gap-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted">Resources</p>
              <Link href="/docs" className="text-secondary transition hover:text-primary">
                Documentation
              </Link>
              <Link href="/support" className="text-secondary transition hover:text-primary">
                Support
              </Link>
              <Link href="/status" className="text-secondary transition hover:text-primary">
                Status
              </Link>
              <Link href="/security" className="text-secondary transition hover:text-primary">
                Security
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-6 text-xs text-muted">
          <div className="flex flex-wrap gap-3">
            <Link href="/terms" className="transition hover:text-primary">
              Terms
            </Link>
            <Link href="/privacy" className="transition hover:text-primary">
              Privacy
            </Link>
            <Link href="/accessibility" className="transition hover:text-primary">
              Accessibility
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-primary">
              Facebook
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-primary">
              Instagram
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="transition hover:text-primary">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </main>
    </>
  );
}
