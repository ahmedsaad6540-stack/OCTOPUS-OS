import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
type Tab = "brand" | "legal" | "oauth" | "export";

const OAUTH_PLATFORMS = [
  "TikTok","Instagram","Facebook","Google","YouTube","X","LinkedIn",
  "Pinterest","Snapchat","Reddit","Discord","GitHub","Twitch","Shopify",
];

export function IdentityCenter() {
  const { token } = useAuth();
  const [tab, setTab] = useState<Tab>("brand");
  const [brand, setBrand] = useState({ domain: "", appName: "", company: "", supportEmail: "", legalEmail: "", description: "" });
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/settings/system/brand_identity`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.setting?.value) {
          setBrand(data.setting.value);
        }
      })
      .catch(console.error);
  }, [token]);

  const saveBrand = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/settings/system/brand_identity`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ value: brand })
      });
      if (res.ok) {
        alert("✅ Brand identity saved successfully!");
      } else {
        alert("❌ Failed to save. Only admins can edit system settings.");
      }
    } catch (e) {
      console.error(e);
      alert("❌ Error saving");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const d = brand.domain || "yourdomain.com";
  const app = brand.appName || "YourApp";

  const LEGAL_PAGES = [
    { name: "Privacy Policy",       path: "/privacy",        required: true },
    { name: "Terms of Service",     path: "/terms",          required: true },
    { name: "Cookie Policy",        path: "/cookies",        required: true },
    { name: "Data Deletion",        path: "/data-deletion",  required: true },
    { name: "Support",              path: "/support",        required: true },
    { name: "Contact",              path: "/contact",        required: false },
    { name: "Security Policy",      path: "/security",       required: false },
    { name: "API Documentation",    path: "/api-docs",       required: false },
    { name: "OAuth Consent Screen", path: "/oauth-consent",  required: false },
    { name: "Impressum",            path: "/impressum",      required: false },
    { name: "GDPR Center",          path: "/gdpr",           required: false },
  ];

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "brand",  label: "Brand & App",    icon: "🏷️" },
    { id: "legal",  label: "Legal Pages",    icon: "⚖️" },
    { id: "oauth",  label: "OAuth URLs",     icon: "🔐" },
    { id: "export", label: "Export All",     icon: "📤" },
  ];

  const allUrls = OAUTH_PLATFORMS.map(p => ({
    platform: p,
    website: `https://${d}`,
    privacy: `https://${d}/privacy`,
    terms: `https://${d}/terms`,
    support: `https://${d}/support`,
    deletion: `https://${d}/data-deletion`,
    callback: `https://${d}/oauth/${p.toLowerCase().replace(/\s/g, "-")}/callback`,
    redirect: `https://${d}/oauth/${p.toLowerCase().replace(/\s/g, "-")}/redirect`,
  }));

  const exportText = allUrls.map(u =>
    `=== ${u.platform} ===\nWebsite URL:    ${u.website}\nPrivacy Policy: ${u.privacy}\nTerms:          ${u.terms}\nSupport URL:    ${u.support}\nData Deletion:  ${u.deletion}\nCallback URL:   ${u.callback}\nRedirect URI:   ${u.redirect}\n`
  ).join("\n");

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">🏛️ Identity Center</h1>
        <p className="text-purple-400/60 text-xs mt-1">Brand identity · Legal pages · OAuth URLs for all platforms</p>
      </div>

      <div className="flex gap-1 mb-6 p-1 rounded-xl w-fit" style={{ background: "#0d0920" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${tab === t.id ? "gradient-purple text-white" : "text-purple-400 hover:text-purple-300"}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {tab === "brand" && (
        <div className="max-w-2xl">
          <div className="card-os p-6 space-y-4">
            <h3 className="text-sm font-bold text-purple-300">Brand & App Identity</h3>
            {[
              ["Domain", "domain", "yourdomain.com", "text"],
              ["App / Brand Name", "appName", "MyApp", "text"],
              ["Company Name", "company", "My Company LLC", "text"],
              ["Support Email", "supportEmail", "support@yourdomain.com", "email"],
              ["Legal Email", "legalEmail", "legal@yourdomain.com", "email"],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-xs text-purple-400 mb-1 block">{label}</label>
                <input value={(brand as any)[key]} onChange={e => setBrand(b => ({ ...b, [key]: e.target.value }))}
                  placeholder={ph} className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none"
                  style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }} />
              </div>
            ))}
            <div>
              <label className="text-xs text-purple-400 mb-1 block">App Description</label>
              <textarea value={brand.description} onChange={e => setBrand(b => ({ ...b, description: e.target.value }))}
                placeholder="Describe your app..." rows={3}
                className="w-full px-3 py-2.5 rounded-lg text-xs text-white outline-none resize-none"
                style={{ background: "#0d0920", border: "1px solid rgba(139,92,246,0.2)" }} />
            </div>
            <button 
              onClick={saveBrand}
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple disabled:opacity-50">
              {loading ? "Saving..." : "💾 Save Brand Identity"}
            </button>
          </div>
        </div>
      )}

      {tab === "legal" && (
        <div className="max-w-2xl space-y-3">
          {LEGAL_PAGES.map(page => {
            const url = `https://${d}${page.path}`;
            return (
              <div key={page.name} className="card-os p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{page.name}</span>
                    {page.required && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/40 text-red-400 font-bold">REQUIRED</span>}
                  </div>
                  <code className="text-xs text-purple-400/60 mt-0.5 block">{url}</code>
                </div>
                <button onClick={() => copyText(url, page.name)}
                  className="px-3 py-1.5 rounded-lg text-xs border border-purple-500/30 text-purple-300 hover:border-purple-400/50 transition-all">
                  {copied === page.name ? "✅ Copied!" : "📋 Copy"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === "oauth" && (
        <div className="space-y-3">
          {OAUTH_PLATFORMS.map(platform => (
            <div key={platform} className="card-os p-4">
              <h4 className="text-sm font-bold text-white mb-3">{platform}</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["Website URL", `https://${d}`],
                  ["Privacy Policy URL", `https://${d}/privacy`],
                  ["Terms of Service URL", `https://${d}/terms`],
                  ["Support URL", `https://${d}/support`],
                  ["Data Deletion URL", `https://${d}/data-deletion`],
                  ["OAuth Callback URL", `https://${d}/oauth/${platform.toLowerCase().replace(/\s/g,"-")}/callback`],
                  ["Redirect URI", `https://${d}/oauth/${platform.toLowerCase().replace(/\s/g,"-")}/redirect`],
                ].map(([label, val]) => (
                  <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "#0a0614" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] text-purple-400/50">{label}</div>
                      <code className="text-[10px] text-purple-300 truncate block">{val}</code>
                    </div>
                    <button onClick={() => copyText(val, `${platform}-${label}`)} className="text-purple-400/60 hover:text-purple-300 shrink-0 text-xs">
                      {copied === `${platform}-${label}` ? "✅" : "📋"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "export" && (
        <div className="max-w-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Complete URL Sheet</h3>
              <p className="text-xs text-purple-400/60 mt-0.5">Copy this when registering on {OAUTH_PLATFORMS.length} platforms</p>
            </div>
            <button onClick={() => copyText(exportText, "all")}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white gradient-purple glow-purple">
              {copied === "all" ? "✅ Copied!" : "📋 Copy All URLs"}
            </button>
          </div>
          <pre className="card-os p-5 text-[10px] text-purple-300 font-mono leading-relaxed overflow-auto max-h-96 whitespace-pre">
            {exportText}
          </pre>
        </div>
      )}
    </div>
  );
}
