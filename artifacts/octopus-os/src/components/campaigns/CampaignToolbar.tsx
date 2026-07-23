import { Campaign } from "@/domain/models/campaign";

interface CampaignToolbarProps {
  onNew: () => void;
  isFormOpen: boolean;
}

export function CampaignToolbar({ onNew, isFormOpen }: CampaignToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-black text-white font-heading">🚀 الحملات ومحرك الأرباح</h1>
        <p className="text-purple-400 font-semibold text-sm mt-1">إدارة الحملات التسويقية ونظام Profit Engine الآلي</p>
      </div>
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onNew}
          className="flex-1 sm:flex-none px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(147,51,234,0.3)] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transform hover:scale-105"
        >
          {isFormOpen ? "✕ Close" : "✨ New Campaign"}
        </button>
      </div>
    </div>
  );
}
