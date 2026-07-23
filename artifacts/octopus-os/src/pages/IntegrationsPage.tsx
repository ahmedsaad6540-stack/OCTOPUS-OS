import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Integration {
  id: string;
  icon: string;
  name: string;
  cat: "Storage" | "Workspace" | "Automation" | "Dev" | "Database" | "Cloud";
  status: "connected" | "disconnected";
  dbRowId?: string;
}

const INITIAL_INTEGRATIONS: Integration[] = [
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
  const { token } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>(INITIAL_INTEGRATIONS);
  const [cat, setCat] = useState("All");
  const [loading, setLoading] = useState(true);

  const fetchIntegrations = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/providers`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const rows = data.providers || [];

      // Map DB rows to our local integrations state
      setIntegrations(prev => prev.map(item => {
        const dbRow = rows.find((r: any) => r.providerName === item.id);
        if (dbRow && dbRow.enabled) {
          return { ...item, status: "connected", dbRowId: dbRow.id };
        }
        return { ...item, status: "disconnected", dbRowId: dbRow?.id };
      }));
    } catch (err) {
      console.error("Error loading integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, [token]);

  const toggleConnection = async (item: Integration) => {
    if (!token) return;
    const isConnecting = item.status !== "connected";

    try {
      if (isConnecting) {
        // Connect: Send POST request to create provider configuration
        const res = await fetch(`${API_BASE}/providers`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            providerName: item.id,
            displayName: item.name,
            enabled: true,
            status: "online",
            priority: 1
          })
        });
        if (res.ok) {
          fetchIntegrations();
        }
      } else {
        // Disconnect: Send DELETE request to remove provider configuration
        if (item.dbRowId) {
          const res = await fetch(`${API_BASE}/providers/${item.dbRowId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
            fetchIntegrations();
          }
        } else {
          // Fallback toggle if no dbRowId cached
          setIntegrations(is => is.map(i => i.id === item.id ? { ...i, status: "disconnected" } : i));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = integrations.filter(i => cat === "All" || i.cat === cat);

  return (
    <div className="p-6 min-h-screen" style={{ background: "#06020f" }}>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            🔗 Integrations Hub
          </h1>
          <p className="text-purple-400/60 text-xs mt-1">
            {integrations.filter(i => i.status === "connected").length} connected · {integrations.length} available
          </p>
        </div>
        <button onClick={fetchIntegrations}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-950 hover:bg-purple-900 border border-purple-500/30 text-purple-300 transition-all font-sans">
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              cat === c ? "gradient-purple text-white shadow-md glow-purple" : "text-purple-400 hover:bg-purple-950/40"
            }`}
            style={cat !== c ? { background: "#0d0920", border: "1px solid rgba(139,92,246,0.15)" } : {}}>
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-purple-400/40 text-xs font-mono">
          Syncing connections ledger...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(i => (
            <div key={i.id} className="glass-card p-4 rounded-xl flex items-center justify-between hover:border-purple-500/25 transition-all">
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0">{i.icon}</span>
                <div>
                  <div className="text-xs font-bold text-white font-heading">{i.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5 font-mono">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-400 border border-purple-500/10">{i.cat}</span>
                    <span className={`text-[9px] uppercase font-bold ${i.status === "connected" ? "text-emerald-400" : "text-gray-500"}`}>
                      {i.status === "connected" ? "● Connected" : "○ Disconnected"}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => toggleConnection(i)}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase shrink-0 transition-all ${
                  i.status === "connected" ? "bg-red-950/40 hover:bg-red-950/60 text-red-400 border border-red-500/20" : "gradient-purple text-white glow-purple-sm"
                }`}>
                {i.status === "connected" ? "Disconnect" : "Connect"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
