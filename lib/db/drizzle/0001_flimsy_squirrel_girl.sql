CREATE TABLE "affiliate_campaign_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"affiliate_product_id" uuid NOT NULL,
	"tracking_link_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"draft_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "affiliate_campaign_drafts" ADD CONSTRAINT "affiliate_campaign_drafts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_campaign_drafts" ADD CONSTRAINT "affiliate_campaign_drafts_affiliate_product_id_affiliate_products_id_fk" FOREIGN KEY ("affiliate_product_id") REFERENCES "public"."affiliate_products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_campaign_drafts" ADD CONSTRAINT "affiliate_campaign_drafts_tracking_link_id_affiliate_tracking_links_id_fk" FOREIGN KEY ("tracking_link_id") REFERENCES "public"."affiliate_tracking_links"("id") ON DELETE cascade ON UPDATE no action;