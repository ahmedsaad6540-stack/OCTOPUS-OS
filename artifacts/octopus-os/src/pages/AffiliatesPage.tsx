import { useState, useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

const NETWORK_META: Record<string, { icon: string; name: string; commission: string; fields: string[] }> = {
  digistore24: { icon: "🏦", name: "Digistore24", commission: "40-80%", fields: ["API Key", "Affiliate ID"] },
  impact:      { icon: "⚡", name: "Impact Radius", commission: "5-25%", fields: ["API Key", "Account SID"] },
  amazon:      { icon: "📦", name: "Amazon Associates", commission: "1-10%", fields: ["Associate Tag"] },
  clickbank:   { icon: "🎯", name: "ClickBank", commission: "50-90%", fields: ["Developer API Key", "Clerk API Key", "Affiliate ID"] },
  manual:      { icon: "📝", name: "Other (Manual Link)", commission: "Variable", fields: [] },
};

export function AffiliatesPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [selected, setSelected] = useState("digistore24");
  const [activeTab, setActiveTab] = useState<"connections" | "marketplace" | "import">("connections");
  
  const [connections, setConnections] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  
  const [importForm, setImportForm] = useState({ productName: "", productId: "", promolink: "" });

  const isDevMode = import.meta.env.VITE_DEV_MODE === "true";

  const fetchConnections = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/affiliate/connections`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/affiliate/products`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchConnections(); 
    fetchProducts();
  }, [token]);

  const networkIds = Object.keys(NETWORK_META);
  const meta = NETWORK_META[selected];
  
  // Find the active connection and ignore mock if not in dev mode
  const existingConn = connections.find(c => {
    if (c.provider !== selected || c.status !== "active") return false;
    if (c.connectionSource === "mock" && !isDevMode) return false;
    return true;
  });
  const isConnected = !!existingConn;

  const connect = async () => {
    if (!token) return;
    setSaving(true);
    setTestMsg("");
    try {
      if (isConnected) {
        await fetch(`${API_BASE}/affiliate/connections/${selected}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setTestMsg("✅ Connection revoked successfully");
      } else {
        const payload = {
          apiKey: values["API Key"] ?? "",
          affiliateId: values["Affiliate ID"] ?? ""
        };
        const res = await fetch(`${API_BASE}/affiliate/connections/${selected}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          setTestMsg("✅ Credentials saved securely");
        } else {
          setTestMsg("❌ Failed to save credentials");
        }
      }
      setValues({}); // Clear input fields immediately
      await fetchConnections();
    } catch (err) {
      setTestMsg("❌ Operation failed");
    } finally {
      setSaving(false);
    }
  };

  const handleInteractiveConnect = async () => {
    if (!token) return;
    setSaving(true);
    setTestMsg("");
    try {
      const res = await fetch(`${API_BASE}/affiliate/connections/${selected}/request-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setTestMsg(`❌ Failed to start interactive flow: ${data.error}`);
        setSaving(false);
      }
    } catch (err) {
      setTestMsg("❌ Operation failed");
      setSaving(false);
    }
  };

  const testConn = async () => {
    if (!token) return;
    setTesting(true);
    setTestMsg("");
    try {
      const res = await fetch(`${API_BASE}/affiliate/connections/${selected}/test`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.authenticated) {
        setTestMsg("✅ API connection verified successfully");
      } else {
        setTestMsg("❌ API connection failed: Invalid credentials or permissions");
      }
      await fetchConnections();
    } catch (err) {
      setTestMsg("❌ Error communicating with backend");
    }
    setTesting(false);
  };

  const handleImport = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/affiliate/products/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: selected,
          productId: importForm.productId,
          productName: importForm.productName,
          promolink: importForm.promolink
        })
      });
      if (res.ok) {
        alert("Product imported successfully!");
        setImportForm({ productName: "", productId: "", promolink: "" });
        fetchProducts();
        setActiveTab("marketplace");
      } else {
        alert("Import failed");
      }
    } catch (e) {
      alert("Error importing product");
    }
  };

  const handlePromote = async (product: any) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/affiliate/products/${product.id}/tracking-link`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "octopus" })
      });
      const data = await res.json();
      if (res.ok && data.trackingLink) {
        // Create server-side draft
        const draftRes = await fetch(`${API_BASE}/campaign-drafts/from-affiliate-product`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            affiliateProductId: product.id,
            trackingLinkId: data.trackingLink.id,
            provider: product.provider,
            productName: product.name,
            trackingUrl: data.trackingLink.generatedUrl
          })
        });
        const draftData = await draftRes.json();
        
        if (draftRes.ok && draftData.campaignDraftId) {
          sessionStorage.setItem("campaign_draft_id", draftData.campaignDraftId);
          window.location.href = `/campaigns?draft=1`;
        } else {
          alert("Failed to create campaign draft server-side");
        }
      } else {
        alert("Failed to generate tracking link");
      }
    } catch (e) {
      alert("Error generating tracking link");
    }
  };

  return (
    <div className="flex h-full min-h-screen select-none font-sans" style={{ background: "#06020f" }}>
      {/* Left sidebar */}
      <div className="w-64 shrink-0 py-4 px-3 flex flex-col bg-black/20 border-r border-purple-950/60">
        <div className="text-[10px] font-bold uppercase tracking-widest text-purple-400/40 px-3 py-2 font-heading">
          {t("affiliates") ?? "Affiliate Networks"}
        </div>
        
        <div className="px-3 mb-2 flex flex-col gap-2">
          <button onClick={() => setActiveTab("connections")} className={`py-2 text-[11px] font-bold rounded text-left px-3 ${activeTab === "connections" ? "bg-purple-900/60 text-white" : "text-purple-400/60 hover:bg-purple-900/30"}`}>🔌 Connections</button>
          <button onClick={() => setActiveTab("marketplace")} className={`py-2 text-[11px] font-bold rounded text-left px-3 ${activeTab === "marketplace" ? "bg-emerald-900/60 text-emerald-300" : "text-emerald-400/60 hover:bg-emerald-900/30"}`}>🛒 Marketplace</button>
          <button onClick={() => setActiveTab("import")} className={`py-2 text-[11px] font-bold rounded text-left px-3 ${activeTab === "import" ? "bg-blue-900/60 text-blue-300" : "text-blue-400/60 hover:bg-blue-900/30"}`}>📥 Manual Import</button>
        </div>

        {activeTab === "connections" && (
          <div className="space-y-1 mt-4">
            {networkIds.map(id => {
              const m = NETWORK_META[id];
              const c = connections.find(conn => conn.provider === id && conn.status === "active");
              return (
                <button key={id} onClick={() => { setSelected(id); setTestMsg(""); setValues({}); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${selected === id ? "bg-purple-900/40 border border-purple-700/30" : "hover:bg-purple-900/20"}`}>
                  <span className="text-lg">{m.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">{m.name}</div>
                    <div className={`text-[10px] font-bold ${c ? (c.credentialStatus === "verified" ? "text-emerald-400" : "text-yellow-400") : "text-purple-400/40"}`}>
                      {c ? (c.credentialStatus === "verified" ? "● Verified" : "● Unverified") : "○ Not Configured"}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {isDemoMode && (
          <div className="mt-auto px-3">
            <div className="bg-yellow-900/30 border border-yellow-700/50 p-2 rounded text-[10px] text-yellow-500 font-bold text-center">
              AFFILIATE_DEMO_MODE=true
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === "connections" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl">{meta.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-white font-heading">{meta.name}</h1>
                <div className="text-xs text-purple-400">Manage credentials securely</div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-purple-900/30 space-y-4">
              <h2 className="text-sm font-bold text-white mb-2">Connection Status</h2>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs font-bold rounded-full ${isConnected ? "bg-emerald-900/40 text-emerald-400" : "bg-purple-900/40 text-purple-400"}`}>
                  {existingConn ? (existingConn.credentialStatus === "verified" ? "Verified & Connected" : "Configured but Unverified") : "Not Configured"}
                </span>
                {existingConn && existingConn.lastVerifiedAt && (
                  <span className="text-xs text-purple-400/50">Last tested: {new Date(existingConn.lastVerifiedAt).toLocaleString()}</span>
                )}
              </div>
            </div>

            <div className="glass-card p-6 rounded-xl border border-purple-900/30 space-y-4">
              <h2 className="text-sm font-bold text-white mb-4">Credentials</h2>
              {meta.fields.map(field => (
                <div key={field} className="mb-3">
                  <label className="block text-xs font-bold text-purple-300 mb-1">{field}</label>
                  <input
                    type={field.includes("Key") || field.includes("Secret") ? "password" : "text"}
                    value={values[field] ?? ""}
                    onChange={e => setValues({...values, [field]: e.target.value})}
                    placeholder={isConnected ? (field.includes("Key") ? "•••••••••••••••• (Set)" : "(Set)") : `Enter ${field}...`}
                    className="w-full bg-black/50 border border-purple-800/40 rounded p-2 text-sm text-white"
                  />
                  {field.includes("Key") && isConnected && (
                    <div className="text-[10px] text-yellow-500/80 mt-1">Submitting a new key will immediately replace the old encrypted key.</div>
                  )}
                </div>
              ))}

              {testMsg && (
                <div className={`text-xs p-3 rounded mt-4 ${testMsg.includes("✅") ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
                  {testMsg}
                </div>
              )}

              <div className="flex gap-3 mt-6">
                {!isConnected && selected === "digistore24" && (
                  <button onClick={handleInteractiveConnect} disabled={saving} className="px-4 py-2 text-xs font-bold rounded bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                    {saving ? "..." : "Connect securely with Digistore24 (Recommended)"}
                  </button>
                )}

                <button onClick={connect} disabled={saving} className={`px-4 py-2 text-xs font-bold rounded ${isConnected ? "bg-red-900/40 text-red-400 hover:bg-red-900/60" : "bg-black/30 hover:bg-black/50 text-white border border-purple-800/50"}`}>
                  {saving ? "..." : (isConnected ? "Revoke Connection" : "Manual Save")}
                </button>
                
                {isConnected && (
                  <button onClick={testConn} disabled={testing} className="px-4 py-2 text-xs font-bold rounded bg-purple-900/40 text-purple-300 border border-purple-700/50 hover:bg-purple-900/60">
                    {testing ? "Testing..." : "Test Connection"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "marketplace" && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">My Products</h1>
            <p className="text-xs text-purple-400 mb-6">Products you have imported or connected.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.length === 0 ? (
                <div className="col-span-full p-8 text-center border border-dashed border-purple-800/40 rounded-xl text-purple-400/60">
                  No products found. Go to Manual Import to add a product.
                </div>
              ) : products.map(p => (
                <div key={p.id} className="glass-card p-5 rounded-xl border border-purple-900/30">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs font-bold uppercase text-purple-400">{p.provider}</div>
                    <span className="text-[9px] bg-blue-900/40 text-blue-300 px-2 py-1 rounded">{p.catalogSource.replace(/_/g, " ")}</span>
                  </div>
                  <div className="text-lg font-bold text-white mb-1">{p.name}</div>
                  <div className="text-xs text-purple-400/60 mb-4">ID: {p.externalProductId}</div>
                  
                  <div className="flex justify-between items-center mb-4 text-[10px]">
                    <span className="text-purple-300">Status: <span className="text-emerald-400 font-bold">{p.partnershipStatus}</span></span>
                  </div>

                  <button onClick={() => handlePromote(p)} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-2 rounded text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    ⚡ Promote with AI
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "import" && (
          <div className="max-w-xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-white mb-2">Manual Import</h1>
            <p className="text-xs text-purple-400 mb-6">Import a product that is not available in the public catalog.</p>

            <div className="glass-card p-6 rounded-xl border border-purple-900/30 space-y-4">
              <label className="block text-xs font-bold text-purple-300">Network</label>
              <select value={selected} onChange={e => setSelected(e.target.value)} className="w-full bg-black/50 border border-purple-800/40 rounded p-2 text-sm text-white">
                {networkIds.map(id => <option key={id} value={id}>{NETWORK_META[id].name}</option>)}
              </select>

              <label className="block text-xs font-bold text-purple-300">Product Name</label>
              <input value={importForm.productName} onChange={e => setImportForm({...importForm, productName: e.target.value})} className="w-full bg-black/50 border border-purple-800/40 rounded p-2 text-sm text-white" placeholder="e.g. Meticore" />

              <label className="block text-xs font-bold text-purple-300">Product ID (optional)</label>
              <input value={importForm.productId} onChange={e => setImportForm({...importForm, productId: e.target.value})} className="w-full bg-black/50 border border-purple-800/40 rounded p-2 text-sm text-white" placeholder="e.g. 12345" />

              <label className="block text-xs font-bold text-purple-300">Promolink (optional)</label>
              <input value={importForm.promolink} onChange={e => setImportForm({...importForm, promolink: e.target.value})} className="w-full bg-black/50 border border-purple-800/40 rounded p-2 text-sm text-white" placeholder="https://www.checkout-ds24.com/redir/..." />

              <button onClick={handleImport} className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded text-sm w-full">
                Import Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
