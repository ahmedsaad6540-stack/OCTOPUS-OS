import { Link } from "wouter";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#06020f] text-[#e2d9f3] p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-[#130d2a] p-8 rounded-2xl border border-purple-900/50 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-purple-800/30 pb-4">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Privacy Policy
          </h1>
          <Link href="/">
            <a className="text-sm text-purple-400 hover:text-purple-300">← Back to Home</a>
          </Link>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <p className="text-xs text-gray-500">Last Updated: July 20, 2026</p>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Introduction</h2>
            <p>
              Welcome to OCTOPUS AI LAB. We respect your privacy and are committed to protecting your personal data. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SaaS platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Data We Collect</h2>
            <p>
              When you connect third-party integrations (e.g., TikTok, Facebook, YouTube), we request OAuth tokens. 
              We strictly collect only the scopes necessary for our service to function, primarily related to content publishing and analytics retrieval.
              We do not store passwords for external social platforms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. How We Use Your Data</h2>
            <p>
              Your data is used exclusively to provide you with the OCTOPUS OS automated publishing capabilities. 
              We use standard API endpoints provided by our partners (e.g., TikTok Direct Post API) to distribute your generated videos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. TikTok Integration & Data Revocation</h2>
            <p>
              OCTOPUS uses official TikTok OAuth v2. We never use unauthorized browser automation. 
              You can revoke our access to your TikTok account at any time via the TikTok mobile app settings (Settings &gt; Security &gt; Manage App Permissions). 
              For full data deletion instructions, visit our <Link href="/data-deletion"><a className="text-purple-400">Data Deletion Policy</a></Link>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Contact Us</h2>
            <p>
              If you have questions regarding this Privacy Policy, please contact our Data Protection Officer at: <br/>
              <span className="font-mono text-emerald-400">privacy@octopus-ai.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
