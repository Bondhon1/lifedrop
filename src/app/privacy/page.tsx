import { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";

export const metadata: Metadata = {
  title: "Privacy Policy - LifeDrop",
  description: "Learn how LifeDrop collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gradient-to-b from-surface-card to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-soft bg-surface-card p-8 shadow-soft lg:p-12">
            <h1 className="mb-8 text-4xl font-bold text-primary">Privacy Policy</h1>
            
            <div className="space-y-8 text-secondary">
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">1. Information We Collect</h2>
                <p className="mb-4 leading-relaxed">We collect information that you provide directly to us, including:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Name, email address, and contact information</li>
                  <li>Blood type and medical information (for donors)</li>
                  <li>Location data for matching purposes</li>
                  <li>Profile pictures and other uploaded content</li>
                  <li>Messages and communications within the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">2. How We Use Your Information</h2>
                <p className="mb-4 leading-relaxed">We use the information we collect to:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Facilitate blood donation coordination</li>
                  <li>Match donors with blood requests</li>
                  <li>Send notifications about relevant requests</li>
                  <li>Improve and personalize your experience</li>
                  <li>Maintain platform security and prevent fraud</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">3. Information Sharing</h2>
                <p className="mb-4 leading-relaxed">
                  We do not sell your personal information. We may share your information:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>With other users when you create or respond to requests</li>
                  <li>With your consent or at your direction</li>
                  <li>To comply with legal requirements</li>
                  <li>To protect the rights and safety of our users</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">4. Data Security</h2>
                <p className="leading-relaxed">
                  We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">5. Your Rights</h2>
                <p className="mb-4 leading-relaxed">You have the right to:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Access and review your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Request deletion of your account and data</li>
                  <li>Opt-out of certain communications</li>
                  <li>Export your data</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">6. Cookies and Tracking</h2>
                <p className="leading-relaxed">
                  We use cookies and similar technologies to improve your experience, analyze usage patterns, and maintain security. You can control cookie settings through your browser preferences.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">7. Children's Privacy</h2>
                <p className="leading-relaxed">
                  LifeDrop is not intended for users under 18 years of age. We do not knowingly collect personal information from children.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">8. Changes to Privacy Policy</h2>
                <p className="leading-relaxed">
                  We may update this privacy policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">9. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have questions about this privacy policy or our data practices, please{" "}
                  <Link href="/contact" className="font-medium text-accent hover:underline">
                    contact us
                  </Link>
                  .
                </p>
              </section>

              <p className="pt-8 text-sm text-muted">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
