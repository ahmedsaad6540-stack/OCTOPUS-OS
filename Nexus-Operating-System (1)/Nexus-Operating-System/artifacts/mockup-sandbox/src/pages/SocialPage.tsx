import { useState } from "react";

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  fields: Array<{ key: string; label: string; type: string; placeholder: string; required?: boolean }>;
  status: "connected" | "expired" | "disconnected";
  username?: string;
  expiresAt?: string;
  followers?: string;
  postsToday?: number;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "tiktok", name: "TikTok", icon: "🎵", color: "from-pink-900/30 border-pink-800/40", status: "connected", username: "@octopus.ai", followers: "12.4K", postsToday: 4,
    fields: [
      { key: "clientId",     label: "Client ID",      type: "text",     placeholder: "TikTok Client ID",     required: true },
      { key: "clientSecret", label: "Client Secret",  type: "password", placeholder: "TikTok Client Secret", required: true },
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "Long-lived access token" },
      { key: "refreshToken", label: "Refresh Token",  type: "password", placeholder: "Refresh token" },
      { key: "redirectUri",  label: "Redirect URI",   type: "text",     placeholder: "https://yourdomain.com/oauth/tiktok" },
      { key: "openId",       label: "Open ID",        type: "text",     placeholder: "User Open ID" },
    ],
  },
  {
    id: "youtube", name: "YouTube", icon: "📺", color: "from-red-900/30 border-red-800/40", status: "connected", username: "@OctopusNexus", followers: "3.2K", postsToday: 1,
    fields: [
      { key: "clientId",     label: "Client ID",      type: "text",     placeholder: "Google Client ID",    required: true },
      { key: "clientSecret", label: "Client Secret",  type: "password", placeholder: "Google Client Secret",required: true },
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "OAuth access token" },
      { key: "refreshToken", label: "Refresh Token",  type: "password", placeholder: "OAuth refresh token" },
      { key: "channelId",    label: "Channel ID",     type: "text",     placeholder: "UCxxxxxxxxxxxxxx" },
      { key: "redirectUri",  label: "Redirect URI",   type: "text",     placeholder: "https://yourdomain.com/oauth/google" },
    ],
  },
  {
    id: "instagram", name: "Instagram", icon: "📸", color: "from-purple-900/30 border-purple-800/40", status: "connected", username: "@octopus.nexus", followers: "5.7K", postsToday: 2,
    fields: [
      { key: "appId",        label: "App ID",         type: "text",     placeholder: "Meta App ID",         required: true },
      { key: "appSecret",    label: "App Secret",     type: "password", placeholder: "Meta App Secret",     required: true },
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "Long-lived page token" },
      { key: "pageId",       label: "Page ID",        type: "text",     placeholder: "Instagram Business Page ID" },
      { key: "redirectUri",  label: "Redirect URI",   type: "text",     placeholder: "https://yourdomain.com/oauth/meta" },
    ],
  },
  {
    id: "facebook", name: "Facebook", icon: "👤", color: "from-blue-900/30 border-blue-800/40", status: "disconnected",
    fields: [
      { key: "appId",        label: "App ID",         type: "text",     placeholder: "Meta App ID",         required: true },
      { key: "appSecret",    label: "App Secret",     type: "password", placeholder: "Meta App Secret",     required: true },
      { key: "accessToken",  label: "Page Token",     type: "password", placeholder: "Facebook page access token" },
      { key: "pageId",       label: "Page ID",        type: "text",     placeholder: "Facebook Page ID" },
    ],
  },
  {
    id: "threads", name: "Threads", icon: "🧵", color: "from-gray-900/30 border-gray-800/40", status: "disconnected",
    fields: [
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "Threads API token", required: true },
      { key: "userId",       label: "User ID",        type: "text",     placeholder: "Threads User ID" },
    ],
  },
  {
    id: "twitter", name: "X (Twitter)", icon: "🐦", color: "from-sky-900/30 border-sky-800/40", status: "expired", username: "@OctopusOS", expiresAt: "Expired Jun 15",
    fields: [
      { key: "apiKey",       label: "API Key",        type: "text",     placeholder: "Twitter API Key",     required: true },
      { key: "apiSecret",    label: "API Secret",     type: "password", placeholder: "Twitter API Secret",  required: true },
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "OAuth access token" },
      { key: "tokenSecret",  label: "Token Secret",   type: "password", placeholder: "OAuth token secret" },
      { key: "bearerToken",  label: "Bearer Token",   type: "password", placeholder: "App-only bearer token" },
    ],
  },
  {
    id: "pinterest", name: "Pinterest", icon: "📌", color: "from-red-900/30 border-red-800/40", status: "expired", username: "@octopus_ai", expiresAt: "Expired Jun 28",
    fields: [
      { key: "appId",        label: "App ID",         type: "text",     placeholder: "Pinterest App ID",    required: true },
      { key: "appSecret",    label: "App Secret",     type: "password", placeholder: "Pinterest App Secret",required: true },
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "Pinterest access token" },
      { key: "redirectUri",  label: "Redirect URI",   type: "text",     placeholder: "https://yourdomain.com/oauth/pinterest" },
    ],
  },
  {
    id: "linkedin", name: "LinkedIn", icon: "💼", color: "from-blue-900/30 border-blue-800/40", status: "disconnected",
    fields: [
      { key: "clientId",     label: "Client ID",      type: "text",     placeholder: "LinkedIn Client ID",  required: true },
      { key: "clientSecret", label: "Client Secret",  type: "password", placeholder: "LinkedIn Secret",     required: true },
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "OAuth access token" },
      { key: "organizationId", label: "Org ID",       type: "text",     placeholder: "LinkedIn Organization ID" },
    ],
  },
  {
    id: "reddit", name: "Reddit", icon: "🤖", color: "from-orange-900/30 border-orange-800/40", status: "disconnected",
    fields: [
      { key: "clientId",     label: "Client ID",      type: "text",     placeholder: "Reddit App Client ID",required: true },
      { key: "clientSecret", label: "Client Secret",  type: "password", placeholder: "Reddit App Secret",   required: true },
      { key: "username",     label: "Username",       type: "text",     placeholder: "u/your-username" },
      { key: "password",     label: "Password",       type: "password", placeholder: "Account password" },
    ],
  },
  {
    id: "telegram", name: "Telegram", icon: "✈️", color: "from-cyan-900/30 border-cyan-800/40", status: "disconnected",
    fields: [
      { key: "botToken",     label: "Bot Token",      type: "password", placeholder: "123456:ABC-xxx",      required: true },
      { key: "channelId",    label: "Channel ID",     type: "text",     placeholder: "@yourchannel or -100xxxxxxxxxx" },
      { key: "chatId",       label: "Chat ID",        type: "text",     placeholder: "Optional chat ID" },
    ],
  },
  {
    id: "discord", name: "Discord", icon: "🎮", color: "from-indigo-900/30 border-indigo-800/40", status: "disconnected",
    fields: [
      { key: "botToken",     label: "Bot Token",      type: "password", placeholder: "Discord bot token",   required: true },
      { key: "guildId",      label: "Server ID",      type: "text",     placeholder: "Discord Server (Guild) ID" },
      { key: "channelId",    label: "Channel ID",     type: "text",     placeholder: "Default channel ID" },
      { key: "webhookUrl",   label: "Webhook URL",    type: "text",     placeholder: "https://discord.com/api/webhooks/..." },
    ],
  },
  {
    id: "snapchat", name: "Snapchat", icon: "👻", color: "from-yellow-900/30 border-yellow-800/40", status: "disconnected",
    fields: [
      { key: "clientId",     label: "Client ID",      type: "text",     placeholder: "Snap Kit Client ID",  required: true },
      { key: "clientSecret", label: "Client Secret",  type: "password", placeholder: "Snap Kit Secret" },
      { key: "accessToken",  label: "Access Token",   type: "password", placeholder: "Snapchat access token" },
    ],
  },
  {
    id: "wordpress", name: "WordPress", icon: "🌐", color: "from-blue-900/30 border-blue-800/40", status: "disconnected",
    fields: [
      { key: "siteUrl",      label: "Site URL",       type: "text",     placeholder: "https://yoursite.com", required: true },
      { key: "username",     label: "Username",       type: "text",     placeholder: "WordPress admin username" },
      { key: "appPassword",  label: "App Password",   type: "password", placeholder: "WordPress Application Password" },
      { key: "apiKey",       label: "API Key",        type: "password", placeholder: "Optional REST API key" },
    ],
  },
  {
    id: "medium", name: "Medium", icon: "✍️", color: "from-gray-900/30 border-gray-800/40", status: "disconnected",
    fields: [
      { key: "integrationToken", label: "Integration Token", type: "password", placeholder: "Medium integration token", required: true },
      { key: "publicationId",    label: "Publication ID",    type: "text",     placeholder: "Optional publication ID" },
    ],
  },
  {
    id: "tumblr", name: "Tumblr", icon: "🎭", color: "from-blue-900/30 border-blue-800/40", status: "disconnected",
    fields: [
      { key: "consumerKey",   label: "Consumer Key",    type: "text",     placeholder: "Tumblr Consumer Key",   required: true },
      { key: "consumerSecret", label: "Consumer Secret", type: "password", placeholder: "Tumblr Consumer Secret" },
      { key: "oauthToken",    label: "OAuth Token",     type: "password", placeholder: "OAuth token" },
      { key: "oauthSecret",   label: "OAuth Secret",    type: "password", placeholder: "OAuth token secret" },
    ],
  },
];

const STATUS_CFG = {
  connected:    { dot: "bg-emerald-400 animate-pulse shadow-[0_0_5px_#34d399]", text: "text-emerald-400", badge: "bg-emerald-900/20 border-emerald-800/30 text-emerald-400" },
  expired:      { dot: "bg-amber-400", text: "text-amber-400", badge: "bg-amber-900/20 border-amber-800/30 text-amber-400" },
  disconnected: { dot: "bg-gray-700", text: "text-gray-500", badge: "bg-gray-900/20 border-gray-800/20 text-gray-500" },
};

export function SocialPage() {
  const [platforms, setPlatforms] = useState(PLATFORMS);
  const [selected, setSelected] = useState<PlatformConfig | null>(PLATFORMS[0]);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setPlatforms((prev) => prev.map((p) => p.id === selected.id ? { ...p, status: "connected" } : p));
    setSaving(false);
  };

  const test = async () => {
    if (!selected) return;
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    const ok = Math.random() > 0.2;
    setPlatforms((prev) => prev.map((p) => p.id === selected.id ? { ...p, status: ok ? "connected" : "expired" } : p));
    setTesting(false);
  };

  const disconnect = (id: string) => {
    setPlatforms((prev) => prev.map((p) => p.id === id ? { ...p, status: "disconnected", username: undefined } : p));
    if (selected?.id === id) setSelected((s) => s ? { ...s, status: "disconnected" } : null);
  };

  const connected = platforms.filter((p) => p.status === "connected").length;

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex">
      {/* Platform List */}
      <div className="w-52 border-r border-purple-900/30 flex flex-col">
        <div className="p-4 border-b border-purple-900/30">
          <h1 className="text-sm font-black text-white">📱 Social Hub</h1>
          <p className="text-[10px] text-purple-500 mt-0.5">{connected}/{platforms.length} connected</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {platforms.map((p) => {
            const s = STATUS_CFG[p.status];
            return (
              <button
                key={p.id}
                onClick={() => { setSelected(p); setForm({}); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-left transition-all border ${selected?.id === p.id ? "bg-purple-900/40 border-purple-700/40" : "hover:bg-purple-900/20 border-transparent"}`}
              >
                <span className="text-lg">{p.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{p.name}</p>
                  {p.username ? (
                    <p className="text-[9px] text-purple-600 truncate">{p.username}</p>
                  ) : (
                    <p className="text-[9px] text-gray-600">{p.expiresAt ?? "Not connected"}</p>
                  )}
                </div>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Platform Config */}
      {selected && (
        <div className="flex-1 overflow-y-auto p-5">
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selected.icon}</span>
                <div>
                  <h2 className="text-lg font-black text-white">{selected.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={`w-2 h-2 rounded-full ${STATUS_CFG[selected.status].dot}`} />
                    <span className={`text-xs font-mono ${STATUS_CFG[selected.status].text}`}>
                      {selected.status === "connected" ? `Connected${selected.username ? ` · ${selected.username}` : ""}` : selected.status === "expired" ? `Token expired${selected.expiresAt ? ` · ${selected.expiresAt}` : ""}` : "Not Connected"}
                    </span>
                  </div>
                </div>
              </div>
              {selected.status === "connected" && (
                <button onClick={() => disconnect(selected.id)} className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 hover:border-red-700 px-3 py-1.5 rounded-lg font-bold transition-all">
                  Disconnect
                </button>
              )}
            </div>

            {selected.status === "connected" && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: "Followers", value: selected.followers ?? "—" },
                  { label: "Posts Today", value: String(selected.postsToday ?? 0) },
                  { label: "Status", value: "Active" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-3 text-center">
                    <p className="text-sm font-black text-white">{value}</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">🔑 API Configuration</h3>
              <div className="grid grid-cols-1 gap-3">
                {selected.fields.map(({ key, label, type, placeholder, required }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">
                      {label} {required && <span className="text-red-400">*</span>}
                    </label>
                    <input
                      type={type}
                      value={form[key] ?? ""}
                      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                      placeholder={placeholder}
                      autoComplete="off"
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-xs placeholder-purple-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => void save()} disabled={saving} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs">
                  {saving ? "Saving..." : selected.status === "connected" ? "Update Credentials" : "Connect Account"}
                </button>
                <button onClick={() => void test()} disabled={testing} className="flex-1 bg-blue-900/20 text-blue-300 font-bold py-2.5 rounded-xl text-xs border border-blue-800/40">
                  {testing ? "Testing..." : "Test Connection"}
                </button>
              </div>
            </div>

            <div className="mt-4 bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
              <h3 className="text-xs font-bold text-purple-300 mb-2">🔗 OAuth Redirect URIs</h3>
              <p className="text-[10px] text-purple-500 mb-3">Add these to your app settings on {selected.name}:</p>
              <div className="space-y-2">
                {[`https://octopus.ai/oauth/${selected.id}`, `https://octopus.ai/oauth/${selected.id}/callback`].map((url) => (
                  <div key={url} className="flex items-center gap-2 bg-[#0d0920] rounded-lg px-3 py-2 border border-purple-900/20">
                    <p className="text-[10px] font-mono text-purple-300 flex-1 truncate">{url}</p>
                    <button onClick={() => void navigator.clipboard.writeText(url)} className="text-[9px] text-purple-500 hover:text-white transition-all flex-shrink-0">Copy</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
