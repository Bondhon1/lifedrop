import { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Mail, MessageSquare, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us - LifeDrop",
  description: "Get in touch with the LifeDrop team for support, questions, or feedback.",
};

export default function ContactPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gradient-to-b from-surface-card to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-4xl font-bold text-primary sm:text-5xl">
              Get in Touch
            </h1>
            <p className="text-xl text-secondary">
              We're here to help and answer any questions you might have.
            </p>
          </div>

          {/* Contact Options */}
          <div className="mb-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-soft bg-surface-card p-6 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3">
                <Mail className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 font-semibold text-primary">Email Us</h3>
              <p className="mb-3 text-sm text-secondary">
                For general inquiries
              </p>
              <a
                href="mailto:support@lifedrop.com"
                className="text-sm font-medium text-accent hover:underline"
              >
                support@lifedrop.com
              </a>
            </div>

            <div className="rounded-2xl border border-soft bg-surface-card p-6 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3">
                <MessageSquare className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 font-semibold text-primary">Live Chat</h3>
              <p className="mb-3 text-sm text-secondary">
                Chat with our team
              </p>
              <button className="text-sm font-medium text-accent hover:underline">
                Start Chat
              </button>
            </div>

            <div className="rounded-2xl border border-soft bg-surface-card p-6 text-center">
              <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3">
                <HelpCircle className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 font-semibold text-primary">Help Center</h3>
              <p className="mb-3 text-sm text-secondary">
                Browse our guides
              </p>
              <Link
                href="/docs/getting-started"
                className="text-sm font-medium text-accent hover:underline"
              >
                View Docs
              </Link>
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-soft bg-surface-card p-8 shadow-soft">
            <h2 className="mb-6 text-2xl font-bold text-primary">Send us a Message</h2>
            <form className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-primary">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-primary">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-primary">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="How can we help?"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-primary">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Tell us more about your question or feedback..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent/90 sm:w-auto"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* FAQ Section */}
          <div className="mt-12 rounded-2xl border border-soft bg-surface-card p-8">
            <h2 className="mb-6 text-2xl font-bold text-primary">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold text-primary">
                  How do I register as a donor?
                </h3>
                <p className="text-secondary">
                  Click the "Sign Up" button, create your account, complete your profile, and apply to become a donor through the donors section.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-primary">
                  Is LifeDrop free to use?
                </h3>
                <p className="text-secondary">
                  Yes! LifeDrop is completely free for individual donors and patients. We want to make blood donation coordination accessible to everyone.
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-semibold text-primary">
                  How quickly can I find a donor?
                </h3>
                <p className="text-secondary">
                  Our average response time is 14 minutes from posting a request to receiving the first donor response, thanks to our real-time notification system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
