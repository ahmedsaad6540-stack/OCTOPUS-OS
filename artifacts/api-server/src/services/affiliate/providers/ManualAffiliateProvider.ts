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

/**
 * Provides a universal manual flow for products that cannot be sourced via APIs.
 * It normalizes links from Digistore24, Amazon, Impact, ClickBank, etc.
 */
export class ManualAffiliateProvider implements AffiliateProvider {
  readonly networkId = "manual";
  readonly displayName = "Manual Import";

  async verifyConnection(credentials: Record<string, string>): Promise<ProviderConnectionResult> {
    return {
      provider: this.networkId,
      configured: true,
      authenticated: true,
      permissionsSufficient: true,
      capabilities: await this.getCapabilities()
    };
  }

  async searchProducts(query: string, credentials: Record<string, string>): Promise<AffiliateOffer[]> {
    return []; // Manual import doesn't support searching catalogs
  }

  async importProduct(input: AffiliateProductImport, credentials: Record<string, string>): Promise<AffiliateOffer> {
    if (!input.promolink) {
      throw new Error("A tracking link is required for manual import");
    }

    // Attempt to guess the original provider if possible based on format
    let guessedNetwork = "manual";
    if (input.promolink.includes("digistore24.com")) guessedNetwork = "digistore24";
    if (input.promolink.includes("amzn.to") || input.promolink.includes("amazon.com")) guessedNetwork = "amazon";
    if (input.promolink.includes("hop.clickbank.net")) guessedNetwork = "clickbank";

    return {
      id: input.productId || `manual_${Date.now()}`,
      networkId: guessedNetwork,
      networkDisplayName: guessedNetwork.charAt(0).toUpperCase() + guessedNetwork.slice(1),
      productName: input.productName || "Manually Imported Product",
      description: "Imported manually via Tracking Link",
      commission: "Variable",
      trackingUrl: input.promolink
    };
  }

  async generateTrackingLink(input: TrackingLinkInput, credentials: Record<string, string>): Promise<TrackingLinkResult> {
    const campaignKey = input.campaignId ? `oct_${input.campaignId.substring(0, 8)}` : `oct_${Date.now()}`;
    
    // For manual links, we try to append our sub-id where supported
    let modifiedUrl = input.productId; // In manual flow, productId might hold the original url
    
    // VERY naive subid appending for demonstration
    if (modifiedUrl.includes("digistore24.com")) {
      modifiedUrl += modifiedUrl.includes("?") ? `&cam=${campaignKey}` : `?cam=${campaignKey}`;
    } else if (modifiedUrl.includes("hop.clickbank.net")) {
      modifiedUrl += modifiedUrl.includes("?") ? `&tid=${campaignKey}` : `?tid=${campaignKey}`;
    }

    return {
      trackingUrl: modifiedUrl,
      campaignKey
    };
  }

  async validateTrackingLink(url: string, credentials: Record<string, string>): Promise<TrackingLinkValidation> {
    return {
      isValid: url.startsWith("http"),
      partnershipStatus: "user_declared_approved"
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
