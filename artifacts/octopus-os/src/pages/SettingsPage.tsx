import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

// ── Toast helper ─────────────────────────────────────────────────────────────
type ToastType = "success" | "error";
interface ToastMsg { id: number; type: ToastType; text: string; }

function Toast({ toasts }: { toasts: ToastMsg[] }) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id}
          className={`px-4 py-3 rounded-xl text-xs font-bold shadow-lg border backdrop-blur-md animate-fadeIn pointer-events-auto transition-all ${
            t.type === "success"
              ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/80 border-red-500/30 text-red-300"
          }`}>
          {t.type === "success" ? "✅" : "❌"} {t.text}
        </div>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function SettingsPage() {
  const { user, token } = useAuth();
  const [section, setSection] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const toastId = useRef(0);

  // ── Form state (controlled) ────────────────────────────────────────────────
  const [fullName, setFullName]         = useState("");
  const [email, setEmail]               = useState("");
  const [roleTitle, setRoleTitle]       = useState("");
  const [organization, setOrganization] = useState("");

  const [appTheme, setAppTheme]       = useState("Dark Violet");
  const [fontFace, setFontFace]       = useState("Inter (Sora headings)");
  const [animations, setAnimations]   = useState(true);

  const [notifRevenue, setNotifRevenue]       = useState(true);
  const [notifAgentFail, setNotifAgentFail]   = useState(true);
  const [notifBriefings, setNotifBriefings]   = useState(true);
  const [notifHeartbeat, setNotifHeartbeat]   = useState(false);

  const [workspace, setWorkspace]   = useState("");
  const [language, setLanguage]     = useState("English (US)");

  const [saltKey, setSaltKey]           = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  // ── Toast helper ──────────────────────────────────────────────────────────
  const addToast = (type: ToastType, text: string) => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // ── Fetch settings on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/settings", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data: any) => {
        // Profile
        setFullName(data.fullName ?? user?.name ?? "");
        setEmail(data.email ?? user?.email ?? "");
        setRoleTitle(data.roleTitle ?? user?.role ?? "");
        setOrganization(data.organization ?? "");
        // Appearance
        setAppTheme(data.appTheme ?? "Dark Violet");
        setFontFace(data.fontFace ?? "Inter (Sora headings)");
        setAnimations(data.animations ?? true);
        // Notifications
        setNotifRevenue(data.notifRevenue ?? true);
        setNotifAgentFail(data.notifAgentFail ?? true);
        setNotifBriefings(data.notifBriefings ?? true);
        setNotifHeartbeat(data.notifHeartbeat ?? false);
        // Workspace
        setWorkspace(data.workspace ?? "");
        setLanguage(data.language ?? "English (US)");
        // Security — never pre-fill secrets
        setSaltKey("");
        setWebhookSecret("");
      })
      .catch(() => addToast("error", "Failed to load settings."))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Generic save ─────────────────────────────────────────────────────────
  const saveSettings = async (payload: Record<string, unknown>) => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(await res.text());
      addToast("success", "Settings saved successfully.");
    } catch (err: any) {
      addToast("error", err?.message ?? "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = () =>
    saveSettings({ fullName, email, roleTitle, organization });

  const handleSaveAppearance = () =>
    saveSettings({ appTheme, fontFace, animations });

  const handleSaveNotifications = () =>
    saveSettings({ notifRevenue, notifAgentFail, notifBriefings, notifHeartbeat });

  const handleSaveWorkspace = () =>
    saveSettings({ workspace, language });

  const handleSaveKeys = () => {
    const payload: Record<string, unknown> = {};
    if (saltKey) payload.saltKey = saltKey;
    if (webhookSecret) payload.webhookSecret = webhookSecret;
    if (Object.keys(payload).length === 0) {
      addToast("error", "Enter at least one key to save.");
      return;
    }
    saveSettings(payload);
  };

  // ── Sidebar sections ──────────────────────────────────────────────────────
  const SECTIONS = [
    { id: "profile",       icon: "👤", label: "Profile Settings" },
    { id: "appearance",    icon: "🎨", label: "Appearance" },
    { id: "notifications", icon: "🔔", label: "Notifications" },
    { id: "workspace",     icon: "🏢", label: "Workspace" },
    { id: "security",      icon: "🔐", label: "Security & Keys" },
  ];

  // ── Save btn ──────────────────────────────────────────────────────────────
  const SaveBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      disabled={saving || loading}
      className="px-6 py-2 rounded-xl text-xs font-bold text-white gradient-purple glow-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all">
      {saving ? "Saving…" : "Save Changes"}
    </button>
  );

  return (
    <div className="flex min-h-screen select-none font-sans" style={{ background: "#06020f" }}>
      <Toast toasts={toasts} />

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
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
              <div className="text-xs text-purple-400/60 font-mono">Loading settings…</div>
            </div>
          </div>
        ) : (
          <>
            {/* ── Profile ──────────────────────────────────────────────── */}
            {section === "profile" && (
              <div className="space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">👤 Profile Settings</h2>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-purple-950/10 border border-purple-500/5">
                  <div className="w-14 h-14 rounded-2xl gradient-purple flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-md">
                    {(fullName || user?.name || "A")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white font-heading">{fullName || user?.name || "—"}</div>
                    <div className="text-[10px] text-purple-400/60 mt-0.5 uppercase tracking-wide font-mono">{roleTitle || user?.role || "—"}</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-purple-300 border border-purple-500/25 ml-auto hover:border-purple-400 hover:text-white transition-all">Change Avatar</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Full Name",        value: fullName,      setter: setFullName },
                    { label: "Email Address",     value: email,         setter: setEmail },
                    { label: "Role Title",        value: roleTitle,     setter: setRoleTitle },
                    { label: "Organization",      value: organization,  setter: setOrganization },
                  ].map(({ label, value, setter }) => (
                    <div key={label} className="space-y-1">
                      <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">{label}</label>
                      <input
                        value={value}
                        onChange={e => setter(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 transition-all font-mono"
                      />
                    </div>
                  ))}
                </div>

                <SaveBtn onClick={handleSaveProfile} />
              </div>
            )}

            {/* ── Appearance ───────────────────────────────────────────── */}
            {section === "appearance" && (
              <div className="space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🎨 Appearance Configurations</h2>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Color Theme Palette</label>
                    <div className="flex gap-2">
                      {["Dark Violet", "Neon Obsidian", "Emerald Terminal"].map(th => (
                        <button key={th} onClick={() => setAppTheme(th)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                            appTheme === th ? "gradient-purple border-transparent text-white shadow-md glow-purple" : "bg-[#0d0920] border-purple-500/10 text-purple-300 hover:border-purple-500/20"
                          }`}>
                          {th}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Interface Font Face</label>
                    <select value={fontFace} onChange={e => setFontFace(e.target.value)}
                      className="bg-[#0d0920] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-white outline-none">
                      <option>Inter (Sora headings)</option>
                      <option>Outfit (Sora headings)</option>
                      <option>JetBrains Mono (System Code)</option>
                    </select>
                  </div>

                  <div className="p-4 rounded-xl bg-purple-950/10 border border-purple-500/5 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-bold text-white">Animations &amp; Micro-interactions</div>
                      <p className="text-[10px] text-purple-400/60 mt-0.5">Toggle transitions, progress flows, and live log updates.</p>
                    </div>
                    <input type="checkbox" checked={animations} onChange={e => setAnimations(e.target.checked)}
                      className="accent-purple-600 w-4 h-4 rounded cursor-pointer" />
                  </div>
                </div>

                <SaveBtn onClick={handleSaveAppearance} />
              </div>
            )}

            {/* ── Notifications ────────────────────────────────────────── */}
            {section === "notifications" && (
              <div className="space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🔔 Notification Channels</h2>
                <div className="space-y-1.5 bg-black/10 rounded-xl border border-purple-950 overflow-hidden divide-y divide-purple-950/50">
                  {[
                    { title: "Revenue milestone alerts",   desc: "Notify when conversion gains exceed daily budget quota limit.",          checked: notifRevenue,    setter: setNotifRevenue },
                    { title: "Agent failure diagnostics",  desc: "Alert when worker thread encounters rate limit loop or timeout.",        checked: notifAgentFail,  setter: setNotifAgentFail },
                    { title: "AI Daily Strategy briefings",desc: "Compile recommendations into a morning executive summary.",             checked: notifBriefings,  setter: setNotifBriefings },
                    { title: "System health heartbeats",   desc: "Monitor ping and database sync latency averages.",                      checked: notifHeartbeat,  setter: setNotifHeartbeat },
                  ].map(({ title, desc, checked, setter }) => (
                    <div key={title} className="p-4 flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-white">{title}</div>
                        <p className="text-[10px] text-purple-400/60 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                      <input type="checkbox" checked={checked} onChange={e => setter(e.target.checked)}
                        className="accent-purple-600 w-4 h-4 cursor-pointer mt-0.5" />
                    </div>
                  ))}
                </div>
                <SaveBtn onClick={handleSaveNotifications} />
              </div>
            )}

            {/* ── Workspace ────────────────────────────────────────────── */}
            {section === "workspace" && (
              <div className="space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🏢 Workspace Preferences</h2>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Workspace Namespace</label>
                    <input value={workspace} onChange={e => setWorkspace(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 font-mono" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Language &amp; Region</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)}
                      className="bg-[#0d0920] border border-purple-500/20 rounded-xl px-3 py-2 text-xs text-white outline-none">
                      <option>English (US)</option>
                      <option>Arabic (العربية)</option>
                      <option>Spanish (Español)</option>
                    </select>
                  </div>
                </div>

                <SaveBtn onClick={handleSaveWorkspace} />

                {/* Danger zone */}
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

            {/* ── Security ─────────────────────────────────────────────── */}
            {section === "security" && (
              <div className="space-y-6">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">🔐 Encryption &amp; Keys</h2>
                <p className="text-xs text-purple-400/60">Configure primary keys for vector stores and external webhook signatures.</p>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Encryption Salt Key</label>
                    <input type="password" value={saltKey} onChange={e => setSaltKey(e.target.value)}
                      placeholder="Enter workspace salt key"
                      className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wide">Webhook Verification Secret</label>
                    <input type="text" value={webhookSecret} onChange={e => setWebhookSecret(e.target.value)}
                      placeholder="whsec_..."
                      className="w-full px-4 py-2.5 rounded-xl text-xs text-white outline-none bg-[#0d0920] border border-purple-800/30 focus:border-purple-400 font-mono" />
                  </div>
                </div>

                <button
                  onClick={handleSaveKeys}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-purple glow-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {saving ? "Saving…" : "Save Keys"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
