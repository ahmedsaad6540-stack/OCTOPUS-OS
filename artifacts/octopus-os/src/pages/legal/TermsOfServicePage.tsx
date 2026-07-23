import { Link } from "wouter";

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#06020f] text-[#e2d9f3] p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-[#130d2a] p-8 rounded-2xl border border-purple-900/50 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-purple-800/30 pb-4">
          <h1 className="text-3xl font-black bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
            Terms of Service
          </h1>
          <Link href="/">
            <a className="text-sm text-purple-400 hover:text-purple-300">← Back to Home</a>
          </Link>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <p className="text-xs text-gray-500">Last Updated: July 20, 2026</p>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Agreement to Terms</h2>
            <p>
              By accessing our platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Prohibited Content</h2>
            <p>
              Users are strictly prohibited from generating or distributing content that violates the community guidelines of our partner networks (TikTok, Meta, Google). 
              OCTOPUS reserves the right to terminate accounts that exploit the API for spam or malicious purposes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. API Usage Limitations</h2>
            <p>
              The platform operates using official API integrations. We are bound by the rate limits and terms of service of TikTok, YouTube, and Meta.
              We do not guarantee 100% uptime if the underlying external APIs become unavailable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Support & Contact</h2>
            <p>
              For legal inquiries regarding these terms, please contact: <br/>
              <span className="font-mono text-emerald-400">legal@octopus-ai.com</span>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
