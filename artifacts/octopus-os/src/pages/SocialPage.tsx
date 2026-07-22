import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/api";
import { YouTubeConnectionCard } from "@/components/social/YouTubeConnectionCard";

const PLATFORMS = [
  { id: "tiktok",    icon: "🎵", name: "TikTok",      color: "#ff0050" },
  { id: "instagram", icon: "📸", name: "Instagram",   color: "#e1306c" },
  { id: "facebook",  icon: "👍", name: "Facebook",    color: "#1877f2" },
  { id: "threads",   icon: "🧵", name: "Threads",     color: "#000000" },
  { id: "youtube",   icon: "▶️", name: "YouTube",     color: "#ff0000" },
  { id: "x",         icon: "✖️", name: "X (Twitter)", color: "#000000" },
  { id: "linkedin",  icon: "💼", name: "LinkedIn",    color: "#0077b5" },
  { id: "pinterest", icon: "📌", name: "Pinterest",   color: "#e60023" },
  { id: "snapchat",  icon: "👻", name: "Snapchat",    color: "#fffc00" },
  { id: "reddit",    icon: "🔴", name: "Reddit",      color: "#ff4500" },
  { id: "telegram",  icon: "✈️", name: "Telegram",    color: "#0088cc" },
  { id: "discord",   icon: "🎮", name: "Discord",     color: "#5865f2" },
  { id: "medium",    icon: "✍️", name: "Medium",      color: "#000000" },
  { id: "wordpress", icon: "🌐", name: "WordPress",   color: "#21759b" },
  { id: "tumblr",    icon: "📝", name: "Tumblr",      color: "#35465c" },
];

const FIELDS: Record<string, string[]> = {
  tiktok:    ["Client Key", "Client Secret", "Access Token", "Redirect URI"],
  instagram: ["App ID", "App Secret", "Access Token", "Redirect URI"],
  facebook:  ["App ID", "App Secret", "Page Access Token", "Redirect URI"],
  threads:   ["App ID", "App Secret", "Access Token", "Redirect URI"],
  youtube:   ["Client ID", "Client Secret", "API Key", "Redirect URI"],
  x:         ["API Key", "API Secret", "Access Token", "Access Token Secret"],
  linkedin:  ["Client ID", "Client Secret", "Access Token", "Redirect URI"],
  pinterest: ["App ID", "App Secret", "Access Token", "Redirect URI"],
  snapchat:  ["Client ID", "Client Secret", "Access Token", "Redirect URI"],
  reddit:    ["Client ID", "Client Secret", "Username", "Password"],
  telegram:  ["Bot Token", "Chat ID", "Webhook URL", ""],
  discord:   ["Bot Token", "Guild ID", "Channel ID", "Webhook URL"],
  medium:    ["Integration Token", "Publication ID", "", ""],
  wordpress: ["Site URL", "Username", "Application Password", ""],
  tumblr:    ["Consumer Key", "Consumer Secret", "OAuth Token", "OAuth Token Secret"],
};

interface ProviderRecord {
  id: string;
  providerName: string;
  displayName: string;
  status: string;
  followers?: string;
  connectionSource?: string;
}

const isDevMode = import.meta.env.VITE_DEV_MODE === "true" || import.meta.env.DEV;

export function SocialPage() {
  const { token, user } = useAuth();
  const [selected, setSelected] = useState("tiktok");
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Map of platformId -> ProviderRecord (from DB)
  const [connectedMap, setConnectedMap] = useState<Record<string, ProviderRecord>>({});
  const [loadingProviders, setLoadingProviders] = useState(true);

  // AI Multi-channel publishing modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishForm, setPublishForm] = useState({ title: "", description: "", videoUrl: "", tags: "#OCTOPUS_OS #AI #Viral", aiOptimize: true });
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  // Fetch connected social accounts on mount
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/social`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const accounts = data.accounts || data || [];
          const map: Record<string, ProviderRecord> = {};
          for (const p of accounts) {
            const platformId = PLATFORMS.find(
              pl =>
                pl.id === p.platform?.toLowerCase() ||
                pl.name.toLowerCase() === p.platform?.toLowerCase()
            )?.id;
            if (platformId) {
              map[platformId] = { ...p, providerName: p.platform, status: p.status || "disconnected" };
            }
          }
          setConnectedMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch social accounts:", err);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchSocialAccounts();
  }, [token]);

  // Auto-connect all platforms using server-side env vars
  const [autoConnecting, setAutoConnecting] = useState(false);
  const autoConnect = async () => {
    if (!token) return;
    setAutoConnecting(true);
    setSaveMsg("");
    try {
      const res = await fetch(`${API_BASE}/social/auto-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Auto-connect failed");
      }
      const data = await res.json();
      // Refresh connected accounts
      const res2 = await fetch(`${API_BASE}/social`, { headers: { Authorization: `Bearer ${token}` } });
      if (res2.ok) {
        const data2 = await res2.json();
        const accounts = data2.accounts || data2 || [];
        const map: Record<string, ProviderRecord> = {};
        for (const p of accounts) {
          const platformId = PLATFORMS.find(
            pl => pl.id === p.platform?.toLowerCase() || pl.name.toLowerCase() === p.platform?.toLowerCase()
          )?.id;
          if (platformId) map[platformId] = { ...p, providerName: p.platform, status: p.status || "disconnected" };
        }
        setConnectedMap(map);
      }
      setSaveMsg(data.message || "✅ تم ربط جميع المنصات بنجاح!");
    } catch (err: any) {
      setSaveMsg(`❌ ${err.message}`);
    } finally {
      setAutoConnecting(false);
    }
  };

  const defaultDomain = "finalsnapshot.vercel.app";
  const apiUrl = API_BASE.replace(/\/api$/, "");
  const domain = apiUrl.replace("https://", "").replace("http://", "") || defaultDomain;

  const platforms = PLATFORMS.map(p => {
    const record = connectedMap[p.id];
    let status = record?.status || "NOT_CONFIGURED";
    
    if (status === "active" || status === "configured" || status === "connected") {
      status = "CONNECTED";
    }

    return {
      ...p,
      status,
      followers: record?.followers || "0",
      dbId: record?.id,
      connectionSource: record?.connectionSource,
    };
  });

  const platform = platforms.find(p => p.id === selected)!;
  const fields = FIELDS[selected] || [];

  const setVal = (field: string, val: string) => {
    setValues(v => ({ ...v, [selected]: { ...v[selected], [field]: val } }));
  };

  const connect = async () => {
    if (!token || !user) {
      setSaveMsg("❌ Please login first");
      return;
    }
    setSaving(true);
    setSaveMsg("⏳ Redirecting to authorization provider...");
    
    // Construct the connect URL pointing to our unified backend OAuth flow
    const connectUrl = `${API_BASE}/oauth/${selected}/connect?userId=${user.id}`;
    
    // Redirect the browser entirely. The OAuth provider will redirect back to our backend callback,
    // which will then redirect back to the frontend root (/) or a specific route.
    window.location.href = connectUrl;
  };

  const disconnect = async () => {
    if (!token) return;
    const record = connectedMap[selected];
    if (!record) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch(`${API_BASE}/social/${record.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to disconnect");
      }

      setConnectedMap(prev => {
        const next = { ...prev };
        delete next[selected];
        return next;
      });
      setSaveMsg("✅ Disconnected successfully");
    } catch (err: any) {
      setSaveMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const saveConfig = async () => {
    const platformValues = values[selected];
    if (platformValues && Object.values(platformValues).some(v => v)) {
      if (!token) return;
      setSaving(true);
      setSaveMsg("");
      try {
        const payload = {
          platform: selected,
          apiKey: platformValues["API Key"] || platformValues["App ID"] || platformValues["Client ID"] || platformValues["Client Key"] || "",
          apiSecret: platformValues["API Secret"] || platformValues["App Secret"] || platformValues["Client Secret"] || "",
          accessToken: platformValues["Access Token"] || platformValues["Bot Token"] || platformValues["OAuth Token"] || platformValues["Integration Token"] || platformValues["Page Access Token"] || "",
          status: "connected",
          connectionSource: "manual"
        };
        const res = await fetch(`${API_BASE}/social`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || "Failed to save credentials");
        }
        setSaveMsg("✅ تم الحفظ بنجاح");
        // refresh
        const res2 = await fetch(`${API_BASE}/social`, { headers: { Authorization: `Bearer ${token}` } });
        if (res2.ok) {
          const data2 = await res2.json();
          const map: Record<string, ProviderRecord> = {};
          for (const p of (data2.accounts || data2 || [])) {
            const platformId = PLATFORMS.find(pl => pl.id === p.platform?.toLowerCase() || pl.name.toLowerCase() === p.platform?.toLowerCase())?.id;
            if (platformId) map[platformId] = { ...p, providerName: p.platform, status: p.status || "disconnected" };
          }
          setConnectedMap(map);
        }
      } catch (err: any) {
        setSaveMsg(`❌ ${err.message}`);
      } finally {
        setSaving(false);
      }
    } else {
      await connect();
    }
  };

  const testConn = async () => {
    setTesting(true);
    setTestMsg("");
    // Fetch latest status from DB
    try {
      const res = await fetch(`${API_BASE}/social`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const accounts = data.accounts || [];
      const dbRecord = accounts.find((a: any) => a.platform.toLowerCase() === selected);
      
      if (dbRecord && (dbRecord.status === "connected" || dbRecord.status === "active")) {
        setTestMsg("✅ Connection successful — Authenticated with DB");
      } else {
        setTestMsg("❌ Not connected — Please OAuth or add credentials first");
      }
    } catch (err) {
      setTestMsg("❌ Error connecting to database");
    }
    setTesting(false);
  };

  const handlePublishAll = async () => {
    if (!publishForm.title) {
      setSaveMsg("❌ يرجى إدخال عنوان المنشور على الأقل");
      return;
    }
    setPublishing(true);
    setPublishResult(null);
    try {
      const tagsArray = publishForm.tags.split(" ").filter(Boolean);
      const res = await fetch(`${API_BASE}/social/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          title: publishForm.title,
          description: publishForm.description,
          videoUrl: publishForm.videoUrl || undefined,
          tags: tagsArray,
          platforms: ["all"],
          aiOptimize: publishForm.aiOptimize,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "فشل النشر المتزامن");
      }

      const data = await res.json();
      setPublishResult(`✅ ${data.summary}`);
      setSaveMsg("🚀 تم إرسال المحتوى لكل المنصات المتصلة بنجاح!");
    } catch (err: any) {
      setPublishResult(`❌ فشل النشر: ${err.message}`);
      setSaveMsg(`❌ ${err.message}`);
    } finally {
      setPublishing(false);
    }
  };

  const redirectUri = `https://${domain}/oauth/${selected}/callback`;

  return (
    <div className="flex h-full min-h-screen relative" style={{ background: "#0a0614" }}>
      {/* AI Multi-channel Auto-Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#130d2a] border border-purple-600/60 rounded-2xl p-6 max-w-md w-full shadow-[0_0_40px_rgba(126,34,206,0.3)]">
            <h3 className="text-lg font-black text-white mb-2 flex items-center gap-2">
              <span>🤖</span> النشر الذكي المتزامن (AI Social Engine)
            </h3>
            <p className="text-xs text-purple-300 mb-4">
              سيقوم المحرك الذكي بصياغة وتحسين الوصف والهاشتاغات تلقائياً بما يناسب كل منصة متصلة (Reels / Shorts / Posts).
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[10px] font-bold text-purple-400 mb-1">عنوان الفيديو / المنشور *</label>
                <input
                  type="text"
                  value={publishForm.title}
                  onChange={e => setPublishForm({ ...publishForm, title: e.target.value })}
                  placeholder="مثال: سر الربح من الذكاء الاصطناعي في 2026"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-purple-400 mb-1">الوصف التفصيلي</label>
                <textarea
                  rows={3}
                  value={publishForm.description}
                  onChange={e => setPublishForm({ ...publishForm, description: e.target.value })}
                  placeholder="اكتب هنا تفاصيل الفيديو، وسيتكفل الوكيل الذكي بتعديله لكل منصة..."
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-purple-400 mb-1">رابط ملف الفيديو (Video URL - اختيار للمقاطع)</label>
                <input
                  type="text"
                  value={publishForm.videoUrl}
                  onChange={e => setPublishForm({ ...publishForm, videoUrl: e.target.value })}
                  placeholder="https://.../video.mp4"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-purple-400 mb-1">الهاشتاغات المستهدفة</label>
                <input
                  type="text"
                  value={publishForm.tags}
                  onChange={e => setPublishForm({ ...publishForm, tags: e.target.value })}
                  placeholder="#AI #Viral #OCTOPUS"
                  className="w-full bg-[#0d0920] border border-purple-800/50 rounded-lg px-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={publishForm.aiOptimize}
                  onChange={e => setPublishForm({ ...publishForm, aiOptimize: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-bold text-emerald-400">✨ تفعيل تحسين المحتوى الآلي لكل منصة (AI Tailoring)</span>
              </label>
            </div>

            {publishResult && (
              <div className="p-3 bg-[#0d0920] border border-purple-800/50 rounded-xl text-xs font-mono text-purple-200 mb-4 break-words">
                {publishResult}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowPublishModal(false)}
                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all"
              >
                إغلاق
              </button>
              <button
                onClick={() => void handlePublishAll()}
                disabled={publishing}
                className="flex-[2] px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {publishing ? "⏳ جارٍ النشر المتزامن..." : "🚀 انشر على كل المنصات الآن"}
              </button>
            </div>
          </div>
        </div>
      )}

        {/* Platform List */}
      <div className="w-52 shrink-0 py-4 px-2 overflow-y-auto" style={{ background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="flex items-center justify-between px-2 py-2 mb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50">
            {loadingProviders ? "Loading..." : "15 Platforms"}
          </span>
          <button
            onClick={() => setShowPublishModal(true)}
            className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[9px] font-black rounded shadow transition-all"
          >
            🚀 نشر ذكي
          </button>
        </div>
        {platforms.map(p => {
          const isConnected = ["CONNECTED", "LIVE_VERIFIED"].includes(p.status);
          return (
            <button key={p.id} onClick={() => { setSelected(p.id); setTestMsg(""); setSaveMsg(""); }}
              className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium mb-0.5 transition-all ${selected === p.id ? "gradient-purple text-white" : "text-purple-300/70 hover:bg-purple-900/30"}`}>
              <span className="text-sm">{p.icon}</span>
              <span className="flex-1 text-left">{p.name}</span>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isConnected ? "bg-emerald-400" : "bg-gray-600"}`}></div>
            </button>
          );
        })}
      </div>

      {/* Platform Config */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selected !== "youtube" && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{platform.icon}</span>
              <div>
                <h1 className="text-xl font-bold text-white">{platform.name}</h1>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${["CONNECTED", "LIVE_VERIFIED"].includes(platform.status) ? "bg-emerald-400" : "bg-gray-600"}`}></span>
                  <span className={`text-xs ${["CONNECTED", "LIVE_VERIFIED"].includes(platform.status) ? "text-emerald-400" : "text-gray-500"}`}>
                    {platform.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={testConn} disabled={testing}
                className="px-3 py-2 rounded-lg text-xs text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all">
                {testing ? "⟳ Testing..." : "🧪 Test Connection"}
              </button>
              {platform.status !== "NOT_CONFIGURED" ? (
                <button onClick={disconnect} disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all bg-red-900/50 text-red-400 border border-red-500/30">
                  {saving ? "⟳ Disconnecting..." : "🔌 Disconnect"}
                </button>
              ) : (
                <button onClick={connect} disabled={saving}
                  className="px-4 py-2 rounded-lg text-xs font-semibold transition-all gradient-purple text-white glow-purple">
                  {saving ? "⟳ Connecting..." : "🔗 Connect"}
                </button>
              )}
            </div>
          </div>
        )}

        {selected !== "youtube" && (
          <div className="mb-6 flex flex-col gap-3">
            <button
              onClick={autoConnect}
              disabled={autoConnecting}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-700/90 to-cyan-700/90 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold py-3.5 px-6 rounded-xl text-xs border border-emerald-500/60 transition-all text-center shadow-[0_0_20px_rgba(16,185,129,0.3)] w-full"
            >
              {autoConnecting ? "⟳ جاري الربط التلقائي..." : "⚡ ربط جميع المنصات تلقائياً (ضغطة واحدة)"}
            </button>
            {["CONNECTED", "LIVE_VERIFIED"].includes(platform.status) && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-900/30 border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-400 text-xs font-bold">✅ {platform.name} متصل ومفعّل</span>
              </div>
            )}
            <div className="flex items-center my-1">
              <div className="flex-1 border-t border-purple-950/50" />
              <span className="px-2 text-[9px] text-purple-600 uppercase font-bold tracking-wider">أو الإعداد اليدوي أدناه</span>
              <div className="flex-1 border-t border-purple-950/50" />
            </div>
          </div>
        )}

        {testMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-xs ${testMsg.includes("✅") ? "bg-emerald-900/20 text-emerald-400 border border-emerald-500/20" : "bg-red-900/20 text-red-400 border border-red-500/20"}`}>
            {testMsg}
          </div>
        )}

        {saveMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-xs ${saveMsg.includes("✅") ? "bg-emerald-900/20 text-emerald-400 border border-emerald-500/20" : "bg-red-900/20 text-red-400 border border-red-500/20"}`}>
            {saveMsg}
          </div>
        )}

        {selected === "youtube" ? (
          <YouTubeConnectionCard />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {fields.filter(Boolean).map(field => (
                <div key={field}>
                  <label className="text-xs text-purple-400 mb-1 block">{field}</label>
                  <input
                    type={field.toLowerCase().includes("secret") || field.toLowerCase().includes("token") || field.toLowerCase().includes("password") ? "password" : "text"}
                    value={values[selected]?.[field] || ""}
                    onChange={e => setVal(field, e.target.value)}
                    placeholder={`Enter ${field.toLowerCase()}...`}
                    className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none transition-all"
                    style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }}
                  />
                </div>
              ))}
            </div>

            <button onClick={saveConfig} disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">
              {saving ? "⟳ Saving..." : "💾 Save Configuration"}
            </button>
          </>
        )}

        {/* OAuth URI */}
        <div className="mt-6 card-os p-4">
          <h3 className="text-xs font-bold text-purple-300 mb-3">🔗 OAuth URIs (auto-generated)</h3>
          <div className="space-y-2">
            {[["Redirect URI", redirectUri], ["Callback URL", `https://${domain}/oauth/${selected}/callback`],
              ["Webhook URL", `https://${domain}/webhook/${selected}`]].map(([label, val]) => (
              <div key={label}>
                <div className="text-[10px] text-purple-400/60 mb-1">{label}</div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "#0a0614", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <code className="text-xs text-purple-300 flex-1 break-all">{val}</code>
                  <button onClick={() => navigator.clipboard.writeText(val)}
                    className="text-purple-400 hover:text-purple-300 text-xs shrink-0">📋</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Navigation Bar */}
        <div className="mt-10 border-t border-purple-900/30 pt-6 flex justify-between items-center bg-black/20 p-4 rounded-xl">
          <div>
            <h3 className="text-sm font-bold text-white mb-1">الخطوة التالية (Next Step)</h3>
            <p className="text-xs text-purple-400">بعد ربط حسابات النشر بنجاح، أنت جاهز لإنشاء حملتك التسويقية الأولى.</p>
          </div>
          <button 
            onClick={() => window.location.href = "/?page=campaigns"}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-sm font-bold rounded-lg shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all transform hover:scale-105">
            الذهاب إلى Campaigns ➡️
          </button>
        </div>

      </div>
    </div>
  );
}
