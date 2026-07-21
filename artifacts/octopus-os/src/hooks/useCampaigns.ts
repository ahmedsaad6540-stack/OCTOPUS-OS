import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServices } from "@/context/ServiceContext";
import { useAuth } from "@/context/AuthContext";
import { Campaign } from "../domain/models/campaign";

export function useCampaigns() {
  const { token } = useAuth();
  const { campaignService } = useServices();
  
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: () => campaignService.list(token!),
    enabled: !!token,
    staleTime: 60 * 1000,
    refetchInterval: 15000, 
  });
}

export function useCampaignStats(id: string | number) {
  const { token } = useAuth();
  const { campaignService } = useServices();
  
  return useQuery({
    queryKey: ["campaignStats", id],
    queryFn: () => campaignService.getCampaignStats(token!, id),
    enabled: !!token && !!id,
    staleTime: 30 * 1000,
    refetchInterval: 15000,
  });
}

export function useCampaignMutations() {
  const { token } = useAuth();
  const { campaignService } = useServices();
  const queryClient = useQueryClient();

  const createCampaign = useMutation({
    mutationFn: (payload: Partial<Campaign>) => campaignService.create(token!, payload),
    onMutate: async (newCampaignPayload) => {
      await queryClient.cancelQueries({ queryKey: ["campaigns"] });
      const previous = queryClient.getQueryData<Campaign[]>(["campaigns"]);
      queryClient.setQueryData<Campaign[]>(["campaigns"], (old) => [
        ...(old || []), 
        { ...newCampaignPayload, id: "temp-" + Date.now(), status: "draft", createdAt: new Date().toISOString() } as Campaign
      ]);
      return { previous };
    },
    onError: (err, newCampaign, context) => {
      queryClient.setQueryData(["campaigns"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const toggleCampaignStatus = useMutation({
    mutationFn: ({ id, currentStatus }: { id: string | number; currentStatus: string }) => 
      currentStatus === "active" ? campaignService.pause(token!, id) : campaignService.activate(token!, id),
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["campaigns"] });
      const previous = queryClient.getQueryData<Campaign[]>(["campaigns"]);
      queryClient.setQueryData<Campaign[]>(["campaigns"], (old) => 
        (old || []).map(c => c.id === id ? { ...c, status: currentStatus === "active" ? "paused" : "active" } : c)
      );
      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(["campaigns"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const deleteCampaign = useMutation({
    mutationFn: (id: string | number) => campaignService.archive(token!, id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["campaigns"] });
      const previous = queryClient.getQueryData<Campaign[]>(["campaigns"]);
      queryClient.setQueryData<Campaign[]>(["campaigns"], (old) => (old || []).filter(c => c.id !== id));
      return { previous };
    },
    onError: (err, id, context) => {
      queryClient.setQueryData(["campaigns"], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const startProfitEngine = useMutation({
    mutationFn: () => campaignService.publish(token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  return {
    createCampaign,
    toggleCampaignStatus,
    deleteCampaign,
    startProfitEngine,
  };
}
