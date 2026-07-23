export interface AffiliateOffer {
  id: string;
  networkId: string;
  networkDisplayName: string;
  productName: string;
  description: string;
  commission: string;
  epc?: string;
  trackingUrl: string;
  imageUrl?: string;
}

export interface ProviderConnectionResult {
  provider: string;
  configured: boolean;
  authenticated: boolean;
  permissionsSufficient: boolean;
  capabilities: AffiliateProviderCapabilities;
  error?: string;
}

export interface AffiliateProviderCapabilities {
  connectionVerification: boolean;
  apiProductRead: boolean;
  marketplaceSearch: boolean;
  manualProductImport: boolean;
  manualPromolinkImport: boolean;
  trackingLinkGeneration: boolean;
  partnershipVerification: boolean;
}

export interface AffiliateProductImport {
  productId: string;
  productName: string;
  promolink?: string;
  salesPageUrl?: string;
}

export interface TrackingLinkInput {
  productId: string;
  workspaceId?: string;
  campaignId?: string;
  channel?: string;
}

export interface TrackingLinkResult {
  trackingUrl: string;
  campaignKey: string;
}

export interface TrackingLinkValidation {
  isValid: boolean;
  productId?: string;
  affiliateId?: string;
  campaignKey?: string;
  partnershipStatus: "unknown" | "pending" | "user_declared_approved" | "provider_verified_approved" | "rejected";
}

export interface AffiliateProvider {
  readonly networkId: string;
  readonly displayName: string;

  verifyConnection(credentials: Record<string, string>): Promise<ProviderConnectionResult>;
  searchProducts(query: string, credentials: Record<string, string>): Promise<AffiliateOffer[]>;
  importProduct(input: AffiliateProductImport, credentials: Record<string, string>): Promise<AffiliateOffer>;
  generateTrackingLink(input: TrackingLinkInput, credentials: Record<string, string>): Promise<TrackingLinkResult>;
  validateTrackingLink(url: string, credentials: Record<string, string>): Promise<TrackingLinkValidation>;
  getCapabilities(): Promise<AffiliateProviderCapabilities>;
  
  // Interactive OAuth-like API Key generation flow
  requestApiKey?(developerCredentials: Record<string, string>, state: string, callbackUrl: string): Promise<string>;
  retrieveApiKey?(developerCredentials: Record<string, string>, requestToken: string): Promise<string>;
  disconnect?(credentials: Record<string, string>): Promise<boolean>;
}
