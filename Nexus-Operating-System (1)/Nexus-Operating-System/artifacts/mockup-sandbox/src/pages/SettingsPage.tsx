import { useState } from "react";
import { useAuth } from "@/lib/auth";

interface SettingSection {
  id: string;
  title: string;
  icon: string;
}

const SECTIONS: SettingSection[] = [
  { id: "profile", title: "Profile", icon: "👤" },
  { id: "security", title: "Security", icon: "🔐" },
  { id: "system", title: "System", icon: "⚙️" },
  { id: "oauth", title: "OAuth URLs", icon: "🔗" },
  { id: "notifications", title: "Notifications", icon: "🔔" },
  { id: "danger", title: "Danger Zone", icon: "⚠️" },
];

export function SettingsPage() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [domain, setDomain] = useState("octopus.ai");
  const [saved, setSaved] = useState(false);

  const oauthUrls = [
    { label: "Privacy Policy", path: `https://${domain}/privacy` },
    { label: "Terms of Service", path: `https://${domain}/terms` },
    { label: "Support", path: `https://${domain}/support` },
    { label: "Data Deletion", path: `https://${domain}/delete-data` },
    { label: "OAuth TikTok", path: `https://${domain}/oauth/tiktok` },
    { label: "OAuth Google", path: `https://${domain}/oauth/google` },
    { label: "OAuth Meta", path: `https://${domain}/oauth/meta` },
    { label: "OAuth YouTube", path: `https://${domain}/oauth/youtube` },
    { label: "Redirect URI", path: `https://${domain}/oauth/callback` },
    { label: "Webhook", path: `https://${domain}/webhook` },
  ];

  const handleSave = async () => {
    await new Promise((r) => setTimeout(r, 600));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex">
      <div className="w-52 border-r border-purple-900/30 p-3">
        <h2 className="text-xs font-black text-purple-500 uppercase tracking-widest px-2 mb-3">Settings</h2>
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg mb-0.5 text-sm text-left transition-all ${
              activeSection === s.id
                ? "bg-gradient-to-r from-purple-800/60 to-indigo-800/40 text-white border border-purple-700/40"
                : "text-purple-400 hover:bg-purple-900/20 hover:text-white"
            }`}
          >
            <span>{s.icon}</span>
            <span className="font-medium text-xs">{s.title}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeSection === "profile" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">👤 Profile</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-2xl font-black text-white">
                  {user?.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{user?.name}</p>
                  <p className="text-sm text-purple-400">{user?.email}</p>
                  <span className="text-[10px] bg-purple-800/40 text-purple-300 px-2 py-0.5 rounded font-mono">{user?.role}</span>
                </div>
              </div>
              {[
                { label: "Full Name", value: user?.name ?? "", placeholder: "Your name" },
                { label: "Email", value: user?.email ?? "", placeholder: "email@example.com" },
              ].map(({ label, value, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-purple-300 mb-1.5">{label}</label>
                  <input
                    type="text"
                    defaultValue={value}
                    placeholder={placeholder}
                    className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              ))}
              <button onClick={() => void handleSave()} className={`w-full font-bold py-2.5 rounded-xl text-sm transition-all ${saved ? "bg-emerald-700 text-white" : "bg-gradient-to-r from-purple-700 to-indigo-700 text-white"}`}>
                {saved ? "✓ Saved!" : "Save Changes"}
              </button>
            </div>
          </div>
        )}

        {activeSection === "security" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">🔐 Security</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-4">
              {[
                { label: "Current Password", placeholder: "••••••••" },
                { label: "New Password", placeholder: "Min 8 characters" },
                { label: "Confirm New Password", placeholder: "Repeat password" },
              ].map(({ label, placeholder }) => (
                <div key={label}>
                  <label className="block text-xs font-medium text-purple-300 mb-1.5">{label}</label>
                  <input type="password" placeholder={placeholder} className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all" />
                </div>
              ))}
              <button className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm">
                🔐 Update Password
              </button>
            </div>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 mt-4">
              <h3 className="text-sm font-bold text-white mb-3">Active Sessions</h3>
              <div className="bg-[#0d0920] rounded-lg p-3 border border-purple-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white">Current Session</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">Web Browser · Now · {user?.email}</p>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-800/30">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "system" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">⚙️ System</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-4">
              {[
                { label: "Autonomous Mode Schedule", desc: "Run agents automatically every day at:", value: "06:00 AM" },
                { label: "Default Language", desc: "Language for AI content generation:", value: "English" },
                { label: "Default Currency", desc: "Currency for revenue tracking:", value: "USD ($)" },
                { label: "Timezone", desc: "Your timezone for scheduling:", value: "UTC+3 (Riyadh)" },
              ].map(({ label, desc, value }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-semibold text-white">{label}</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">{desc}</p>
                  </div>
                  <select defaultValue={value} className="bg-[#0d0920] border border-purple-800/40 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                    <option>{value}</option>
                  </select>
                </div>
              ))}
              {[
                { label: "CEO Daily Briefing", desc: "Receive AI CEO report every morning" },
                { label: "Auto Failover", desc: "Switch AI provider if one goes offline" },
                { label: "Smart Retry", desc: "Automatically retry failed operations" },
                { label: "Error Alerts", desc: "Get notified when agents fail" },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <div>
                    <p className="text-xs font-semibold text-white">{label}</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "oauth" && (
          <div className="max-w-2xl">
            <h2 className="text-lg font-black text-white mb-2">🔗 OAuth URLs</h2>
            <p className="text-xs text-purple-400 mb-5">Auto-generated URLs for platform app registration. Copy these when registering with TikTok, Meta, Google, etc.</p>
            <div className="mb-4">
              <label className="block text-xs font-medium text-purple-300 mb-1.5">Your Domain</label>
              <div className="flex gap-2">
                <input
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="flex-1 bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="yourdomain.com"
                />
              </div>
            </div>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
              {oauthUrls.map(({ label, path }, i) => (
                <div key={label} className={`flex items-center justify-between px-4 py-3 ${i < oauthUrls.length - 1 ? "border-b border-purple-900/20" : ""} hover:bg-purple-900/10 transition-colors`}>
                  <p className="text-xs font-semibold text-purple-300 w-36">{label}</p>
                  <p className="text-xs text-white font-mono flex-1 truncate mx-4">{path}</p>
                  <button
                    onClick={() => void navigator.clipboard.writeText(path)}
                    className="text-[10px] bg-[#0d0920] text-purple-400 hover:text-white px-2 py-1 rounded border border-purple-800/30 hover:border-purple-600 transition-all flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-white mb-5">🔔 Notifications</h2>
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-3">
              {[
                { label: "Revenue Milestone", desc: "When you hit $100, $500, $1000+ in a day" },
                { label: "Campaign Alert", desc: "When a campaign pauses due to budget/error" },
                { label: "Trend Detected", desc: "When TrendHunter finds a hot opportunity" },
                { label: "Agent Error", desc: "When any agent encounters an error" },
                { label: "Daily Summary", desc: "End-of-day performance summary" },
                { label: "New Conversion", desc: "Real-time conversion notifications" },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-purple-900/20 last:border-0">
                  <div>
                    <p className="text-xs font-semibold text-white">{label}</p>
                    <p className="text-[10px] text-purple-500 mt-0.5">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "danger" && (
          <div className="max-w-lg">
            <h2 className="text-lg font-black text-red-400 mb-5">⚠️ Danger Zone</h2>
            <div className="space-y-3">
              {[
                { title: "Clear All Campaign Data", desc: "Permanently delete all campaigns and their analytics.", btn: "Clear Data", color: "border-red-900/40 hover:border-red-700/60" },
                { title: "Reset All Agents", desc: "Reset all agent configurations and memory to default.", btn: "Reset Agents", color: "border-red-900/40 hover:border-red-700/60" },
                { title: "Delete Account", desc: "Permanently delete your account and all associated data. This cannot be undone.", btn: "Delete Account", color: "border-red-700/60 bg-red-950/20" },
              ].map(({ title, desc, btn, color }) => (
                <div key={title} className={`border ${color} rounded-xl p-4 transition-colors`}>
                  <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                  <p className="text-xs text-purple-400 mb-3">{desc}</p>
                  <button className="bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 border border-red-800/40 text-xs font-bold px-4 py-2 rounded-lg transition-all">
                    {btn}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
