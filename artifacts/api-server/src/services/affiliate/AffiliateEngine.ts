import { db } from "@workspace/db";
import { SecretsManager } from "../../lib/secrets-manager.js";
import { affiliateConnectionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { AffiliateProvider, AffiliateOffer } from "./AffiliateProvider.js";
import { DigistoreProvider } from "./providers/DigistoreProvider.js";
import { ImpactProvider } from "./providers/ImpactProvider.js";
import { AmazonAssociatesProvider } from "./providers/AmazonAssociatesProvider.js";
import { ClickBankProvider } from "./providers/ClickBankProvider.js";
import { ManualAffiliateProvider } from "./providers/ManualAffiliateProvider.js";

export class AffiliateEngine {
  private providers: Map<string, AffiliateProvider> = new Map();

  constructor() {
    this.registerProvider(new DigistoreProvider());
    this.registerProvider(new ImpactProvider());
    this.registerProvider(new AmazonAssociatesProvider());
    this.registerProvider(new ClickBankProvider());
    this.registerProvider(new ManualAffiliateProvider());
  }

  private registerProvider(provider: AffiliateProvider) {
    this.providers.set(provider.networkId, provider);
  }

  /**
   * Returns a unified catalog of products from all *connected* affiliate networks for the given user.
   */
  async getCatalog(userId: string, query: string = ""): Promise<AffiliateOffer[]> {
    // 1. Fetch connected networks from DB
    const connectedNetworks = await db
      .select()
      .from(affiliateConnectionsTable)
      .where(eq(affiliateConnectionsTable.userId, userId));

    const activeNetworks = connectedNetworks.filter((n: any) => n.status === "active" || n.status === "connected");

    if (activeNetworks.length === 0) {
      return []; // No connected networks
    }

    // 2. Fetch products from each connected network in parallel
    const promises = activeNetworks.map(async (networkRow: any) => {
      // The DB schema currently uses provider
      const providerId = (networkRow as any).provider ?? "";
      const provider = this.providers.get(providerId);
      
      if (!provider) {
        return [];
      }

      // Decrypt credentials
      const sm = SecretsManager.instance();
      let secretData = "";
      if (networkRow.encryptedSecretEnvelope) {
        secretData = sm.decrypt(networkRow.encryptedSecretEnvelope) || "";
      }

      // Map db fields to a generic credentials object
      const credentials: Record<string, string> = {
        apiKey: secretData,
        secretKey: secretData,
        affiliateId: networkRow.affiliateId ?? "",
        // Legacy mappings just in case provider needs them
        accountSid: networkRow.affiliateId ?? "",
        authToken: secretData,
      };

      try {
        return await provider.searchProducts(query, credentials);
      } catch (err) {
        console.error(`Error fetching products from ${providerId}:`, err);
        return [];
      }
    });

    const results = await Promise.all(promises);
    return results.flat(); // Flatten all arrays into one unified catalog
  }

  async getProvider(networkId: string): Promise<AffiliateProvider | undefined> {
    return this.providers.get(networkId);
  }
}

export const affiliateEngine = new AffiliateEngine();
