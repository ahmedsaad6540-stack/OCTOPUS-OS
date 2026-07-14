import { useState } from "react";

interface IdentityConfig {
  appName: string;
  domain: string;
  companyName: string;
  supportEmail: string;
  legalEmail: string;
  logo: string;
  primaryColor: string;
  country: string;
  description: string;
}

const LEGAL_PAGES = [
  { slug: "privacy",     label: "Privacy Policy",  icon: "🔒", required: true  },
  { slug: "terms",       label: "Terms of Service",icon: "📜", required: true  },
  { slug: "cookies",     label: "Cookie Policy",   icon: "🍪", required: false },
  { slug: "delete-data", label: "Data Deletion",   icon: "🗑️", required: true  },
  { slug: "support",     label: "Support",         icon: "🆘", required: false },
  { slug: "contact",     label: "Contact",         icon: "📬", required: false },
  { slug: "security",    label: "Security Policy", icon: "🛡️", required: false },
  { slug: "api-docs",    label: "API Docs",        icon: "📖", required: false },
  { slug: "about",       label: "About",           icon: "ℹ️", required: false },
  { slug: "status",      label: "Status Page",     icon: "📡", required: false },
  { slug: "changelog",   label: "Changelog",       icon: "📝", required: false },
];

const OAUTH_PLATFORMS = [
  { name: "TikTok",     icon: "🎵", slug: "tiktok"    },
  { name: "Google",     icon: "🔵", slug: "google"    },
  { name: "Meta",       icon: "👤", slug: "meta"      },
  { name: "YouTube",    icon: "📺", slug: "youtube"   },
  { name: "Pinterest",  icon: "📌", slug: "pinterest" },
  { name: "LinkedIn",   icon: "💼", slug: "linkedin"  },
  { name: "X (Twitter)",icon: "🐦", slug: "twitter"   },
  { name: "Snapchat",   icon: "👻", slug: "snapchat"  },
  { name: "Telegram",   icon: "✈️", slug: "telegram"  },
  { name: "Discord",    icon: "🎮", slug: "discord"   },
  { name: "Reddit",     icon: "🤖", slug: "reddit"    },
  { name: "Amazon",     icon: "🛒", slug: "amazon"    },
];

export function IdentityCenter() {
  const [config, setConfig] = useState<IdentityConfig>({
    appName: "OCTOPUS NEXUS OS",
    domain: "octopus.ai",
    companyName: "OCTOPUS Technologies",
    supportEmail: "support@octopus.ai",
    legalEmail: "legal@octopus.ai",
    logo: "🐙",
    primaryColor: "#7c3aed",
    country: "International",
    description: "AI-powered Business Operating System for affiliate marketing",
  });
  const [tab, setTab] = useState<"brand" | "legal" | "oauth" | "export">("brand");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaved(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaved(false);
  };

  const copy = (text: string) => void navigator.clipboard.writeText(text);

  const copyAll = (urls: string[]) => void navigator.clipboard.writeText(urls.join("\n"));

  const legalUrls = LEGAL_PAGES.map((p) => `https://${config.domain}/${p.slug}`);
  const oauthUrls = OAUTH_PLATFORMS.map((p) => `https://${config.domain}/oauth/${p.slug}`);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0a0614] p-5">
      <div className="max-w-5xl mx-auto">
        <div className="mb-5">
          <h1 className="text-xl font-black text-white">🏛️ Identity Center</h1>
          <p className="text-purple-400 text-xs mt-0.5">
            One place for your brand identity, legal pages, and OAuth URLs. All auto-generated from your domain.
          </p>
        </div>

        <div className="flex gap-1 bg-[#130d2a] border border-purple-900/40 rounded-xl p-1 mb-5 w-fit">
          {([
            { id: "brand",  label: "🎨 Brand & App" },
            { id: "legal",  label: "⚖️ Legal Pages" },
            { id: "oauth",  label: "🔑 OAuth URLs" },
            { id: "export", label: "📋 Export All" },
          ] as const).map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${tab === id ? "bg-gradient-to-r from-purple-700 to-indigo-700 text-white" : "text-purple-500 hover:text-white"}`}>
              {label}
            </button>
          ))}
        </div>

        {tab === "brand" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h2 className="text-sm font-bold text-white mb-4">🎨 App Identity</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "appName",     label: "App Name",       placeholder: "OCTOPUS NEXUS OS" },
                  { key: "domain",      label: "Domain",         placeholder: "octopus.ai" },
                  { key: "companyName", label: "Company Name",   placeholder: "OCTOPUS Technologies" },
                  { key: "country",     label: "Jurisdiction",   placeholder: "International" },
                  { key: "supportEmail", label: "Support Email", placeholder: "support@octopus.ai" },
                  { key: "legalEmail",  label: "Legal Email",    placeholder: "legal@octopus.ai" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-purple-300 mb-1">{label}</label>
                    <input
                      value={config[key as keyof IdentityConfig]}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-xs placeholder-purple-800 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-purple-300 mb-1">Description</label>
                  <textarea
                    value={config.description}
                    onChange={(e) => setConfig({ ...config, description: e.target.value })}
                    rows={2}
                    className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-xs placeholder-purple-800 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              </div>
              <button
                onClick={() => void save()}
                className="mt-5 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
              >
                {saved ? "✓ Saved!" : "Save Identity"}
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
                <h3 className="text-xs font-bold text-purple-300 mb-3">👁 Preview</h3>
                <div className="bg-[#0d0920] rounded-xl p-4 text-center border border-purple-900/20">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-700 to-indigo-800 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                    {config.logo}
                  </div>
                  <p className="text-sm font-black text-white">{config.appName}</p>
                  <p className="text-[10px] text-purple-500 mt-0.5">{config.companyName}</p>
                  <p className="text-[9px] text-purple-700 mt-1">🌐 {config.domain}</p>
                </div>
              </div>

              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
                <h3 className="text-xs font-bold text-purple-300 mb-3">📧 Key Contacts</h3>
                <div className="space-y-2">
                  {[
                    { label: "Support",  value: config.supportEmail },
                    { label: "Legal",    value: config.legalEmail },
                    { label: "Website",  value: `https://${config.domain}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-purple-900/20 last:border-0">
                      <span className="text-[10px] text-purple-500">{label}</span>
                      <span className="text-[10px] text-white font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "legal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {LEGAL_PAGES.map(({ slug, label, icon, required }) => {
              const url = `https://${config.domain}/${slug}`;
              return (
                <div key={slug} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4 hover:border-purple-700/60 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{icon}</span>
                      <div>
                        <p className="text-xs font-bold text-white">{label}</p>
                        {required && <span className="text-[9px] text-red-400 font-mono">Required by TikTok/Meta/Google</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-[#0d0920] rounded-lg px-3 py-2 border border-purple-900/20 mt-2">
                    <p className="text-[10px] font-mono text-purple-300 flex-1 truncate">{url}</p>
                    <button onClick={() => copy(url)} className="text-[9px] text-purple-500 hover:text-white flex-shrink-0 transition-all">Copy</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "oauth" && (
          <div>
            <div className="bg-[#130d2a] border border-blue-800/40 rounded-xl p-4 mb-4">
              <p className="text-xs font-bold text-blue-300 mb-1">🔑 OAuth Redirect URIs</p>
              <p className="text-[10px] text-purple-400">
                When registering your app with TikTok, Google, Meta, or any other platform, add these exact URLs as your allowed redirect URIs. They are auto-generated from your domain: <span className="text-purple-200 font-mono">{config.domain}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {OAUTH_PLATFORMS.map(({ name, icon, slug }) => {
                const callback = `https://${config.domain}/oauth/${slug}`;
                const redirect = `https://${config.domain}/oauth/${slug}/callback`;
                return (
                  <div key={slug} className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">{icon}</span>
                      <p className="text-xs font-bold text-white">{name}</p>
                    </div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Redirect URI", url: callback },
                        { label: "Callback URL", url: redirect },
                      ].map(({ label, url }) => (
                        <div key={label}>
                          <p className="text-[9px] text-purple-600 mb-0.5">{label}</p>
                          <div className="flex items-center gap-2 bg-[#0d0920] rounded-lg px-2 py-1.5 border border-purple-900/20">
                            <p className="text-[9px] font-mono text-purple-300 flex-1 truncate">{url}</p>
                            <button onClick={() => copy(url)} className="text-[9px] text-purple-600 hover:text-white flex-shrink-0 transition-all">Copy</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => copyAll(OAUTH_PLATFORMS.flatMap(({ slug }) => [`https://${config.domain}/oauth/${slug}`, `https://${config.domain}/oauth/${slug}/callback`]))}
              className="w-full mt-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3 rounded-xl text-sm"
            >
              📋 Copy All OAuth URLs ({OAUTH_PLATFORMS.length * 2} URLs)
            </button>
          </div>
        )}

        {tab === "export" && (
          <div className="space-y-4">
            <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5">
              <h3 className="text-sm font-bold text-white mb-4">📋 Complete URL Sheet</h3>
              <p className="text-xs text-purple-400 mb-4">Copy this complete list when setting up your app on any platform:</p>
              <div className="bg-[#0d0920] rounded-xl p-4 border border-purple-900/20 font-mono text-[10px] text-purple-200 space-y-1 max-h-80 overflow-y-auto">
                <p className="text-purple-500 mb-2"># {config.appName} — URL Reference Sheet</p>
                <p className="text-purple-500"># Generated: {new Date().toLocaleDateString()}</p>
                <p className="text-purple-500 mb-2"># Domain: {config.domain}</p>
                <p className="text-purple-400 mt-3 mb-1">## LEGAL PAGES</p>
                {LEGAL_PAGES.map((p) => (
                  <p key={p.slug}>{p.label.padEnd(20)} https://{config.domain}/{p.slug}</p>
                ))}
                <p className="text-purple-400 mt-3 mb-1">## OAUTH REDIRECT URIS</p>
                {OAUTH_PLATFORMS.map((p) => (
                  <p key={p.slug}>{p.name.padEnd(20)} https://{config.domain}/oauth/{p.slug}</p>
                ))}
                <p className="text-purple-400 mt-3 mb-1">## SUPPORT</p>
                <p>Support Email       {config.supportEmail}</p>
                <p>Legal Email         {config.legalEmail}</p>
                <p>Website             https://{config.domain}</p>
              </div>
              <button
                onClick={() => copy([
                  `# ${config.appName} — URL Reference Sheet`,
                  `# Generated: ${new Date().toLocaleDateString()}`,
                  `# Domain: ${config.domain}`,
                  `\n## LEGAL PAGES`,
                  ...LEGAL_PAGES.map((p) => `${p.label.padEnd(20)} https://${config.domain}/${p.slug}`),
                  `\n## OAUTH REDIRECT URIS`,
                  ...OAUTH_PLATFORMS.map((p) => `${p.name.padEnd(20)} https://${config.domain}/oauth/${p.slug}`),
                  `\n## SUPPORT`,
                  `Support Email       ${config.supportEmail}`,
                  `Legal Email         ${config.legalEmail}`,
                  `Website             https://${config.domain}`,
                ].join("\n"))}
                className="w-full mt-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-3 rounded-xl text-sm"
              >
                📋 Copy Complete URL Sheet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
