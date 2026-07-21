import React, { createContext, useContext, useMemo } from "react";
import { CampaignRepository } from "../repositories/CampaignRepository";
import { DirectiveRepository } from "../repositories/DirectiveRepository";
import { CampaignService } from "../services/CampaignService";
import { DirectiveService } from "../services/DirectiveService";

interface Services {
  campaignService: CampaignService;
  directiveService: DirectiveService;
}

const ServiceContext = createContext<Services | null>(null);

export const ServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const services = useMemo(() => {
    // Instantiate Repositories
    const campaignRepo = new CampaignRepository();
    const directiveRepo = new DirectiveRepository();

    // Inject Repositories into Services
    const campaignService = new CampaignService(campaignRepo);
    const directiveService = new DirectiveService(directiveRepo);

    return {
      campaignService,
      directiveService,
    };
  }, []);

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = (): Services => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }
  return context;
};
