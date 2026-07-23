import { useState } from "react";

const LEGAL_PAGES = [
  { id: "privacy", label: "Privacy Policy", icon: "🔒", path: "/privacy" },
  { id: "terms", label: "Terms of Service", icon: "📜", path: "/terms" },
  { id: "cookies", label: "Cookie Policy", icon: "🍪", path: "/cookies" },
  { id: "delete", label: "Data Deletion", icon: "🗑️", path: "/delete-data" },
  { id: "support", label: "Support", icon: "🆘", path: "/support" },
  { id: "contact", label: "Contact Us", icon: "📬", path: "/contact" },
  { id: "security", label: "Security", icon: "🛡️", path: "/security" },
  { id: "api-docs", label: "API Documentation", icon: "📖", path: "/api-docs" },
  { id: "oauth", label: "OAuth Consent", icon: "🔑", path: "/oauth/consent" },
  { id: "about", label: "About", icon: "ℹ️", path: "/about" },
  { id: "status", label: "Status Page", icon: "📡", path: "/status" },
  { id: "changelog", label: "Changelog", icon: "📝", path: "/changelog" },
];

const GENERATE_CONTENT: Record<string, (config: { appName: string; domain: string; email: string; country: string }) => string> = {
  privacy: ({ appName, domain, email }) => `# Privacy Policy — ${appName}

**Last updated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## 1. Introduction
Welcome to ${appName} ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy.

## 2. Information We Collect
We collect information you provide directly to us, such as when you create an account, including:
- Name and email address
- Usage data and analytics
- Device information and IP addresses

## 3. How We Use Your Information
We use the information we collect to:
- Provide, maintain, and improve our services
- Process transactions and send related information
- Send promotional communications (with your consent)
- Monitor and analyze trends and usage

## 4. Data Sharing
We do not sell, trade, or rent your personal information to third parties. We may share data with:
- Service providers who assist in our operations
- Legal authorities when required by law

## 5. Data Retention
We retain your personal data for as long as necessary to provide our services. You may request deletion at any time at: ${domain}/delete-data

## 6. Contact
For privacy-related questions, contact us at: ${email}`,

  terms: ({ appName, domain, email }) => `# Terms of Service — ${appName}

**Last updated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}

## 1. Acceptance of Terms
By accessing and using ${appName} at ${domain}, you agree to be bound by these Terms of Service.

## 2. Description of Service
${appName} provides an AI-powered business operating system for digital entrepreneurs and affiliate marketers.

## 3. User Accounts
You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.

## 4. Acceptable Use
You agree not to use our service to:
- Violate any applicable laws or regulations
- Infringe on intellectual property rights
- Distribute spam or malicious content

## 5. Limitation of Liability
${appName} shall not be liable for any indirect, incidental, special, or consequential damages.

## 6. Contact
For questions about these terms, contact: ${email}`,

  delete: ({ appName, domain, email }) => `# Data Deletion Request — ${appName}

You have the right to request deletion of your personal data from ${appName}.

## How to Delete Your Data

**Option 1: Self-Service (Recommended)**
Log into your account at ${domain} → Settings → Danger Zone → Delete Account

**Option 2: Email Request**
Send an email to: ${email}
Subject: "Data Deletion Request"
Include: Your registered email address

**Option 3: This Form**
Fill out the form below and we will process your request within 30 days.

## What Gets Deleted
- Your account and profile information
- All campaigns, analytics, and tracking data
- AI provider configurations
- Social account connections
- All personally identifiable information

## Retention Notice
Some data may be retained for legal compliance for up to 90 days after deletion.`,
};

export function LegalPage() {
  const [selected, setSelected] = useState(LEGAL_PAGES[0]);
  const [config, setConfig] = useState({
    appName: "OCTOPUS NEXUS OS",
    domain: "octopus.ai",
    email: "legal@octopus.ai",
    country: "International",
    companyName: "OCTOPUS Technologies",
  });
  const [tab, setTab] = useState<"preview" | "config" | "urls">("preview");

  const content = GENERATE_CONTENT[selected.id]?.(config) ?? `# ${selected.label}\n\nContent for this page will be generated based on your domain configuration.\n\n**Contact:** ${config.email}`;

  const copy = (text: string) => void navigator.clipboard.writeText(text);

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0614] flex">
      <div className="w-52 border-r border-purple-900/30 flex flex-col">
        <div className="p-4 border-b border-purple-900/30">
          <h2 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-3">Legal Pages</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {LEGAL_PAGES.map((page) => (
            <button
              key={page.id}
              onClick={() => setSelected(page)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg mb-0.5 text-sm text-left transition-all ${selected.id === page.id ? "bg-purple-900/40 border border-purple-700/40 text-white" : "text-purple-400 hover:bg-purple-900/20 hover:text-white border border-transparent"}`}
            >
              <span>{page.icon}</span>
              <span className="text-xs font-medium">{page.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>{selected.icon}</span> {selected.label}
            </h2>
            <p className="text-[10px] text-purple-500 font-mono mt-0.5">
              https://{config.domain}{selected.path}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex bg-[#0d0920] border border-purple-800/40 rounded-lg p-0.5">
              {(["preview", "config", "urls"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded text-xs font-bold capitalize transition-all ${tab === t ? "bg-purple-800 text-white" : "text-purple-500 hover:text-white"}`}>
                  {t === "config" ? "⚙️ Config" : t === "urls" ? "🔗 URLs" : "👁 Preview"}
                </button>
              ))}
            </div>
            <button
              onClick={() => copy(content)}
              className="text-xs bg-[#130d2a] text-purple-300 hover:text-white px-3 py-1.5 rounded-lg border border-purple-800/40 hover:border-purple-600 transition-all font-bold"
            >
              📋 Copy
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === "preview" && (
            <div className="max-w-3xl">
              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-8">
                <div className="prose prose-invert max-w-none">
                  {content.split("\n").map((line, i) => {
                    if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold text-white mt-6 mb-2 border-b border-purple-900/30 pb-2">{line.slice(3)}</h2>;
                    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-black text-white mb-4">{line.slice(2)}</h1>;
                    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="text-xs font-bold text-purple-300 my-2">{line.slice(2, -2)}</p>;
                    if (line.startsWith("- ")) return <li key={i} className="text-xs text-purple-200 ml-4 my-0.5 list-disc">{line.slice(2)}</li>;
                    if (line === "") return <div key={i} className="h-2" />;
                    return <p key={i} className="text-xs text-purple-200 leading-relaxed my-1">{line}</p>;
                  })}
                </div>
              </div>
            </div>
          )}

          {tab === "config" && (
            <div className="max-w-lg">
              <h3 className="text-sm font-bold text-white mb-4">⚙️ Page Configuration</h3>
              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl p-5 space-y-4">
                {[
                  { key: "appName", label: "App / Product Name", placeholder: "OCTOPUS NEXUS OS" },
                  { key: "domain", label: "Domain", placeholder: "octopus.ai" },
                  { key: "email", label: "Legal Email", placeholder: "legal@octopus.ai" },
                  { key: "companyName", label: "Company Name", placeholder: "OCTOPUS Technologies" },
                  { key: "country", label: "Country / Jurisdiction", placeholder: "International" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-medium text-purple-300 mb-1.5">{label}</label>
                    <input
                      value={config[key as keyof typeof config]}
                      onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                      placeholder={placeholder}
                      className="w-full bg-[#0d0920] border border-purple-800/50 rounded-xl px-3 py-2.5 text-white text-sm placeholder-purple-700 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
                <p className="text-[10px] text-purple-600">All pages update instantly when you change these values.</p>
              </div>
            </div>
          )}

          {tab === "urls" && (
            <div className="max-w-2xl">
              <h3 className="text-sm font-bold text-white mb-4">🔗 All Legal URLs</h3>
              <p className="text-xs text-purple-400 mb-4">Copy these URLs when registering your app with TikTok, Meta, Google, YouTube, etc.</p>
              <div className="bg-[#130d2a] border border-purple-900/40 rounded-xl overflow-hidden">
                {LEGAL_PAGES.map(({ icon, label, path }, i) => {
                  const fullUrl = `https://${config.domain}${path}`;
                  return (
                    <div key={path} className={`flex items-center gap-4 px-4 py-3 hover:bg-purple-900/10 transition-colors ${i < LEGAL_PAGES.length - 1 ? "border-b border-purple-900/20" : ""}`}>
                      <span>{icon}</span>
                      <p className="text-xs font-semibold text-purple-300 w-32 flex-shrink-0">{label}</p>
                      <p className="text-xs text-white font-mono flex-1 truncate">{fullUrl}</p>
                      <button
                        onClick={() => copy(fullUrl)}
                        className="text-[10px] bg-[#0d0920] text-purple-400 hover:text-white px-2 py-1 rounded border border-purple-800/30 hover:border-purple-600 transition-all flex-shrink-0"
                      >
                        Copy
                      </button>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => copy(LEGAL_PAGES.map(({ label, path }) => `${label}: https://${config.domain}${path}`).join("\n"))}
                className="w-full mt-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm"
              >
                📋 Copy All URLs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
