import { useState } from "react";

const CLIENT_ID = import.meta.env.VITE_YOUTUBE_CLIENT_ID || "DEMO_YOUTUBE_CLIENT_ID_PLACEHOLDER";

export function YouTubeLoginPage() {
  const [redirectUri, setRedirectUri] = useState<string>(
    typeof window !== "undefined" ? `${window.location.origin}/auth/youtube/callback` : "http://localhost:5173/auth/youtube/callback"
  );

  const handleLogin = () => {
    const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly";
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=youtube_auth_flow`;
    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-[#0a0614] text-white flex items-center justify-center p-4">
      <div className="bg-[#130d2a] border border-purple-800/60 rounded-3xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(126,34,206,0.2)] text-center relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-20 h-20 bg-gradient-to-tr from-red-600 to-purple-700 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-xl mb-6">
          📺
        </div>

        <h1 className="text-2xl font-black text-white mb-2">ربط قناة YouTube بصلاحيات النشر</h1>
        <p className="text-sm text-purple-300 mb-6 leading-relaxed">
          سيتيح لك هذا التسجيل عبر Google OAuth 2.0 الحصول على رمز تجديد الصلاحية الدائم (<code>YOUTUBE_REFRESH_TOKEN</code>) لرفع المقاطع والشورتس تلقائياً دون تدخل بشري.
        </p>

        <div className="bg-[#080410] border border-purple-900/50 rounded-xl p-4 text-left mb-6 space-y-3 font-mono text-xs">
          <div>
            <span className="block text-[10px] text-purple-400 font-bold uppercase mb-1">Client ID</span>
            <span className="text-sky-300 break-all">{CLIENT_ID}</span>
          </div>
          <div>
            <span className="block text-[10px] text-purple-400 font-bold uppercase mb-1">Scopes Requested</span>
            <span className="text-emerald-400 block">✓ https://www.googleapis.com/auth/youtube.upload</span>
            <span className="text-emerald-400 block">✓ https://www.googleapis.com/auth/youtube.readonly</span>
          </div>
          <div>
            <span className="block text-[10px] text-purple-400 font-bold uppercase mb-1">Redirect URI (يجب أن يطابق تماماً ما في Google Cloud Console)</span>
            <input
              type="text"
              value={redirectUri}
              onChange={(e) => setRedirectUri(e.target.value)}
              className="w-full bg-[#130d2a] border border-purple-800 rounded px-3 py-1.5 text-amber-300 focus:outline-none focus:border-purple-500 font-mono text-xs mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setRedirectUri("http://localhost:5173/auth/youtube/callback")}
                className="bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50 text-[10px] text-purple-200 px-2 py-1 rounded transition-all"
              >
                📍 المحمي (Localhost 5173)
              </button>
              <button
                type="button"
                onClick={() => setRedirectUri("http://localhost:5002/auth/youtube/callback")}
                className="bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50 text-[10px] text-purple-200 px-2 py-1 rounded transition-all"
              >
                📍 خادم API (Localhost 5002)
              </button>
              <button
                type="button"
                onClick={() => setRedirectUri("https://api-server-production-4801.up.railway.app/api/oauth/youtube/callback")}
                className="bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/50 text-[10px] text-purple-200 px-2 py-1 rounded transition-all"
              >
                ☁️ السحابي (Railway Prod)
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-red-600 via-purple-700 to-indigo-700 hover:opacity-95 text-white font-black py-4 px-6 rounded-2xl shadow-lg transition-all transform hover:scale-[1.01] flex items-center justify-center gap-3 text-base"
        >
          <span>⚡ تسجيل الدخول بحساب Google (OAuth 2.0)</span>
        </button>

        <p className="text-[11px] text-purple-500 mt-4">
          🔒 يتم تبادل الرمز فوراً وحفظ الـ <code>refresh_token</code> في ملف <code>.env</code> وقاعدة بيانات OCTOPUS OS بأمان.
        </p>
      </div>
    </div>
  );
}
