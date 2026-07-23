import { Campaign } from "@/domain/models/campaign";

interface CampaignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (form: { name: string; platform: string; affiliateNetwork: string; productUrl: string }) => void;
  isCreating: boolean;
  initialData?: { name?: string; productUrl?: string };
}

const PLATFORMS = ["TikTok", "Instagram", "YouTube", "Pinterest", "Amazon", "ClickBank", "Other"];
const NETWORKS = ["Digistore24", "Amazon", "ClickBank", "Impact"];

import { useState, useEffect } from "react";

export function CampaignDialog({ isOpen, onClose, onCreate, isCreating, initialData }: CampaignDialogProps) {
  const [form, setForm] = useState({ name: "", platform: "TikTok", affiliateNetwork: "Digistore24", productUrl: "" });

  useEffect(() => {
    if (isOpen) {
      setForm(prev => ({
        ...prev,
        name: initialData?.name || prev.name,
        productUrl: initialData?.productUrl || prev.productUrl,
      }));
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onCreate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg glass-card p-8 rounded-3xl space-y-6 border border-purple-500/20">
        <h2 className="text-2xl font-black text-white">✨ Create Campaign</h2>
        <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Campaign Name" className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white" />
        <div className="grid grid-cols-2 gap-4">
          <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white">
            {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={form.affiliateNetwork} onChange={e => setForm(f => ({ ...f, affiliateNetwork: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white">
            {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <input type="url" required value={form.productUrl} onChange={e => setForm(f => ({ ...f, productUrl: e.target.value }))} placeholder="Affiliate URL" className="w-full px-4 py-3 rounded-xl bg-black/40 border border-purple-800/40 text-white" />
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl text-purple-300">Cancel</button>
          <button type="submit" disabled={isCreating} className="px-8 py-2.5 rounded-xl font-bold text-white bg-purple-600">
            {isCreating ? "Launching..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
