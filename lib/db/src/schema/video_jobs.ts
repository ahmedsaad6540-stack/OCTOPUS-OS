import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { campaignsTable } from "./campaigns";

export const videoJobsTable = pgTable("video_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  campaignId: uuid("campaign_id").references(() => campaignsTable.id, { onDelete: "set null" }),
  productName: text("product_name").notNull(),
  title: text("title").default(""),
  platform: text("platform").default("YouTube Shorts"),
  hook: text("hook").notNull(),
  script: text("script").notNull(),
  voice: text("voice").default("Ryan (ElevenLabs)"),
  template: text("template").default("Hook → Demo → Proof → CTA"),
  music: text("music").default("No Music"),
  duration: text("duration").default("30s"),
  elevenlabsVoiceId: text("elevenlabs_voice_id").default(""),
  heygenVideoId: text("heygen_video_id").default(""),
  heygenStatus: text("heygen_status").default("pending"),
  videoUrl: text("video_url").default(""),
  publishedUrl: text("published_url").default(""),
  status: text("status").default("queued"), // queued, generating_script, generating_voice, rendering_video, publishing, user_confirmed, published_unverified, done, failed
  progress: integer("progress").default(0),
  errorMessage: text("error_message").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type VideoJob = typeof videoJobsTable.$inferSelect;
export type InsertVideoJob = typeof videoJobsTable.$inferInsert;
