import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCampaigns, useCampaignMutations } from "@/hooks/useCampaigns";
import { CampaignToolbar } from "@/components/campaigns/CampaignToolbar";
import { CampaignGrid } from "@/components/campaigns/CampaignGrid";
import { CampaignDialog } from "@/components/campaigns/CampaignDialogs";
import { useAuth } from "@/context/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5002/api";

export function CampaignsPage() {
  const [, setLocation] = useLocation();
  const { data: campaigns = [], isLoading, error } = useCampaigns();
  const { createCampaign, startProfitEngine } = useCampaignMutations();
  const { token } = useAuth();
  
  const [showForm, setShowForm] = useState(false);
  const [engineResult, setEngineResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // Pre-fill initial form state if arriving from Affiliate Marketplace
  const [initialFormState, setInitialFormState] = useState<{ name?: string; productUrl?: string }>({});

  useEffect(() => {
    // Check if we arrived from Affiliates with a draft ID
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("draft") === "1" && token) {
      const draftId = sessionStorage.getItem("campaign_draft_id");
      if (draftId) {
        fetch(`${API_BASE}/campaign-drafts/${draftId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.productName && data.productUrl) {
            setInitialFormState({
              name: data.productName,
              productUrl: data.productUrl,
            });
            setShowForm(true);
            sessionStorage.removeItem("campaign_draft_id");
          }
        })
        .catch(err => console.error("Failed to load draft from server", err));
      }
      
      // Clean up URL so refresh doesn't reopen it
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token]);

  const handleStartEngine = () => {
    startProfitEngine.mutate(undefined, {
      onSuccess: (res) => setEngineResult({ success: true, message: res.message }),
      onError: (err: any) => setEngineResult({ success: false, message: err.message })
    });
  };

  const handleCreate = (form: { name: string; platform: string; affiliateNetwork: string; productUrl: string }) => {
    createCampaign.mutate(form, {
      onSuccess: () => setShowForm(false)
    });
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: "#0a0614" }}>
      <CampaignToolbar 
        onNew={() => setShowForm(!showForm)} 
        onStartEngine={handleStartEngine} 
        isEngineStarting={startProfitEngine.isPending} 
        isFormOpen={showForm} 
      />

      {engineResult && (
        <div className={`mb-4 p-4 rounded-xl border ${engineResult.success ? "bg-emerald-900/30 border-emerald-500/50 text-emerald-300" : "bg-red-900/30 border-red-500/50 text-red-300"}`}>
          {engineResult.message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-400 text-xs">
          ⚠ {(error as Error).message}
        </div>
      )}

      <CampaignDialog 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onCreate={handleCreate} 
        isCreating={createCampaign.isPending}
        initialData={initialFormState}
      />

      <CampaignGrid 
        campaigns={campaigns} 
        isLoading={isLoading} 
      />

      {/* Smart Navigation Bar */}
      <div className="mt-10 border-t border-purple-900/30 pt-6 flex justify-between items-center bg-black/20 p-4 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">الخطوة الأخيرة: محرك الأرباح (Profit Engine)</h3>
          <p className="text-xs text-purple-400">بمجرد إنشاء الحملة، انقر على زر Start Profit Engine في الأعلى ليبدأ النظام بالعمل، ثم يمكنك متابعة حالة الفيديوهات من Video Factory.</p>
        </div>
        <button 
          onClick={() => setLocation("/video-factory")}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-bold rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105">
          متابعة مصنع الفيديوهات 🎬
        </button>
      </div>
    </div>
  );
}
