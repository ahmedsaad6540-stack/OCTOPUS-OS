import { Campaign } from "@/domain/models/campaign";
import { useCampaignStats, useCampaignMutations } from "@/hooks/useCampaigns";
import { useState } from "react";

const SOCIAL_ICONS: Record<string, string> = { TikTok: "🎵", Instagram: "📸", YouTube: "▶️", Pinterest: "📌", Amazon: "🛒", ClickBank: "💳", Other: "🌐" };

export function CampaignCard({ campaign: c }: { campaign: Campaign }) {
  const [expanded, setExpanded] = useState(false);
  const { data: stats, isLoading } = useCampaignStats(c.id);
  const { toggleCampaignStatus, deleteCampaign } = useCampaignMutations();
  
  const isToggling = toggleCampaignStatus.isPending && toggleCampaignStatus.variables?.id === c.id;
  const isDeleting = deleteCampaign.isPending && deleteCampaign.variables === c.id;

  return (
    <div className="group relative glass-card rounded-2xl border border-purple-500/10 hover:border-purple-500/40 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative z-10 p-6">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h3 className="text-base font-bold text-white truncate group-hover:text-purple-300 transition-colors">{c.name}</h3>
            <p className="text-xs text-purple-400/60 mt-0.5 uppercase tracking-wider font-semibold flex items-center gap-1">
              <span>{SOCIAL_ICONS[c.platform] || "🌐"}</span> {c.platform} · {c.affiliateNetwork}
            </p>
          </div>
          <span className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-wide ${c.status === "active" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30" : "bg-yellow-950/60 text-yellow-400 border border-yellow-500/30"}`}>
            {c.status.toUpperCase()}
          </span>
        </div>

        {isLoading || !stats ? (
          <div className="py-8 text-center text-xs text-purple-400/40">Loading metrics...</div>
        ) : (
          <>
            <div className="mb-3">
              <div className="flex justify-between text-[9px] text-purple-400/50 mb-1">
                <span>Progress</span>
                <span className="text-purple-300 font-bold">{stats.progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-purple-950/40 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${stats.progress}%`, background: "linear-gradient(90deg, #7c3aed, #10b981)" }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3 p-3 rounded-xl bg-black/20 border border-purple-500/5">
              {[
                { label: "Revenue", value: `$${stats.revenue.toFixed(0)}`, color: "text-emerald-400" },
                { label: "Profit", value: `$${stats.profit.toFixed(0)}`, color: "text-emerald-300" },
                { label: "ROI", value: `${stats.roi}%`, color: "text-cyan-400" },
                { label: "Sales", value: stats.sales, color: "text-white" },
                { label: "Clicks", value: stats.clicks, color: "text-white" },
                { label: "Conv. Rate", value: `${stats.cr}%`, color: "text-yellow-400" },
              ].map((kpi, idx) => (
                <div key={idx} className="text-center">
                  <div className="text-[9px] text-purple-400/40 uppercase font-bold">{kpi.label}</div>
                  <div className={`text-sm font-black font-mono ${kpi.color}`}>{kpi.value}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {[
                { label: "Videos", value: stats.videos, icon: "🎬" },
                { label: "Posts", value: stats.posts, icon: "📤" },
                { label: "Views", value: stats.views >= 1000 ? `${(stats.views / 1000).toFixed(1)}K` : stats.views, icon: "👁️" },
                { label: "EPC", value: `$${stats.epc}`, icon: "⚡" },
              ].map((s, idx) => (
                <div key={idx} className="p-2 rounded-lg bg-purple-950/10 border border-purple-500/5 text-center">
                  <div className="text-base">{s.icon}</div>
                  <div className="text-xs font-black text-white font-mono">{s.value}</div>
                  <div className="text-[9px] text-purple-400/40">{s.label}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setExpanded(!expanded)} className="w-full text-[10px] text-purple-400/50 hover:text-purple-300 py-1 flex items-center justify-center gap-1 mb-2">
              {expanded ? "▲ Hide Details" : "▼ Show Timeline & Agent Activity"}
            </button>

            {expanded && (
              <div className="space-y-3 mb-3">
                <div className="p-3 rounded-lg bg-purple-950/10 border border-purple-500/10">
                  <div className="text-[9px] text-purple-400/50 uppercase font-bold mb-2">Timeline</div>
                  <div className="space-y-1">
                    {stats.timeline.map((ev, i) => (
                      <div key={i} className={`flex items-start gap-2 text-[9px] font-mono ${ev.done ? "text-emerald-400" : "text-purple-400/30"}`}>
                        <span className="shrink-0 w-10">{ev.time}</span>
                        <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-0.5 ${ev.done ? "bg-emerald-400" : "bg-purple-500/20"}`} />
                        <span>{ev.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-purple-500/10">
          <button onClick={() => toggleCampaignStatus.mutate({ id: c.id, currentStatus: c.status })} disabled={isToggling}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              c.status === "active" ? "bg-yellow-950/30 text-yellow-400 border border-yellow-500/20" : "bg-emerald-950/30 text-emerald-400 border border-emerald-500/20"
            }`}>
            {isToggling ? "⏳..." : c.status === "active" ? "⏸ Pause" : "▶ Activate"}
          </button>
          <a href={c.productUrl || "#"} target="_blank" rel="noopener noreferrer" className="flex-1 px-3 py-2 rounded-lg text-xs font-bold text-white bg-purple-900/30 border border-purple-500/20 text-center">
            🔗 Affiliate
          </a>
          <button onClick={() => deleteCampaign.mutate(c.id)} disabled={isDeleting} className="p-2 rounded-lg text-red-400/60 bg-red-950/20 hover:text-red-300">
            {isDeleting ? "⏳" : "🗑"}
          </button>
        </div>
      </div>
    </div>
  );
}
