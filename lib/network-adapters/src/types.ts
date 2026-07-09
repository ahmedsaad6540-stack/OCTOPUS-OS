export interface AffiliateProduct {
  id: string;
  name: string;
  affiliateNetwork: string;
  commissionRate: number;
  epc: number;
  productUrl: string;
  niche: string;
  description?: string;
  gravity?: number;
  avgSale?: number;
}

export interface AffiliateNetworkAdapter {
  readonly name: string;
  fetchProducts(niche: string, options?: FetchOptions): Promise<AffiliateProduct[]>;
  validateApiKey?(): Promise<boolean>;
}

export interface FetchOptions {
  limit?: number;
  minCommission?: number;
  sortBy?: 'epc' | 'commission' | 'gravity';
}
