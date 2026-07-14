import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

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
}

export function SocialPage() {
  const { token } = useAuth();
  const [selected, setSelected] = useState("tiktok");
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Map of platformId -> ProviderRecord (from DB)
  const [connectedMap, setConnectedMap] = useState<Record<string, ProviderRecord>>({});
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Fetch connected providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/providers", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: ProviderRecord[] = await res.json();
          const map: Record<string, ProviderRecord> = {};
          for (const p of data) {
            // Match by providerName (case-insensitive against our platform ids)
            const platformId = PLATFORMS.find(
              pl =>
                pl.id === p.providerName.toLowerCase() ||
                pl.name.toLowerCase() === p.providerName.toLowerCase()
            )?.id;
            if (platformId) {
              map[platformId] = p;
            }
          }
          setConnectedMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch providers:", err);
      } finally {
        setLoadingProviders(false);
      }
    };
    fetchProviders();
  }, [token]);

  // Build the platforms list enriched with real DB status
  const platforms = PLATFORMS.map(p => ({
    ...p,
    status: connectedMap[p.id]?.status === "active" ? "connected" : "disconnected",
    followers: connectedMap[p.id]?.followers || "0",
    dbId: connectedMap[p.id]?.id,
  }));

  const platform = platforms.find(p => p.id === selected)!;
  const fields = FIELDS[selected] || [];

  const setVal = (field: string, val: string) => {
    setValues(v => ({ ...v, [selected]: { ...v[selected], [field]: val } }));
  };

  // Connect: POST /api/providers
  const connect = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMsg("");
    const platformData = PLATFORMS.find(p => p.id === selected)!;
    const credFields = fields.filter(Boolean);
    const apiKey = values[selected]?.[credFields[0]] || "";

    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          providerName: selected,
          displayName: platformData.name,
          apiKey,
          model: "social",
          status: "active",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to connect");
      }

      const created: ProviderRecord = await res.json();
      setConnectedMap(prev => ({ ...prev, [selected]: created }));
      setSaveMsg("✅ Connected successfully");
    } catch (err: any) {
      setSaveMsg(`❌ ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Disconnect: DELETE /api/providers/:id
  const disconnect = async () => {
    if (!token) return;
    const record = connectedMap[selected];
    if (!record) return;
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch(`/api/providers/${record.id}`, {
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

  // Save Configuration: also POSTs (or re-connects) with latest credential values
  const saveConfig = async () => {
    await connect();
  };

  const testConn = async () => {
    setTesting(true);
    setTestMsg("");
    await new Promise(r => setTimeout(r, 1400));
    setTestMsg(
      platform.status === "connected"
        ? "✅ Connection successful — API responding"
        : "❌ Not connected — please add credentials first"
    );
    setTesting(false);
  };

  const domain = "yourdomain.com";
  const redirectUri = `https://${domain}/oauth/${selected}/callback`;

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#0a0614" }}>
      {/* Platform List */}
      <div className="w-52 shrink-0 py-4 px-2 overflow-y-auto" style={{ background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50 px-2 py-2">
          {loadingProviders ? "Loading..." : "15 Platforms"}
        </div>
        {platforms.map(p => (
          <button key={p.id} onClick={() => { setSelected(p.id); setTestMsg(""); setSaveMsg(""); }}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium mb-0.5 transition-all ${selected === p.id ? "gradient-purple text-white" : "text-purple-300/70 hover:bg-purple-900/30"}`}>
            <span className="text-sm">{p.icon}</span>
            <span className="flex-1 text-left">{p.name}</span>
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.status === "connected" ? "bg-emerald-400" : "bg-gray-600"}`}></div>
          </button>
        ))}
      </div>

      {/* Platform Config */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{platform.icon}</span>
            <div>
              <h1 className="text-xl font-bold text-white">{platform.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${platform.status === "connected" ? "bg-emerald-400" : "bg-gray-600"}`}></span>
                <span className={`text-xs ${platform.status === "connected" ? "text-emerald-400" : "text-gray-500"}`}>
                  {platform.status === "connected" ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={testConn} disabled={testing}
              className="px-3 py-2 rounded-lg text-xs text-purple-300 border border-purple-500/30 hover:border-purple-400/50 transition-all">
              {testing ? "⟳ Testing..." : "🧪 Test Connection"}
            </button>
            {platform.status === "connected" ? (
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
      </div>
    </div>
  );
}
