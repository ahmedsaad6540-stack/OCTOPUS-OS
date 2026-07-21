import { Link } from "wouter";

export function TikTokIntegrationPage() {
  return (
    <div className="min-h-screen bg-[#06020f] text-[#e2d9f3] p-8 font-sans">
      <div className="max-w-4xl mx-auto bg-[#130d2a] p-8 rounded-2xl border border-purple-900/50 shadow-2xl">
        <div className="flex justify-between items-center mb-8 border-b border-purple-800/30 pb-4">
          <h1 className="text-3xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            TikTok Bridge Integration
          </h1>
          <Link href="/">
            <a className="text-sm text-purple-400 hover:text-purple-300">← Back to Home</a>
          </Link>
        </div>

        <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">How Our TikTok Bridge Works</h2>
            <p>
              OCTOPUS AI utilizes a fully compliant, 3-tier architecture to securely interface with TikTok. We respect user privacy, enforce explicit consent, and do not use unapproved automation scripts.
            </p>
          </section>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#0d0920] p-5 rounded-xl border border-purple-800/30">
              <h3 className="font-bold text-white mb-2">Tier 1: Launch Pack</h3>
              <p className="text-xs text-gray-400">
                Operates without an API connection. OCTOPUS generates your video, captions, and hashtags into a downloadable package. You open TikTok and manually post.
              </p>
            </div>
            
            <div className="bg-[#0d0920] p-5 rounded-xl border border-purple-800/30">
              <h3 className="font-bold text-white mb-2">Tier 2: Draft Upload</h3>
              <p className="text-xs text-gray-400">
                Uses the official TikTok `video.upload` scope. OCTOPUS securely pushes the generated video to your TikTok Inbox/Drafts. You open the app to apply final edits and publish.
              </p>
            </div>

            <div className="bg-[#0d0920] p-5 rounded-xl border border-purple-800/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-[9px] font-bold px-2 py-1 rounded-bl-lg text-black">
                AUTOMATIC
              </div>
              <h3 className="font-bold text-white mb-2">Tier 3: Direct Post</h3>
              <p className="text-xs text-gray-400">
                Uses the `video.publish` scope. Once authorized by TikTok App Review, OCTOPUS fully automates the upload and publishing process based on your scheduling preferences.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
