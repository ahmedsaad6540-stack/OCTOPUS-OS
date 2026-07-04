import { useState } from "react";

interface Integration {
  id: string;
  name: string;
  icon: string;
  category: string;
  desc: string;
  status: "connected" | "disconnected" | "coming_soon";
  configFields: Array<{ key: string; label: string; type: string; placeholder: string }>;
}

const INTEGRATIONS: Integration[] = [
  { id: "google-drive", name: "Google Drive", icon: "🟢", category: "Storage", desc: "Save generated content, videos, and reports to Google Drive.", status: "disconnected", configFields: [{ key: "client_id", label: "Client ID", type: "text", placeholder: "Google OAuth Client ID" }] },
  { id: "dropbox", name: "Dropbox", icon: "📦", category: "Storage", desc: "Sync affiliate assets and videos to Dropbox automatically.", status: "disconnected", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "Dropbox API Key" }] },
  { id: "notion", name: "Notion", icon: "📝", category: "Productivity", desc: "Sync campaign notes, reports, and insights to Notion.", status: "disconnected", configFields: [{ key: "api_key", label: "Integration Token", type: "password", placeholder: "secret_..." }] },
  { id: "slack", name: "Slack", icon: "💬", category: "Messaging", desc: "Get CEO briefings and alerts sent to your Slack workspace.", status: "disconnected", configFields: [{ key: "webhook", label: "Webhook URL", type: "text", placeholder: "https://hooks.slack.com/..." }] },
  { id: "discord", name: "Discord", icon: "🎮", category: "Messaging", desc: "Post performance reports and alerts to Discord channels.", status: "disconnected", configFields: [{ key: "webhook", label: "Webhook URL", type: "text", placeholder: "https://discord.com/api/webhooks/..." }] },
  { id: "zapier", name: "Zapier", icon: "⚡", category: "Automation", desc: "Connect OCTOPUS to 5000+ apps via Zapier triggers and actions.", status: "disconnected", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "Zapier API Key" }] },
  { id: "n8n", name: "n8n", icon: "🔗", category: "Automation", desc: "Advanced automation with n8n self-hosted or cloud workflows.", status: "disconnected", configFields: [{ key: "webhook_url", label: "n8n Webhook", type: "text", placeholder: "https://your-n8n.com/webhook/..." }] },
  { id: "make", name: "Make (Integromat)", icon: "🔧", category: "Automation", desc: "Build complex automation scenarios with Make.", status: "disconnected", configFields: [{ key: "webhook", label: "Webhook URL", type: "text", placeholder: "https://hook.make.com/..." }] },
  { id: "github", name: "GitHub", icon: "🐙", category: "Dev", desc: "Auto-commit generated code, configs, and tracking scripts.", status: "disconnected", configFields: [{ key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }] },
  { id: "cloudflare", name: "Cloudflare", icon: "☁️", category: "Dev", desc: "Manage DNS, deploy tracking pixels, and protect domains.", status: "disconnected", configFields: [{ key: "api_key", label: "API Token", type: "password", placeholder: "Cloudflare API Token" }] },
  { id: "firebase", name: "Firebase", icon: "🔥", category: "Database", desc: "Real-time database for live tracking and instant analytics.", status: "connected", configFields: [{ key: "config", label: "Config JSON", type: "text", placeholder: '{"apiKey":"..."}' }] },
  { id: "supabase", name: "Supabase", icon: "💚", category: "Database", desc: "PostgreSQL database with real-time subscriptions.", status: "connected", configFields: [{ key: "url", label: "Project URL", type: "text", placeholder: "https://xxx.supabase.co" }, { key: "key", label: "Anon Key", type: "password", placeholder: "eyJ..." }] },
  { id: "redis", name: "Redis", icon: "🔴", category: "Database", desc: "High-speed caching for agent results and session data.", status: "disconnected", configFields: [{ key: "url", label: "Redis URL", type: "text", placeholder: "redis://..." }] },
  { id: "s3", name: "AWS S3", icon: "☁️", category: "Storage", desc: "Store generated videos, images, and large files at scale.", status: "disconnected", configFields: [{ key: "access_key", label: "Access Key ID", type: "text", placeholder: "AKIA..." }, { key: "secret_key", label: "Secret Key", type: "password", placeholder: "Secret..." }, { key: "bucket", label: "Bucket Name", type: "text", placeholder: "my-bucket" }] },
  { id: "opensearch", name: "OpenSearch", icon: "🔍", category: "Database", desc: "Full-text search for campaigns, products, and analytics.", status: "coming_soon", configFields: [] },
  { id: "sendgrid", name: "SendGrid", icon: "📧", category: "Messaging", desc: "Send transactional emails and campaign reports.", status: "disconnected", configFields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "SG...." }] },
];

const CATEGORIES = ["All", "Storage", "Automation", "Messaging", "Database", "Productivity", "Dev"];

export function IntegrationsPage() {
  const [category, setCategory] = useState("All");
  const [configuring, setConfiguring] = useState<Integration | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [integrations, setIntegrations] = useState(INTEGRATIONS);

  const filtered = integrations.filter((i) => category === "All" || i.category === category);
  const connected = integrations.filter((i) => i.status === "connected").length;

  const startConfig = (integration: Integration) => {
    setConfiguring(integration);
    setFormData({});
  };

  const connect = async () => {
    if (!configuring) return;
    setConnecting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIntegrations((prev) => prev.map((i) => i.id === configuring.id ? { ...i, status: "connected" } : i));
    setConnecting(false);
    setConfiguring(null);
  };

  const disconnect = (id: string) => {
    setIntegrations((prev) => prev.map((i) => i.id === id ? { ...i, status: "disconnected" } : i));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">🔗 Integrations Hub</h1>
            <p className="text-purple-400 text-sm mt-1">
              {connected} connected · {integrations.length} available
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${category === cat ? "bg-purple-700 text-white border-purple-600" : "bg-[#130d2a] text-purple-400 border-purple-800/30 hover:border-purple-600 hover:text-white"}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((integration) => (
            <div key={integration.id} className={`bg-[#130d2a] border rounded-xl p-4 transition-colors ${integration.status === "connected" ? "border-emerald-800/40" : integration.status === "coming_soon" ? "border-purple-900/20 opacity-60" : "border-purple-900/40 hover:border-purple-700/60"}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0d0920] border border-purple-900/30 flex items-center justify-center text-xl">
                    {integration.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{integration.name}</p>
                    <p className="text-[10px] text-purple-600">{integration.category}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border flex-shrink-0 ${
                  integration.status === "connected"
                    ? "text-emerald-400 border-emerald-800/40 bg-emerald-900/20"
                    : integration.status === "coming_soon"
                    ? "text-gray-500 border-gray-800/30 bg-gray-900/20"
                    : "text-gray-500 border-gray-800/30 bg-gray-900/20"
                }`}>
                  {integration.status === "coming_soon" ? "Soon" : integration.status}
                </span>
              </div>
              <p className="text-xs text-purple-300 mb-3 leading-relaxed">{integration.desc}</p>
              <div className="flex gap-2">
                {integration.status === "coming_soon" ? (
                  <button disabled className="flex-1 text-[10px] text-gray-500 bg-gray-900/20 py-2 rounded-lg border border-gray-800/30 font-bold">
                    Coming Soon
                  </button>
                ) : integration.status === "connected" ? (
                  <>
                    <button className="flex-1 text-[10px] text-emerald-400 bg-emerald-900/10 py-2 rounded-lg border border-emerald-800/30 font-bold">
                      ✓ Connected
                    </button>
                    <button onClick={() => disconnect(integration.id)} className="text-[10px] text-red-400 bg-red-900/10 py-2 px-3 rounded-lg border border-red-900/30 hover:border-red-700 font-bold transition-all">
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => startConfig(integration)}
                    className="flex-1 text-[10px] bg-gradient-to-r from-purple-700 to-indigo-700 text-white py-2 rounded-lg font-bold hover:from-purple-600 hover:to-indigo-600 transition-all"
                  >
                    Connect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {configuring && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#130d2a] border border-purple-800/60 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <span>{configuring.icon}</span> Connect {configuring.name}
              </h2>
              <p className="text-xs text-purple-400 mb-5">{configuring.desc}</p>
              <div className="space-y-3">
                {configuring.configFields.map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">{label}</label>
                    <input
                      type={type}
                      value={formData[key] ?? ""}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => void connect()} disabled={connecting} className="flex-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm">
                  {connecting ? "Connecting..." : "Connect"}
                </button>
                <button onClick={() => setConfiguring(null)} className="flex-1 bg-[#0d0920] text-purple-300 font-bold py-2.5 rounded-xl text-sm border border-purple-800/40">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
