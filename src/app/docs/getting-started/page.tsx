import { Metadata } from "next";
import Link from "next/link";
import {
  Heart,
  Users,
  MessageCircle,
  Bell,
  Search,
  UserPlus,
  ClipboardList,
  Shield,
  Droplet,
  Settings,
  Home,
  UserCircle,
} from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";

export const metadata: Metadata = {
  title: "Getting Started - LifeDrop",
  description:
    "Learn how to use LifeDrop to connect with blood donors, manage requests, and save lives.",
};

export default function GettingStartedPage() {
  return (
    <>
      <PublicNavbar />

      {/* Main Content */}
      <div className="min-h-screen bg-gradient-to-b from-surface-card to-background">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-accent/10 p-3">
            <Heart className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mb-4 text-4xl font-bold text-primary sm:text-5xl">
            Getting Started with LifeDrop
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-secondary">
            Welcome to LifeDrop - a modern platform connecting blood donors with
            those in need. Learn how to navigate the platform and make the most
            of its features.
          </p>
        </div>

        {/* Quick Links */}
        <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickLink
            href="/register"
            icon={<UserPlus className="h-5 w-5" />}
            title="Create Account"
            description="Sign up to start connecting"
          />
          <QuickLink
            href="/login"
            icon={<UserCircle className="h-5 w-5" />}
            title="Log In"
            description="Access your account"
          />
          <QuickLink
            href="/dashboard"
            icon={<Home className="h-5 w-5" />}
            title="Dashboard"
            description="Your personal hub"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-16">
          {/* Core Features section commented out per request
          <Section
            title="Core Features"
            description="Discover what you can do with LifeDrop"
          >
            <FeatureGrid>
              <Feature
                icon={<Droplet className="h-6 w-6 text-accent" />}
                title="Blood Requests"
                description="Create urgent blood requests with details like blood type, location, hospital info, and required units. Track request status and receive donor responses in real-time."
                link="/requests"
              />
              <Feature
                icon={<Users className="h-6 w-6 text-blue-500" />}
                title="Donor Network"
                description="Browse verified blood donors by blood type, location, and availability. Apply to become a donor yourself and help save lives in your community."
                link="/donors"
              />
              <Feature
                icon={<MessageCircle className="h-6 w-6 text-green-500" />}
                title="Real-time Chat"
                description="Connect directly with donors and requesters through our secure messaging system. Share attachments, see read receipts, and get instant notifications."
                link="/chat"
              />
              <Feature
                icon={<Bell className="h-6 w-6 text-purple-500" />}
                title="Smart Notifications"
                description="Stay updated with instant alerts for new requests, chat messages, friend requests, and donor applications. Never miss an urgent request."
                link="/notifications"
              />
              <Feature
                icon={<UserPlus className="h-6 w-6 text-orange-500" />}
                title="Social Network"
                description="Connect with other members, send friend requests, and build your network. View profiles, see mutual friends, and coordinate donations together."
                link="/friends"
              />
              <Feature
                icon={<Search className="h-6 w-6 text-pink-500" />}
                title="News Feed"
                description="Discover recent blood requests, donor stories, and community updates. Comment, share, and engage with posts to spread awareness."
                link="/feed"
              />
            </FeatureGrid>
          </Section>
          */}

          {/* Getting Started Steps */}
          <Section
            title="First Steps"
            description="Follow these steps to get started quickly"
          >
            <div className="space-y-6">
              <Step
                number={1}
                title="Create Your Account"
                description="Sign up with your email or use Google OAuth for quick registration. Fill out your profile with basic information, location, and contact details."
              />
              <Step
                number={2}
                title="Complete Your Profile"
                description="Add a profile picture, cover photo, and bio. Include your blood type, medical information, and address to help others find you when needed."
              />
              <Step
                number={3}
                title="Become a Donor (Optional)"
                description="Apply to become a verified donor by submitting your medical information and NID verification. Admins will review and approve your application."
              />
              <Step
                number={4}
                title="Explore & Connect"
                description="Browse blood requests in your area, search for donors, send friend requests, and start building your network. Use the search feature to find specific members or donors."
              />
              <Step
                number={5}
                title="Create or Respond to Requests"
                description="Post a blood request if you need help, or respond to existing requests if you can donate. Use the chat feature to coordinate details with donors."
              />
            </div>
          </Section>

          {/* Key Areas (commented out per request)
          <Section title="Platform Areas" description="Navigate the platform">
            <div className="grid gap-6 sm:grid-cols-2">
              <Area
                icon={<Home className="h-6 w-6" />}
                title="Dashboard"
                description="Your personal hub showing recent requests, friend activity, and quick stats. Access all features from here."
                link="/dashboard"
              />
              <Area
                icon={<ClipboardList className="h-6 w-6" />}
                title="Blood Requests"
                description="View, create, and manage blood requests. Filter by blood type, location, urgency, and status. Track your own requests."
                link="/requests"
              />
              <Area
                icon={<Droplet className="h-6 w-6" />}
                title="Donors"
                description="Search the donor directory by blood type and location. View donor profiles, availability, and contact information."
                link="/donors"
              />
              <Area
                icon={<Users className="h-6 w-6" />}
                title="Members"
                description="Browse all platform members, search by username, view profiles, and send connection requests."
                link="/members"
              />
              <Area
                icon={<UserPlus className="h-6 w-6" />}
                title="Friends"
                description="Manage your connections, view friend requests (incoming/outgoing), see your friend list, and interact with your network."
                link="/friends"
              />
              <Area
                icon={<MessageCircle className="h-6 w-6" />}
                title="Chat"
                description="Private conversations with donors, requesters, and friends. Real-time messaging with file attachments and read receipts."
                link="/chat"
              />
              <Area
                icon={<Bell className="h-6 w-6" />}
                title="Notifications"
                description="All your alerts in one place - new requests, messages, friend requests, donor approvals, and system updates."
                link="/notifications"
              />
              <Area
                icon={<Settings className="h-6 w-6" />}
                title="Profile Settings"
                description="Update your personal information, medical details, profile images, password, and notification preferences."
                link="/profile"
              />
            </div>
          </Section>
          */}

          {/* Tips & Best Practices */}
          <Section
            title="Tips & Best Practices"
            description="Get the most out of LifeDrop"
          >
            <div className="space-y-4">
              <Tip
                title="Keep Your Profile Updated"
                description="Regularly update your availability status, contact information, and location to help others reach you when urgent requests arise."
              />
              <Tip
                title="Respond Quickly to Requests"
                description="Blood needs are often time-sensitive. Enable notifications and check the platform regularly to respond to urgent requests in your area."
              />
              <Tip
                title="Verify Information"
                description="When creating blood requests, include accurate hospital details, contact numbers, and required units to help donors make informed decisions."
              />
              <Tip
                title="Build Your Network"
                description="Connect with donors in your blood type group and location. A strong network means faster responses when emergencies happen."
              />
              <Tip
                title="Use Chat Effectively"
                description="Communicate clearly with donors about timing, location, and any special requirements. Share documents like prescriptions if needed."
              />
              <Tip
                title="Report Issues"
                description="Help keep the platform safe by reporting suspicious activity, spam requests, or inappropriate behavior to admins."
              />
            </div>
          </Section>

          {/* Support */}
          <Section title="Need Help?" description="We're here to support you">
            <div className="rounded-2xl border border-soft bg-surface-card p-8 text-center">
              <p className="mb-4 text-lg text-secondary">
                Have questions or need assistance? Our support team is ready to
                help.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center rounded-lg border border-soft bg-surface-card px-6 py-3 font-medium text-primary transition-colors hover:bg-surface-hover"
                >
                  Complete Your Profile
                </Link>
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-soft pt-8 text-center text-sm text-secondary">
          <p>
            Ready to make a difference?{" "}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Create an account
            </Link>{" "}
            or{" "}
            <Link href="/login" className="font-medium text-accent hover:underline">
              log in
            </Link>{" "}
            to get started.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

// Component Building Blocks

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-primary">{title}</h2>
        <p className="text-secondary">{description}</p>
      </div>
      {children}
    </section>
  );
}

function FeatureGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
  );
}

function Feature({
  icon,
  title,
  description,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="group rounded-2xl border border-soft bg-surface-card p-6 transition-all hover:border-accent/50 hover:shadow-lg"
    >
      <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-surface-hover p-3 transition-colors group-hover:bg-accent/10">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold text-primary">{title}</h3>
      <p className="text-sm text-secondary">{description}</p>
      <div className="mt-4 text-sm font-medium text-accent">Learn more →</div>
    </Link>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-lg font-bold text-white">
        {number}
      </div>
      <div>
        <h3 className="mb-1 text-lg font-semibold text-primary">{title}</h3>
        <p className="text-secondary">{description}</p>
      </div>
    </div>
  );
}

function Area({
  icon,
  title,
  description,
  link,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
}) {
  return (
    <Link
      href={link}
      className="group flex gap-4 rounded-xl border border-soft bg-surface-card p-4 transition-all hover:border-accent/50 hover:shadow-md"
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-surface-hover text-accent transition-colors group-hover:bg-accent/10">
        {icon}
      </div>
      <div>
        <h3 className="mb-1 font-semibold text-primary">{title}</h3>
        <p className="text-sm text-secondary">{description}</p>
      </div>
    </Link>
  );
}

function Tip({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-soft bg-surface-card p-4">
      <h3 className="mb-1 font-semibold text-primary">{title}</h3>
      <p className="text-sm text-secondary">{description}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border border-soft bg-surface-card p-4 transition-all hover:border-accent/50 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-primary">{title}</div>
        <div className="text-xs text-secondary">{description}</div>
      </div>
    </Link>
  );
}
