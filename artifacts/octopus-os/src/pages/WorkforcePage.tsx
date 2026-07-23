import { useState, useEffect, useRef } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

interface Worker {
  id: string;
  name: string;
  role: string;
  icon: string;
  status: "active" | "disabled" | "paused";
  workload: string;
  instructions: string;
  performance: string;
}

const DEFAULT_AGENTS = [
  { name: "Brain Agent", role: "Central Intelligence", icon: "🧠", instructions: "Coordinate inputs from all sub-agents. Execute daily profit optimization calculations." },
  { name: "TrendHunter", role: "Niche Trend Scanner", icon: "📈", instructions: "Identify hashtags and product keywords with >75 viral score. Forward signals to Clickbank adapter." },
  { name: "Creator Agent", role: "Content & Script Writer", icon: "✍️", instructions: "Write high-converting, short-form scripts optimized for TikTok retention algorithms." },
  { name: "Publisher Agent", role: "Social Scheduler", icon: "📱", instructions: "Upload and schedule posts. Sync publish metadata across linked platforms." },
  { name: "Tracker Agent", role: "Pixel Analytics Monitor", icon: "📊", instructions: "Monitor conversion anomalies. Send notification if conversion rate drops by >15%." },
  { name: "Money Agent", role: "Earnings Ledger Sync", icon: "💰", instructions: "Fetch Clickbank earnings daily. Refresh ROI and EPC metric dashboards." },
];

function getIconForName(name: string): string {
  if (name.includes("Brain")) return "🧠";
  if (name.includes("Trend")) return "📈";
  if (name.includes("Creator")) return "✍️";
  if (name.includes("Publisher")) return "📱";
  if (name.includes("Tracker")) return "📊";
  if (name.includes("Money")) return "💰";
  return "🤖";
}

function mapAgent(w: any): Worker {
  return {
    id: w.id,
    name: w.name,
    role: w.description || "Virtual Agent",
    icon: getIconForName(w.name),
    status: w.status === "active" ? "active" : "disabled",
    // Use real lastTaskType if available; otherwise a static label (not Math.random)
    workload: w.status === "active"
      ? (w.lastTaskType ? `Last: ${w.lastTaskType}` : "Monitoring operations loop")
      : "Idle",
    instructions: w.instructions || "",
    performance: w.status === "active" ? "Active" : "Offline",
  };
}

export function WorkforcePage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempInstructions, setTempInstructions] = useState("");
  const [saving, setSaving] = useState(false);

  const isFirstLoad = useRef(true);

  const fetchWorkers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/agents`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch agents");
      const raw = await res.json();
      const data: any[] = Array.isArray(raw) ? raw : (raw.agents || raw.data || []);

      if (data.length > 0) {
        setWorkers(data.map(mapAgent));
      } else {
        // Fallback to default UI display if API returns 0 agents
        setWorkers(DEFAULT_AGENTS.map((a, i) => ({
          id: `local-${i}`,
          name: a.name,
          role: a.role,
          icon: a.icon,
          status: "active" as const,
          workload: "Monitoring operations loop",
          instructions: a.instructions,
          performance: "Active"
        })));
      }
    } catch (err) {
      console.error("WorkforcePage: error fetching agents:", err);
    } finally {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setLoading(false);
      }
    }
  };

  useEffect(() => { fetchWorkers(); }, [token]);

  const handleToggleStatus = async (worker: Worker) => {
    if (!token) return;
    const isActivating = worker.status !== "active";
    try {
      const res = await fetch(`${API_BASE}/agents/${worker.id}/${isActivating ? "enable" : "disable"}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setWorkers(prev => prev.map(w => w.id === worker.id
          ? { ...w, status: isActivating ? "active" : "disabled", workload: isActivating ? "Monitoring operations loop" : "Idle", performance: isActivating ? "Active" : "Offline" }
          : w
        ));
      }
    } catch (err) { console.error("toggleStatus error:", err); }
  };

  const handleEditInstructions = (w: Worker) => {
    setEditingId(w.id);
    setTempInstructions(w.instructions);
  };

  const handleSaveInstructions = async (workerId: string) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/agents/${workerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ instructions: tempInstructions }),
      });
      if (res.ok) {
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, instructions: tempInstructions } : w));
        setEditingId(null);
      }
    } catch (err) { console.error("saveInstructions error:", err); }
    finally { setSaving(false); }
  };

  const handleClone = async (worker: Worker) => {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/agents`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          name: `${worker.name} (Clone)`,
          instructions: worker.instructions,
          description: worker.role,
          status: "disabled",
        }),
      });
      fetchWorkers();
    } catch (err) { console.error("clone error:", err); }
  };

  const handleDelete = async (workerId: string) => {
    if (!token || !confirm("هل تريد حذف هذا الوكيل؟")) return;
    try {
      await fetch(`${API_BASE}/agents/${workerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
      setWorkers(prev => prev.filter(w => w.id !== workerId));
    } catch (err) { console.error("delete error:", err); }
  };

  const active = workers.filter(w => w.status === "active").length;
  const disabled = workers.filter(w => w.status !== "active").length;

  return (
    <div className="p-6 min-h-screen space-y-6" style={{ background: "#0a0614", color: "#e2d9f3" }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#c084fc" }}>
            🤖 AI Workforce
          </h1>
          <p className="text-sm" style={{ color: "#7c6f9a" }}>
            {loading ? "تحميل الوكلاء من قاعدة البيانات..." : `${active} نشط · ${disabled} موقوف — بيانات حقيقية من PostgreSQL`}
          </p>
        </div>
        <button onClick={fetchWorkers} className="px-4 py-2 rounded-lg text-xs" style={{ background: "#1a0d38", border: "1px solid #4c1d95", color: "#a78bfa" }}>
          🔄 تحديث
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "إجمالي الوكلاء", value: workers.length, color: "#a855f7" },
          { label: "نشط", value: active, color: "#10b981" },
          { label: "موقوف", value: disabled, color: "#6b7280" },
        ].map(item => (
          <div key={item.label} className="rounded-xl p-4 text-center border" style={{ background: "#120a24", borderColor: "#2d1b5e" }}>
            <div className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</div>
            <div className="text-xs mt-1" style={{ color: "#7c6f9a" }}>{item.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map(worker => (
            <div key={worker.id} className="rounded-xl p-4 border" style={{ background: "#120a24", borderColor: "#2d1b5e" }}>
              <div className="flex items-start gap-4">
                <span className="text-3xl">{worker.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: "#e2d9f3" }}>{worker.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{
                      background: worker.status === "active" ? "#052e16" : "#1c1917",
                      color: worker.status === "active" ? "#10b981" : "#6b7280",
                      border: `1px solid ${worker.status === "active" ? "#059669" : "#374151"}`,
                    }}>
                      {worker.status === "active" ? "● نشط" : "○ موقوف"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "#7c6f9a" }}>{worker.role}</p>
                  <p className="text-xs mt-1" style={{ color: "#6d5e82" }}>{worker.workload}</p>

                  {/* Instructions editor */}
                  {editingId === worker.id ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        value={tempInstructions}
                        onChange={e => setTempInstructions(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg p-2 text-xs resize-none"
                        style={{ background: "#1a0d38", border: "1px solid #4c1d95", color: "#e2d9f3" }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveInstructions(worker.id)}
                          disabled={saving}
                          className="px-3 py-1 rounded text-xs"
                          style={{ background: "#4c1d95", color: "#e2d9f3" }}
                        >
                          {saving ? "جاري الحفظ..." : "💾 حفظ"}
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded text-xs" style={{ background: "#1c1917", color: "#9ca3af" }}>
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs mt-2 line-clamp-2" style={{ color: "#5b4c72" }}>{worker.instructions}</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleStatus(worker)}
                    className="px-3 py-1 rounded text-xs font-medium"
                    style={{ background: worker.status === "active" ? "#7f1d1d" : "#052e16", color: worker.status === "active" ? "#fca5a5" : "#6ee7b7", border: `1px solid ${worker.status === "active" ? "#ef4444" : "#059669"}` }}
                  >
                    {worker.status === "active" ? "⏸ إيقاف" : "▶ تشغيل"}
                  </button>
                  <button
                    onClick={() => handleEditInstructions(worker)}
                    className="px-3 py-1 rounded text-xs"
                    style={{ background: "#1a0d38", border: "1px solid #4c1d95", color: "#a78bfa" }}
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={() => handleClone(worker)}
                    className="px-3 py-1 rounded text-xs"
                    style={{ background: "#1a0d38", border: "1px solid #2d1b5e", color: "#7c6f9a" }}
                  >
                    📋 نسخ
                  </button>
                  <button
                    onClick={() => handleDelete(worker.id)}
                    className="px-3 py-1 rounded text-xs"
                    style={{ background: "#1c1917", border: "1px solid #374151", color: "#9ca3af" }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            </div>
          ))}

          {workers.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: "#7c6f9a" }}>لا يوجد وكلاء — سيتم إنشاؤهم تلقائياً</p>
          )}
        </div>
      )}
    </div>
  );
}
