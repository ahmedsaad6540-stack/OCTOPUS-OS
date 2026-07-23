import { pgTable, text, timestamp, uuid, index, unique, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const affiliateConnectionsTable = pgTable(
  "affiliate_connections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // digistore24, impact, amazon, etc.
    affiliateId: text("affiliate_id").default(""), // Non-secret identifier
    encryptedSecretEnvelope: text("encrypted_secret_envelope"), // The AES-256-GCM envelope string (JSON)
    credentialStatus: text("credential_status").notNull().default("not_configured"), // not_configured, configured, unverified, verified, invalid
    permissions: text("permissions").default("read_only"), // read_only, full_access
    capabilities: jsonb("capabilities").default({}), // e.g. { apiCatalog: false, manualProductImport: true, ... }
    lastVerifiedAt: timestamp("last_verified_at"),
    lastErrorCode: text("last_error_code"),
    status: text("status").notNull().default("active"), // active, revoked
    connectionSource: text("connection_source").default("mock"), // real_oauth, real_api_key, manual, mock
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    revokedAt: timestamp("revoked_at"),
  },
  (t) => [
    unique("ac_user_provider_idx").on(t.userId, t.provider)
  ]
);

export const affiliateProductsTable = pgTable(
  "affiliate_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    externalProductId: text("external_product_id").notNull(),
    name: text("name").notNull(),
    catalogSource: text("catalog_source").notNull(), // official_api, manual_product_import, manual_promolink_import
    promolink: text("promolink"),
    partnershipStatus: text("partnership_status").notNull().default("unknown"), // unknown, user_declared_approved, provider_verified, pending, rejected
    commissionValue: text("commission_value"),
    commissionType: text("commission_type"),
    commissionVerification: text("commission_verification").default("unverified"), // user_supplied, provider_verified
    rawMetadata: jsonb("raw_metadata").default({}), // Must NEVER contain secrets
    isActive: text("is_active").default("true"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    unique("ap_user_provider_product_idx").on(t.userId, t.provider, t.externalProductId)
  ]
);

export const affiliateTrackingLinksTable = pgTable(
  "affiliate_tracking_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    affiliateProductId: uuid("affiliate_product_id")
      .notNull()
      .references(() => affiliateProductsTable.id, { onDelete: "cascade" }),
    campaignId: uuid("campaign_id"), // Optional: populated once the campaign is fully created
    provider: text("provider").notNull(),
    basePromolink: text("base_promolink").notNull(),
    generatedUrl: text("generated_url").notNull(),
    campaignKey: text("campaign_key").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    lastValidatedAt: timestamp("last_validated_at"),
  },
  (t) => [
    index("atl_user_product_idx").on(t.userId, t.affiliateProductId),
    unique("atl_generated_url_idx").on(t.generatedUrl)
  ]
);

export const affiliateCampaignDraftsTable = pgTable(
  "affiliate_campaign_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    affiliateProductId: uuid("affiliate_product_id")
      .notNull()
      .references(() => affiliateProductsTable.id, { onDelete: "cascade" }),
    trackingLinkId: uuid("tracking_link_id")
      .notNull()
      .references(() => affiliateTrackingLinksTable.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    draftPayload: jsonb("draft_payload").notNull().default({}),
    status: text("status").notNull().default("active"),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  }
);
