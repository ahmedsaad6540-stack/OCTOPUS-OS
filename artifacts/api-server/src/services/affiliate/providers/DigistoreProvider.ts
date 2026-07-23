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

export class DigistoreProvider implements AffiliateProvider {
  readonly networkId = "digistore24";
  readonly displayName = "Digistore24";

  async getCapabilities(): Promise<AffiliateProviderCapabilities> {
    return {
      connectionVerification: true,
      apiProductRead: false, // Reading the public catalog requires specific vendor scopes
      marketplaceSearch: false, // The official API doesn't expose the public marketplace easily to all read-only keys
      manualProductImport: true,
      manualPromolinkImport: true,
      trackingLinkGeneration: true,
      partnershipVerification: false, // Determining if partnership is strictly approved isn't fully possible with a generic promolink validation
    };
  }

  // Configurable base URL for testing
  public static API_BASE = "https://www.digistore24.com/api/call";

  async verifyConnection(credentials: Record<string, string>): Promise<ProviderConnectionResult> {
    const apiKey = credentials.apiKey;
    if (!apiKey) {
      return {
        provider: this.networkId,
        configured: false,
        authenticated: false,
        permissionsSufficient: false,
        capabilities: await this.getCapabilities()
      };
    }

    try {
      const res = await fetch(DigistoreProvider.API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-DS-API-KEY": apiKey
        },
        body: JSON.stringify({
          call: "ping"
        })
      });

      if (res.status === 429) {
        throw new Error("Rate limit exceeded");
      }
      if (res.status >= 500) {
        throw new Error(`Provider server error: ${res.status}`);
      }

      const data = await res.json().catch(() => ({})) as any;

      if (res.ok && data.result !== "error") {
        return {
          provider: this.networkId,
          configured: true,
          authenticated: true,
          permissionsSufficient: true,
          capabilities: await this.getCapabilities()
        };
      } else {
        return {
          provider: this.networkId,
          configured: true,
          authenticated: false,
          permissionsSufficient: false,
          capabilities: await this.getCapabilities()
        };
      }
    } catch (err: any) {
      console.warn(`[DigistoreProvider] Connection verification failed: ${err.message}`);
      return {
        provider: this.networkId,
        configured: true,
        authenticated: false,
        permissionsSufficient: false,
        capabilities: await this.getCapabilities(),
        error: err.message
      };
    }
  }

  async requestApiKey(developerCredentials: Record<string, string>, state: string, callbackUrl: string): Promise<string> {
    const devKey = developerCredentials.developerKey;
    if (!devKey) throw new Error("Missing developer key for Digistore24");

    const res = await fetch(DigistoreProvider.API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-DS-API-KEY": devKey
      },
      body: JSON.stringify({
        call: "requestApiKey",
        permissions: "readonly",
        state: state,
        redirect_url: callbackUrl
      })
    });

    const data = await res.json().catch(() => ({})) as any;
    if (!res.ok || data.result === "error") {
      throw new Error(`Failed to request API key: ${data.message || "Unknown error"}`);
    }

    return data.redirect_url;
  }

  async retrieveApiKey(developerCredentials: Record<string, string>, requestToken: string): Promise<string> {
    const devKey = developerCredentials.developerKey;
    if (!devKey) throw new Error("Missing developer key for Digistore24");

    const res = await fetch(DigistoreProvider.API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-DS-API-KEY": devKey
      },
      body: JSON.stringify({
        call: "retrieveApiKey",
        request_token: requestToken
      })
    });

    const data = await res.json().catch(() => ({})) as any;
    if (!res.ok || data.result === "error") {
      throw new Error(`Failed to retrieve API key: ${data.message || "Unknown error"}`);
    }

    return data.api_key;
  }

  async disconnect(credentials: Record<string, string>): Promise<boolean> {
    const apiKey = credentials.apiKey;
    if (!apiKey) return false;

    try {
      const res = await fetch(DigistoreProvider.API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-DS-API-KEY": apiKey
        },
        body: JSON.stringify({ call: "unregister" })
      });
      return res.ok;
    } catch {
      // If revocation fails due to network, we still treat the token as revoked locally 
      // but log it gracefully if needed.
      return false;
    }
  }

  async searchProducts(query: string, credentials: Record<string, string>): Promise<AffiliateOffer[]> {
    // Digistore24 API doesn't have a simple "search all marketplace products" endpoint
    // accessible to a generic read-only affiliate API key. 
    // We return empty here. The frontend will rely on manual imports or the DB cache.
    return [];
  }

  async importProduct(input: AffiliateProductImport, credentials: Record<string, string>): Promise<AffiliateOffer> {
    // Normalizes a product based on user manual input
    return {
      id: input.productId,
      networkId: this.networkId,
      networkDisplayName: this.displayName,
      productName: input.productName,
      description: "Imported product",
      commission: "TBD",
      trackingUrl: input.promolink || `https://www.checkout-ds24.com/redir/${input.productId}/${credentials.affiliateId || ""}`
    };
  }

  async generateTrackingLink(input: TrackingLinkInput, credentials: Record<string, string>): Promise<TrackingLinkResult> {
    const affiliateId = credentials.affiliateId;
    if (!affiliateId) {
      throw new Error("Missing affiliateId for Digistore24");
    }
    
    // Generate an idempotent campaign key: oct-{workspaceId}-{campaignId}-{channel}
    // For safety, we hash or sanitize it. Max length for Digistore CAMPAIGNKEY is usually around 50 chars.
    let campaignKey = `oct`;
    if (input.channel) campaignKey += `-${input.channel.substring(0, 10).toLowerCase()}`;
    if (input.campaignId) campaignKey += `-${input.campaignId.substring(0, 8)}`;
    
    // Clean up to URL-safe characters
    campaignKey = campaignKey.replace(/[^a-z0-9-]/g, "");

    const trackingUrl = `https://www.checkout-ds24.com/redir/${input.productId}/${affiliateId}/${campaignKey}`;

    return {
      trackingUrl,
      campaignKey
    };
  }

  async validateTrackingLink(url: string, credentials: Record<string, string>): Promise<TrackingLinkValidation> {
    try {
      const parsed = new URL(url);
      
      if (!parsed.hostname.includes("digistore24.com") && !parsed.hostname.includes("checkout-ds24.com")) {
        return { isValid: false, partnershipStatus: "unknown" };
      }

      // Format: /redir/{PRODUCT_ID}/{AFFILIATE_ID}/{CAMPAIGN_KEY}
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] !== "redir" || parts.length < 3) {
        return { isValid: false, partnershipStatus: "unknown" };
      }

      const productId = parts[1];
      const affiliateId = parts[2];
      const campaignKey = parts[3] || undefined;

      return {
        isValid: true,
        productId,
        affiliateId,
        campaignKey,
        // A valid link syntax does not prove provider acceptance!
        partnershipStatus: "unknown" 
      };
    } catch (e) {
      return { isValid: false, partnershipStatus: "unknown" };
    }
  }
}
