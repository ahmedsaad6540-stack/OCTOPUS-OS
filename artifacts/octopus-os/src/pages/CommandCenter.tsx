import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export function CommandCenter() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [time, setTime] = useState(new Date());
  const [autoMode, setAutoMode] = useState(false);
  const [revenue, setRevenue] = useState(12840.0);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!autoMode) return;
    const t = setInterval(() => setRevenue(r => r + parseFloat((Math.random() * 2.15).toFixed(2))), 4000);
    return () => clearInterval(t);
  }, [autoMode]);

  return (
    <div className="p-6 space-y-6 min-h-screen font-sans" style={{ background: "#06020f" }}>
      {/* Top Bar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2 font-heading">
            🐙 {t("homeWorkspace")}
          </h1>
          <p className="text-purple-400 font-semibold text-xs mt-1">
            {t("welcomeBack")}, <span className="text-purple-300">{user?.name || "Ahmed Saad"}</span> — <span className="uppercase text-[10px] bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/20">{t("admin")}</span>
          </p>
        </div>
        
        {/* Top Right Live Header */}
        <div className="flex items-center gap-4 select-none">
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-heading bg-emerald-950/20 px-3 py-1.5 rounded-xl border border-emerald-500/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981] inline-block" />
            {t("live")}
          </div>
          <button onClick={logout}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-purple-300 border border-purple-800/40 hover:border-purple-600 hover:text-white transition-all bg-[#0d0920]/45">
            {t("signOut")}
          </button>
        </div>
      </div>

      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Card 1: Revenue */}
        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">{t("totalRevenue")}</div>
          <div className="text-2xl font-black text-emerald-400 font-heading">
            ${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Card 2: ROI */}
        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">{t("roi")}</div>
          <div className="text-2xl font-black text-white font-heading">42.7%</div>
        </div>

        {/* Card 3: Active Campaigns */}
        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">{t("activeCampaigns")}</div>
          <div className="text-2xl font-black text-white font-heading">1/1</div>
        </div>

        {/* Card 4: Active Agents */}
        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-2 font-heading">{t("activeAgents")}</div>
          <div className="text-2xl font-black text-white font-heading">1</div>
        </div>
      </div>

      {/* 2 Large Cards Grid (System Status & Profit Snapshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Status Card */}
        <div className="glass-card p-5 rounded-xl relative flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest font-heading">{t("systemStatus")}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 pulse-dot">
              {t("healthy")}
            </span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-purple-950/30">
              <span className="text-purple-300">{t("api")}</span>
              <span className="text-emerald-400 font-bold">● {t("healthy")} - 1ms</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-purple-950/30">
              <span className="text-purple-300">{t("database")}</span>
              <span className="text-emerald-400 font-bold">● {t("healthy")} - 1ms</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-purple-300">{t("workers")}</span>
              <span className="text-emerald-400 font-bold">● {t("healthy")} - 2ms</span>
            </div>
          </div>
        </div>

        {/* Profit Snapshot Card */}
        <div className="glass-card p-5 rounded-xl">
          <div className="text-[10px] font-bold text-purple-400/60 uppercase tracking-widest mb-4 font-heading">{t("profitSnapshot")}</div>
          <div className="grid grid-cols-3 gap-4 text-center mt-2">
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-purple-400/50 uppercase tracking-widest font-heading">{t("roi")}</div>
              <div className="text-lg font-black text-white font-heading">42.7%</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-purple-400/50 uppercase tracking-widest font-heading">{t("epc")}</div>
              <div className="text-lg font-black text-white font-heading">$3.18</div>
            </div>
            <div className="space-y-1">
              <div className="text-[9px] font-bold text-purple-400/50 uppercase tracking-widest font-heading">{t("cvr")}</div>
              <div className="text-lg font-black text-white font-heading">8.40%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced AI control panel collapsible drawer */}
      <div className="pt-2">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full py-2.5 rounded-xl text-xs font-semibold text-purple-400 hover:text-purple-300 bg-purple-950/15 border border-purple-500/10 hover:border-purple-500/25 transition-all text-center">
          {showAdvanced ? t("hideAdvanced") : t("openAdvanced")}
        </button>

        {showAdvanced && (
          <div className="mt-6 space-y-6 animate-fadeIn">
            {/* AI Action Header */}
            <div className="glass-card p-4 rounded-xl flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-white font-heading">{t("advancedOperations")}</h3>
                <p className="text-[10px] text-purple-400/60 mt-0.5">Toggle live autonomous system pipelines.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAutoMode(!autoMode)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    autoMode ? "bg-emerald-600 text-white" : "gradient-purple text-white shadow-md glow-purple"
                  }`}>
                  {autoMode ? t("pauseAuto") : t("startAuto")}
                </button>
              </div>
            </div>

            {/* CEO Briefing Panel */}
            <div className="glass-card p-4 border-l-2 border-purple-500 rounded-r-xl">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center text-sm shrink-0">🤖</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-purple-400">{t("ceoBriefing")}</span>
                    <span className="text-[9px] text-emerald-400 font-mono">{t("live")}</span>
                  </div>
                  <p className="text-xs text-purple-200/90 leading-relaxed">
                    {t("ceoBriefingText")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
