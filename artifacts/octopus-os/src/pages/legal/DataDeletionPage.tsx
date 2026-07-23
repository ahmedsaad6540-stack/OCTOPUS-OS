import { Link } from "wouter";

export function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#06020f] text-[#e2d9f3] p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-[#130d2a] p-8 rounded-2xl border border-purple-900/50 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-purple-800/30 pb-4">
          <h1 className="text-3xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
            Data Deletion Instructions
          </h1>
          <Link href="/">
            <a className="text-sm text-purple-400 hover:text-purple-300">← Back to Home</a>
          </Link>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">How to Delete Your Data</h2>
            <p>
              According to the Facebook Platform rules and TikTok Developer Guidelines, we have to provide a User Data Deletion Callback URL or Data Deletion Instructions URL. 
              If you want to delete your activities for OCTOPUS AI LAB, you can remove your information by following these steps:
            </p>
          </section>

          <section className="bg-[#0d0920] p-4 rounded-xl border border-purple-800/30">
            <h3 className="text-md font-bold text-emerald-400 mb-2">For TikTok Users:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open your TikTok mobile app and go to your profile.</li>
              <li>Tap the three-line menu icon and select <strong>Settings and privacy</strong>.</li>
              <li>Tap <strong>Security</strong>.</li>
              <li>Tap <strong>Manage app permissions</strong>.</li>
              <li>Select <strong>OCTOPUS AI</strong> and tap <strong>Remove access</strong>.</li>
            </ol>
            <p className="mt-4 text-xs text-gray-400">
              * Removing access will automatically revoke our OAuth tokens and we will immediately delete all cached TikTok metrics from our databases.
            </p>
          </section>

          <section className="bg-[#0d0920] p-4 rounded-xl border border-purple-800/30">
            <h3 className="text-md font-bold text-blue-400 mb-2">For Meta (Facebook/Instagram) Users:</h3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Go to your Facebook Account's Setting & Privacy.</li>
              <li>Click <strong>Settings</strong>.</li>
              <li>Scroll down and click <strong>Apps and Websites</strong>.</li>
              <li>Find and click <strong>OCTOPUS AI</strong>.</li>
              <li>Click the <strong>Remove</strong> button.</li>
            </ol>
          </section>

          <section>
            <p className="text-xs text-gray-500">
              For manual deletion requests, email us directly at <span className="font-mono text-emerald-400">privacy@octopus-ai.com</span> with the subject line "Data Deletion Request".
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
