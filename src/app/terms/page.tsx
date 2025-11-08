import { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar } from "@/components/layout/public-navbar";

export const metadata: Metadata = {
  title: "Terms of Service - LifeDrop",
  description: "Terms and conditions for using the LifeDrop platform.",
};

export default function TermsPage() {
  return (
    <>
      <PublicNavbar />
      <main className="min-h-screen bg-gradient-to-b from-surface-card to-background">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-soft bg-surface-card p-8 shadow-soft lg:p-12">
            <h1 className="mb-8 text-4xl font-bold text-primary">Terms of Service</h1>
            
            <div className="space-y-8 text-secondary">
              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">1. Acceptance of Terms</h2>
                <p className="leading-relaxed">
                  By accessing and using LifeDrop, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">2. Use of Service</h2>
                <p className="mb-4 leading-relaxed">
                  LifeDrop provides a platform to connect blood donors with those in need. You agree to:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Provide accurate and truthful information</li>
                  <li>Maintain the confidentiality of your account</li>
                  <li>Use the service for its intended purpose only</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Respect the privacy and rights of other users</li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">3. User Responsibilities</h2>
                <p className="leading-relaxed">
                  Users are responsible for all activity under their accounts. You must verify all information independently and use your own judgment when coordinating blood donations. LifeDrop is a coordination platform and does not provide medical advice.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">4. Privacy</h2>
                <p className="leading-relaxed">
                  Your use of LifeDrop is also governed by our Privacy Policy. Please review our{" "}
                  <Link href="/privacy" className="font-medium text-accent hover:underline">
                    Privacy Policy
                  </Link>{" "}
                  to understand our practices.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">5. Prohibited Activities</h2>
                <p className="mb-4 leading-relaxed">You may not:</p>
                <ul className="list-disc space-y-2 pl-6">
                  <li>Post false or misleading information</li>
                  <li>Impersonate another person or entity</li>
                  <li>Harass or abuse other users</li>
                  <li>Attempt to gain unauthorized access to the platform</li>
                  <li>Use the service for commercial purposes without permission</li>
                  <li>
                    <strong>Engage in any monetary transactions or financial exchanges for blood donations.</strong> Blood donation must remain a voluntary, non-commercial activity. Soliciting, offering, or accepting payment or any form of compensation for blood is strictly prohibited and may result in immediate account termination and legal action.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">6. Disclaimer</h2>
                <p className="leading-relaxed">
                  LifeDrop is provided "as is" without warranties of any kind. We do not guarantee the availability, accuracy, or reliability of the service. Medical decisions should always be made in consultation with qualified healthcare professionals.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">7. Limitation of Liability</h2>
                <p className="leading-relaxed">
                  LifeDrop shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">8. Changes to Terms</h2>
                <p className="leading-relaxed">
                  We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
                </p>
              </section>

              <section>
                <h2 className="mb-4 text-2xl font-semibold text-primary">9. Contact</h2>
                <p className="leading-relaxed">
                  For questions about these terms, please{" "}
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
