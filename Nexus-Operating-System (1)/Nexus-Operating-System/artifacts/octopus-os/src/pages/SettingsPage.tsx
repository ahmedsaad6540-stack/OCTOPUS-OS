import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function SettingsPage() {
  const { user } = useAuth();
  const [section, setSection] = useState("profile");

  const SECTIONS = [
    { id: "profile", icon: "👤", label: "Profile" },
    { id: "security", icon: "🔐", label: "Security" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "appearance", icon: "🎨", label: "Appearance" },
    { id: "language", icon: "🌐", label: "Language & Region" },
    { id: "data", icon: "💾", label: "Data & Privacy" },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "#0a0614" }}>
      <div className="w-48 shrink-0 py-6 px-2" style={{ background: "#0d0920", borderRight: "1px solid rgba(139,92,246,0.15)" }}>
        <div className="text-[9px] font-bold uppercase tracking-widest text-purple-500/50 px-2 mb-2">Settings</div>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium mb-0.5 transition-all ${section === s.id ? "gradient-purple text-white" : "text-purple-300/70 hover:bg-purple-900/30"}`}>
            <span>{s.icon}</span> {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-8">
        {section === "profile" && (
          <div className="max-w-md">
            <h2 className="text-lg font-bold text-white mb-6">👤 Profile Settings</h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl gradient-purple flex items-center justify-center text-2xl font-bold text-white">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <button className="px-4 py-2 rounded-lg text-xs text-purple-300 border border-purple-500/30">Change Avatar</button>
            </div>
            {[["Full Name", user?.name || ""], ["Email", user?.email || ""], ["Role", user?.role || "owner"], ["Company", "My Company"]].map(([label, val]) => (
              <div key={label} className="mb-4">
                <label className="text-xs text-purple-400 mb-1 block">{label}</label>
                <input defaultValue={val} className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
                  style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }} />
              </div>
            ))}
            <button className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">
              💾 Save Profile
            </button>
          </div>
        )}

        {section === "notifications" && (
          <div className="max-w-md">
            <h2 className="text-lg font-bold text-white mb-6">🔔 Notification Settings</h2>
            {[
              ["Revenue alerts", "Notify when revenue exceeds threshold", true],
              ["Agent failures", "Alert when any agent fails", true],
              ["Campaign milestones", "Notify on campaign goals", true],
              ["Daily CEO briefing", "Morning AI briefing email", true],
              ["Weekly report", "Weekly performance summary", false],
              ["New marketplace agents", "Notify on new agents", false],
            ].map(([label, desc, def]: any) => (
              <label key={label} className="flex items-center justify-between py-3 cursor-pointer" style={{ borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
                <div>
                  <div className="text-sm text-white">{label}</div>
                  <div className="text-xs text-purple-400/60">{desc}</div>
                </div>
                <input type="checkbox" defaultChecked={def} className="accent-purple-600 w-4 h-4" />
              </label>
            ))}
          </div>
        )}

        {(section === "security" || section === "appearance" || section === "language" || section === "data") && (
          <div className="max-w-md flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-3">⚙️</div>
            <h3 className="text-lg font-bold text-white mb-2">{SECTIONS.find(s => s.id === section)?.label}</h3>
            <p className="text-sm text-purple-400/60">Settings will be available in the next update.</p>
          </div>
        )}
      </div>
    </div>
  );
}
