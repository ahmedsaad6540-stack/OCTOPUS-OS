import { Campaign } from "@/domain/models/campaign";
import { CampaignCard } from "./CampaignCard";

export function CampaignGrid({ campaigns, isLoading }: { campaigns: Campaign[], isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex justify-center py-32"><div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  
  if (campaigns.length === 0) {
    return <div className="text-center py-32 text-purple-400/60">No Campaigns Yet. Create your first campaign to start.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {campaigns.map(c => (
        <CampaignCard key={c.id} campaign={c} />
      ))}
    </div>
  );
}
