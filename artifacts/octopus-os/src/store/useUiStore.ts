import { create } from "zustand";

interface UiState {
  isSidebarOpen: boolean;
  theme: "light" | "dark" | "system";
  selectedCampaignId: string | number | null;
  selectedDirectiveId: string | null;
  toggleSidebar: () => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  setSelectedCampaignId: (id: string | number | null) => void;
  setSelectedDirectiveId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  theme: "dark",
  selectedCampaignId: null,
  selectedDirectiveId: null,
  
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setTheme: (theme) => set({ theme }),
  setSelectedCampaignId: (id) => set({ selectedCampaignId: id }),
  setSelectedDirectiveId: (id) => set({ selectedDirectiveId: id }),
}));
