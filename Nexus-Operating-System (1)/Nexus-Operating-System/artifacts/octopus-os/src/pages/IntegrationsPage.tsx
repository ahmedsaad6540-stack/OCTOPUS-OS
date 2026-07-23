import { useState } from "react";

const INTEGRATIONS = [
  { id: "gdrive",    icon: "📁", name: "Google Drive",   cat: "Storage",   status: "disconnected" },
  { id: "dropbox",   icon: "📦", name: "Dropbox",        cat: "Storage",   status: "disconnected" },
  { id: "onedrive",  icon: "☁️", name: "OneDrive",       cat: "Storage",   status: "disconnected" },
  { id: "notion",    icon: "📓", name: "Notion",         cat: "Workspace", status: "disconnected" },
  { id: "slack",     icon: "💬", name: "Slack",          cat: "Workspace", status: "disconnected" },
  { id: "zapier",    icon: "⚡", name: "Zapier",         cat: "Automation",status: "disconnected" },
  { id: "n8n",       icon: "🔄", name: "n8n",            cat: "Automation",status: "disconnected" },
  { id: "make",      icon: "🔀", name: "Make (Integromat)", cat: "Automation", status: "disconnected" },
  { id: "github",    icon: "🐙", name: "GitHub",         cat: "Dev",       status: "disconnected" },
  { id: "gitlab",    icon: "🦊", name: "GitLab",         cat: "Dev",       status: "disconnected" },
  { id: "firebase",  icon: "🔥", name: "Firebase",       cat: "Dev",       status: "disconnected" },
  { id: "supabase",  icon: "💚", name: "Supabase",       cat: "Dev",       status: "disconnected" },
  { id: "redis",     icon: "🔴", name: "Redis",          cat: "Database",  status: "disconnected" },
  { id: "postgres",  icon: "🐘", name: "PostgreSQL",     cat: "Database",  status: "disconnected" },
  { id: "cloudflare",icon: "🌐", name: "Cloudflare",     cat: "Cloud",     status: "disconnected" },
  { id: "aws",       icon: "🟠", name: "AWS",            cat: "Cloud",     status: "disconnected" },
  { id: "s3",        icon: "🪣", name: "AWS S3",         cat: "Cloud",     status: "disconnected" },
];

const CATS = ["All", "Storage", "Workspace", "Automation", "Dev", "Database", "Cloud"];

export function IntegrationsPage() {
  const [integrations, setIntegrations] = useState(INTEGRATIONS);
  const [cat, setCat] = useState("All");

  const filtered = integrations.filter(i => cat === "All" || i.cat === cat);
  const toggle = (id: string) => {
    setIntegrations(is => is.map(i => i.id === id ? { ...i, status: i.status === "connected" ? "disconnected" : "connected" } : i));
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🔗 Integrations Hub</h1>
        <p className="text-purple-400/60 text-xs mt-1">
          {integrations.filter(i => i.status === "connected").length} connected · {integrations.length} available
        </p>
      </div>

      <div className="flex gap-1 mb-5 flex-wrap">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${cat === c ? "gradient-purple text-white" : "text-purple-400 hover:bg-purple-900/30"}`}
            style={cat !== c ? { background: "#0d0920", border: "1px solid rgba(139,92,246,0.15)" } : {}}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.map(i => (
          <div key={i.id} className="card-os p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{i.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white">{i.name}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa" }}>{i.cat}</span>
                  <span className={`text-[10px] ${i.status === "connected" ? "text-emerald-400" : "text-gray-600"}`}>
                    {i.status === "connected" ? "● Connected" : "○ Disconnected"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => toggle(i.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${i.status === "connected" ? "bg-red-900/40 text-red-400" : "gradient-purple text-white"}`}>
              {i.status === "connected" ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
