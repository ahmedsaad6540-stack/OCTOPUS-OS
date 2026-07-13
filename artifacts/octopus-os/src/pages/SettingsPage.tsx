import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function SettingsPage() {
  const { user } = useAuth();
  const [section, setSection] = useState("profile");
  const [appTheme, setAppTheme] = useState("Dark Violet");
  const [appLanguage, setAppLanguage] = useState("English (US)");

  const SECTIONS = [
    { id: "profile", icon: "👤", label: "Profile Settings" },
    { id: "appearance", icon: "🎨", label: "Appearance" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "workspace", icon: "🏢", label: "Workspace" },
    { id: "security", icon: "🔐", label: "Security & Keys" },
  ];

  return (
    <div className="flex min-h-screen select-none font-sans" style={{ background: "#06020f" }}>
      {/* Left side settings pane */}
      <div className="w-56 shrink-0 py-4 px-3 flex flex-col bg-black/20 border-r border-purple-950/60">
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400/40 px-3 py-2 font-heading">Settings Panel</div>
        <div className="space-y-1 overflow-y-auto mt-2">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                section === s.id ? "bg-purple-950/30 border border-purple-500/30 text-white font-bold" : "text-purple-300/70 hover:bg-purple-950/15"
              }`}>
              <span className="text-base">{s.icon}</span> {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main settings content pane */}
      <div className="flex-1 p-6 overflow-y-auto max-w-2xl">
        {section === "profile" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">👤 Profile Settings</h2>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-950/10 border border-purple-500/5">
              <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md">
                {user?.name?.[0]?.toUpperCase() || "A"}
              </div>
              <div>
                <div className="text-xs font-bold text-white font-heading">{user?.name || "Ahmed Saad"}</div>
                <div className="text-[10px] text-purple-400/60 mt-0.5 uppercase tracking-wide font-mono">{user?.role || "admin"}</div>
              </div>
              <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-purple-300 border border-purple-500/25 ml-auto hover:border-purple-400 hover:text-white transition-all">Change Avatar</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[["Full Name", user?.name || "Ahmed Saad"], ["Email Address", user?.email || "admin@octopus.ai"], ["Role Title", user?.role || "admin"], ["Organization", "Nexus OS Ventures"]].map(([label, val]) => (
                <div key={label} className="space-y-1">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">{label}</label>
                  <input defaultValue={val} className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 transition-all font-mono" />
                </div>
              ))}
            </div>

            <button className="px-6 py-2 rounded-xl text-xs font-bold text-white gradient-purple glow-purple">
              Save Changes
            </button>
          </div>
        )}

        {section === "appearance" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🎨 Appearance Configurations</h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Color Theme Palette</label>
                <div className="flex gap-2">
                  {["Dark Violet", "Neon Obsidian", "Emerald Terminal"].map(t => (
                    <button key={t} onClick={() => setAppTheme(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                        appTheme === t ? "gradient-purple border-transparent text-white shadow-md glow-purple" : "bg-[#0d0920] border-purple-500/10 text-purple-300 hover:border-purple-500/20"
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Interface Font Face</label>
                <select className="bg-[#0d0920] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option>Inter (Sora headings)</option>
                  <option>Outfit (Sora headings)</option>
                  <option>JetBrains Mono (System Code)</option>
                </select>
              </div>

              <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-500/5 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-white">Animations & Micro-interactions</div>
                  <p className="text-[10px] text-purple-400/60 mt-0.5">Toggle transitions, progress flows, and live log updates.</p>
                </div>
                <input type="checkbox" defaultChecked className="accent-purple-600 w-4 h-4 rounded cursor-pointer" />
              </div>
            </div>
          </div>
        )}

        {section === "notifications" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🔔 Notification Channels</h2>
            <div className="space-y-1.5 bg-black/10 rounded-xl border border-purple-950 overflow-hidden divide-y divide-purple-950/50">
              {[
                { title: "Revenue milestone alerts", desc: "Notify when conversion gains exceed daily budget quota limit." },
                { title: "Agent failure diagnostics", desc: "Alert when worker thread encounters rate limit loop or timeout." },
                { title: "AI Daily Strategy briefings", desc: "Compile recommendations into a morning executive summary." },
                { title: "System health heartbeats", desc: "Monitor ping and database sync latency averages." }
              ].map((item, idx) => (
                <div key={idx} className="p-4 flex justify-between items-start">
                  <div>
                    <div className="text-xs font-bold text-white">{item.title}</div>
                    <p className="text-[10px] text-purple-400/60 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked={idx < 3} className="accent-purple-600 w-4 h-4 cursor-pointer mt-0.5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {section === "workspace" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🏢 Workspace Preferences</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Workspace Namespace</label>
                <input defaultValue="Nexus OS Ventures" className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 font-mono" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Language & Region</label>
                <select value={appLanguage} onChange={e => setAppLanguage(e.target.value)}
                  className="bg-[#0d0920] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-white outline-none">
                  <option>English (US)</option>
                  <option>Arabic (العربية)</option>
                  <option>Spanish (Español)</option>
                </select>
              </div>
            </div>

            {/* High risk danger zone card */}
            <div className="p-5 rounded-2xl bg-red-950/15 border border-red-500/20 mt-8 space-y-4">
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider font-heading">⚠️ High-Risk Action Zone</h3>
              <p className="text-[10px] text-red-300/70 leading-relaxed">
                Resetting data clears cached telemetry settings, connection tokens, and memory search histories. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl text-xs font-bold bg-red-950/60 hover:bg-red-900/40 text-red-400 border border-red-500/20">
                  Delete Workspace Logs
                </button>
                <button className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md">
                  Reset System Config
                </button>
              </div>
            </div>
          </div>
        )}

        {section === "security" && (
          <div className="space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🔐 Encryption & Keys</h2>
            <p className="text-xs text-purple-400/60">Configure primary keys for vector stores and external webhook signatures.</p>
            
            <div className="space-y-4">
              {[
                { name: "Encryption Salt Key", ph: "Enter workspace salt key", type: "password" },
                { name: "Webhook Verification Secret", ph: "whsec_...", type: "text" }
              ].map(k => (
                <div key={k.name} className="space-y-1">
                  <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">{k.name}</label>
                  <input type={k.type} placeholder={k.ph} className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 font-mono" />
                </div>
              ))}
            </div>
            
            <button className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-purple glow-purple">
              Save Keys
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
