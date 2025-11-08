"use client";

import { useState } from "react";
import { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Mail, MessageSquare, HelpCircle } from "lucide-react";
import { submitContactForm, type ContactFormData } from "@/server/actions/contact";
import { toast } from "react-hot-toast";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formData);
      
      if (result.success) {
        toast.success(result.message);
        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-primary">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
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
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
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
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
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
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-soft bg-background px-4 py-2 text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
                  placeholder="Tell us more about your question or feedback..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
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
