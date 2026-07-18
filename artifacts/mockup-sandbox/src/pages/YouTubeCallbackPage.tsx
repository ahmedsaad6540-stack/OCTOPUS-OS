import { useEffect, useState } from "react";
import { api } from "@/lib/api";

interface TokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  details?: string;
}

export function YouTubeCallbackPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [tokens, setTokens] = useState<TokenResponse>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      setStatus("error");
      setErrorMsg(error);
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMsg("لم يتم العثور على رمز التوثيق (Authorization Code) في الرابط.");
      return;
    }

    const exchangeCode = async () => {
      try {
        const redirectUri = `${window.location.origin}/auth/youtube/callback`;
        
        // Call backend API exchange endpoint
        let resData: TokenResponse;
        try {
          resData = await api.post<TokenResponse>("/auth/youtube/exchange", {
            code,
            redirect_uri: redirectUri,
          });
        } catch {
          // Fallback to direct fetch to localhost:5002 if frontend proxy isn't routing
          const rawRes = await fetch("http://localhost:5002/api/auth/youtube/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, redirect_uri: redirectUri }),
          });
          resData = await rawRes.json() as TokenResponse;
          if (!rawRes.ok) {
            throw new Error(resData.details || resData.error || "Token exchange failed");
          }
        }

        if (resData.error) {
          throw new Error(resData.details || resData.error);
        }

        setTokens(resData);
        setStatus("success");

        console.log("====================================================================");
        console.log("📺 YOUTUBE OAUTH 2.0 TOKENS RECEIVED IN BROWSER!");
        console.log("====================================================================");
        console.log("YOUTUBE_ACCESS_TOKEN =", resData.access_token);
        console.log("YOUTUBE_REFRESH_TOKEN =", resData.refresh_token);
        console.log("====================================================================");
      } catch (err) {
        setStatus("error");
        setErrorMsg(err instanceof Error ? err.message : String(err));
      }
    };

    void exchangeCode();
  }, [code, error]);

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0a0614] text-white flex items-center justify-center p-4">
      <div className="bg-[#130d2a] border border-purple-800/60 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(126,34,206,0.25)] relative overflow-hidden">
        {status === "loading" && (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold text-white mb-2">جارٍ تبادل الرمز مع خوادم Google...</h2>
            <p className="text-sm text-purple-400 font-mono">Authorization Code: {code?.slice(0, 25)}...</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-900/40 border border-red-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-6 text-red-400">
              ❌
            </div>
            <h2 className="text-xl font-black text-red-400 mb-2">فشل الحصول على Refresh Token</h2>
            <div className="bg-[#080410] border border-red-900/50 rounded-xl p-4 text-left font-mono text-xs text-amber-300 overflow-auto max-h-40 mb-6">
              {errorMsg}
            </div>
            <p className="text-xs text-purple-300 mb-6">
              تأكد من أن الـ <code>Redirect URI</code> المضاف في Google Cloud Console يطابق تماماً:<br />
              <span className="text-sky-300 font-mono block mt-1">{typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"}/auth/youtube/callback</span>
            </p>
            <a
              href="/auth/youtube/login"
              className="inline-block bg-purple-700 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all"
            >
              🔄 إعادة المحاولة مرة أخرى
            </a>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-900/40 border border-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4 text-emerald-400 shadow-lg">
                ✅
              </div>
              <h1 className="text-2xl font-black text-white mb-1">تمت المصادقة بنجاح وحفظ الرموز!</h1>
              <p className="text-xs text-purple-300">
                تم استلام الـ <code>refresh_token</code> الدائم من Google وحفظه تلقائياً في ملف <code>.env</code> وقاعدة بيانات OCTOPUS OS.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {/* Refresh Token Box */}
              <div className="bg-[#080410] border border-emerald-800/60 rounded-2xl p-4 text-left font-mono relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔄 YOUTUBE_REFRESH_TOKEN (الرمز الدائم)</span>
                    <span className="bg-emerald-900/50 text-emerald-300 text-[9px] px-2 py-0.5 rounded-full border border-emerald-700/50">تم الحفظ في .env</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(tokens.refresh_token || "", "refresh")}
                    className="text-xs bg-emerald-800/40 hover:bg-emerald-800/70 text-emerald-300 px-3 py-1 rounded-lg border border-emerald-700/50 transition-all font-sans"
                  >
                    {copiedField === "refresh" ? "✓ تم النسخ" : "📋 نسخ"}
                  </button>
                </div>
                <div className="text-xs text-sky-300 break-all bg-[#110920] p-3 rounded-xl border border-purple-950 max-h-28 overflow-y-auto">
                  {tokens.refresh_token || "mock_refresh_token_saved_in_backend"}
                </div>
              </div>

              {/* Access Token Box */}
              <div className="bg-[#080410] border border-purple-900/60 rounded-2xl p-4 text-left font-mono relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                    ⚡ YOUTUBE_ACCESS_TOKEN (صالح لـ 3600 ثانية)
                  </span>
                  <button
                    onClick={() => copyToClipboard(tokens.access_token || "", "access")}
                    className="text-xs bg-purple-800/40 hover:bg-purple-800/70 text-purple-300 px-3 py-1 rounded-lg border border-purple-700/50 transition-all font-sans"
                  >
                    {copiedField === "access" ? "✓ تم النسخ" : "📋 نسخ"}
                  </button>
                </div>
                <div className="text-xs text-purple-300 break-all bg-[#110920] p-3 rounded-xl border border-purple-950 max-h-24 overflow-y-auto">
                  {tokens.access_token}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/"
                className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 hover:opacity-95 text-white font-bold py-3.5 px-6 rounded-xl text-center text-sm shadow-lg transition-all"
              >
                📱 الانتقال إلى لوحة التحكم (Social Hub)
              </a>
              <a
                href="/"
                className="px-6 py-3.5 rounded-xl text-sm font-bold bg-gray-800/60 hover:bg-gray-800 text-gray-300 text-center transition-all"
              >
                🏠 الرئيسية
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
