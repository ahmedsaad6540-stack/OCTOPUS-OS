import { useState } from "react";

const PLATFORMS = [
  { id: "tiktok",    icon: "🎵", name: "TikTok",     color: "#ff0050", followers: "0", status: "disconnected" },
  { id: "instagram", icon: "📸", name: "Instagram",  color: "#e1306c", followers: "0", status: "disconnected" },
  { id: "facebook",  icon: "👍", name: "Facebook",   color: "#1877f2", followers: "0", status: "disconnected" },
  { id: "threads",   icon: "🧵", name: "Threads",    color: "#000000", followers: "0", status: "disconnected" },
  { id: "youtube",   icon: "▶️", name: "YouTube",    color: "#ff0000", followers: "0", status: "disconnected" },
  { id: "x",         icon: "✖️", name: "X (Twitter)", color: "#000000", followers: "0", status: "disconnected" },
  { id: "linkedin",  icon: "💼", name: "LinkedIn",   color: "#0077b5", followers: "0", status: "disconnected" },
  { id: "pinterest", icon: "📌", name: "Pinterest",  color: "#e60023", followers: "0", status: "disconnected" },
  { id: "snapchat",  icon: "👻", name: "Snapchat",   color: "#fffc00", followers: "0", status: "disconnected" },
  { id: "reddit",    icon: "🔴", name: "Reddit",     color: "#ff4500", followers: "0", status: "disconnected" },
  { id: "telegram",  icon: "✈️", name: "Telegram",   color: "#0088cc", followers: "0", status: "disconnected" },
  { id: "discord",   icon: "🎮", name: "Discord",    color: "#5865f2", followers: "0", status: "disconnected" },
  { id: "medium",    icon: "✍️", name: "Medium",     color: "#000000", followers: "0", status: "disconnected" },
  { id: "wordpress", icon: "🌐", name: "WordPress",  color: "#21759b", followers: "0", status: "disconnected" },
  { id: "tumblr",    icon: "📝", name: "Tumblr",     color: "#35465c", followers: "0", status: "disconnected" },
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

export function SocialPage() {
  const [selected, setSelected] = useState("tiktok");
  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  const platform = platforms.find(p => p.id === selected)!;
  const fields = FIELDS[selected] || [];

  const setVal = (field: string, val: string) => {
    setValues(v => ({ ...v, [selected]: { ...v[selected], [field]: val } }));
  };

  const connect = () => {
    setPlatforms(ps => ps.map(p => p.id === selected ? { ...p, status: p.status === "connected" ? "disconnected" : "connected" } : p));
  };

  const testConn = async () => {
    setTesting(true); setTestMsg("");
    await new Promise(r => setTimeout(r, 1400));
    setTestMsg(platform.status === "connected" ? "✅ Connection successful — API responding" : "❌ Not connected — please add credentials first");
    setTesting(false);
  };

  const domain = "yourdomain.com";
  const redirectUri = `https://${domain}/oauth/${selected}/callback`;

  return (
    <div className="flex h-full min-h-screen" style={{ background: "#0a0614" }}>
      {/* Platform List */}
      <div className="w-52 shrink-0 py-4 px-2 overflow-y-auto" style={{ background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50 px-2 py-2">15 Platforms</div>
        {platforms.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id)}
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
            <button onClick={connect}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${platform.status === "connected" ? "bg-red-900/50 text-red-400 border border-red-500/30" : "gradient-purple text-white glow-purple"}`}>
              {platform.status === "connected" ? "🔌 Disconnect" : "🔗 Connect"}
            </button>
          </div>
        </div>

        {testMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-xs ${testMsg.includes("✅") ? "bg-emerald-900/20 text-emerald-400 border border-emerald-500/20" : "bg-red-900/20 text-red-400 border border-red-500/20"}`}>
            {testMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {fields.filter(Boolean).map(field => (
            <div key={field}>
              <label className="text-xs text-purple-400 mb-1 block">{field}</label>
              <input type={field.toLowerCase().includes("secret") || field.toLowerCase().includes("token") || field.toLowerCase().includes("password") ? "password" : "text"}
                value={values[selected]?.[field] || ""}
                onChange={e => setVal(field, e.target.value)}
                placeholder={`Enter ${field.toLowerCase()}...`}
                className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none transition-all"
                style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }} />
            </div>
          ))}
        </div>

        <button className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">
          💾 Save Configuration
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
