import {
  AffiliateProvider,
  AffiliateOffer,
  ProviderConnectionResult,
  AffiliateProviderCapabilities,
  AffiliateProductImport,
  TrackingLinkInput,
  TrackingLinkResult,
  TrackingLinkValidation
} from "../AffiliateProvider.js";

export class ClickBankProvider implements AffiliateProvider {
  readonly networkId = "clickbank";
  readonly displayName = "ClickBank";

  async verifyConnection(credentials: Record<string, string>): Promise<ProviderConnectionResult> {
    const isConfigured = !!credentials.developerApiKey && !!credentials.clerkApiKey;
    
    return {
      provider: this.networkId,
      configured: isConfigured,
      authenticated: isConfigured,
      permissionsSufficient: isConfigured,
      capabilities: await this.getCapabilities()
    };
  }

  async searchProducts(query: string, credentials: Record<string, string>): Promise<AffiliateOffer[]> {
    return [];
  }

  async importProduct(input: AffiliateProductImport, credentials: Record<string, string>): Promise<AffiliateOffer> {
    const affiliateId = credentials.affiliateId || "affiliate";
    // input.productId in ClickBank is usually the vendor ID
    const trackingUrl = `https://hop.clickbank.net/?affiliate=${affiliateId}&vendor=${input.productId}`;
    return {
      id: input.productId,
      networkId: this.networkId,
      networkDisplayName: this.displayName,
      productName: input.productName,
      description: "Imported ClickBank Product",
      commission: "Variable",
      trackingUrl
    };
  }

  async generateTrackingLink(input: TrackingLinkInput, credentials: Record<string, string>): Promise<TrackingLinkResult> {
    const campaignKey = input.campaignId ? `oct_${input.campaignId.substring(0, 8)}` : `oct_${Date.now()}`;
    const affiliateId = credentials.affiliateId || "affiliate";
    // tid (Tracking ID) is limited to 24 alphanumeric chars
    const tid = campaignKey.substring(0, 24).replace(/[^a-zA-Z0-9]/g, '');
    const trackingUrl = `https://hop.clickbank.net/?affiliate=${affiliateId}&vendor=${input.productId}&tid=${tid}`;
    
    return {
      trackingUrl,
      campaignKey
    };
  }

  async validateTrackingLink(url: string, credentials: Record<string, string>): Promise<TrackingLinkValidation> {
    const isValid = url.includes("hop.clickbank.net") || url.includes("hop.clickbank.net");
    
    return {
      isValid,
      partnershipStatus: isValid ? "user_declared_approved" : "unknown"
    };
  }

  async getCapabilities(): Promise<AffiliateProviderCapabilities> {
    return {
      connectionVerification: true,
      apiProductRead: false,
      marketplaceSearch: false,
      manualProductImport: true,
      manualPromolinkImport: true,
      trackingLinkGeneration: true,
      partnershipVerification: false,
    };
  }
}
