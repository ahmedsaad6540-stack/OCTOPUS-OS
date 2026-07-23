import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const productionLogsTable = pgTable("production_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => usersTable.id, { onDelete: "set null" }),
  entityType: text("entity_type").notNull(), // campaign, video_job, agent, social_post, provider
  entityId: text("entity_id").default(""),
  action: text("action").notNull(), // generate_script, generate_voice, render_video, upload_shorts, verify_health, error
  provider: text("provider").default("OCTOPUS"), // ElevenLabs, HeyGen, YouTube, TikTok, Gemini, OpenAI
  status: text("status").notNull(), // success, error, in_progress, retrying
  details: text("details").default(""),
  stack: text("stack").default(""),
  suggestedFix: text("suggested_fix").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ProductionLog = typeof productionLogsTable.$inferSelect;
export type InsertProductionLog = typeof productionLogsTable.$inferInsert;
