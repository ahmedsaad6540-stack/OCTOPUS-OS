import { db } from "@workspace/db";
import { billingSubscriptionsTable, usageLimitsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

export class BillingEngine {
  private getCurrentMonthYear(): string {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  async getUsageRecord(userId: string) {
    const monthYear = this.getCurrentMonthYear();
    const records = await db
      .select()
      .from(usageLimitsTable)
      .where(and(eq(usageLimitsTable.userId, userId), eq(usageLimitsTable.monthYear, monthYear)));

    if (records.length > 0) {
      return records[0];
    }

    // Determine limits based on subscription
    const subs = await db
      .select()
      .from(billingSubscriptionsTable)
      .where(eq(billingSubscriptionsTable.userId, userId));
    
    let aiTokensLimit = 100000;
    let videoMinutesLimit = 10;
    let campaignsLimit = 3;

    if (subs.length > 0 && subs[0].status === "active") {
      if (subs[0].plan === "pro") {
        aiTokensLimit = 1000000;
        videoMinutesLimit = 60;
        campaignsLimit = 10;
      } else if (subs[0].plan === "agency") {
        aiTokensLimit = 5000000;
        videoMinutesLimit = 300;
        campaignsLimit = 50;
      }
    }

    // Create default record for the month
    const [newRecord] = await db
      .insert(usageLimitsTable)
      .values({
        id: crypto.randomUUID(),
        userId,
        monthYear,
        aiTokensLimit,
        videoMinutesLimit,
        campaignsLimit
      })
      .returning();
      
    return newRecord;
  }

  async checkTokens(userId: string, requestedTokens: number): Promise<boolean> {
    const usage = await this.getUsageRecord(userId);
    return usage.aiTokensUsed + requestedTokens <= usage.aiTokensLimit;
  }

  async consumeTokens(userId: string, amount: number) {
    const monthYear = this.getCurrentMonthYear();
    const usage = await this.getUsageRecord(userId);
    await db
      .update(usageLimitsTable)
      .set({ aiTokensUsed: usage.aiTokensUsed + amount })
      .where(eq(usageLimitsTable.id, usage.id));
  }

  async checkVideoMinutes(userId: string, minutes: number): Promise<boolean> {
    const usage = await this.getUsageRecord(userId);
    return usage.videoMinutesUsed + minutes <= usage.videoMinutesLimit;
  }

  async consumeVideoMinutes(userId: string, amount: number) {
    const usage = await this.getUsageRecord(userId);
    await db
      .update(usageLimitsTable)
      .set({ videoMinutesUsed: usage.videoMinutesUsed + amount })
      .where(eq(usageLimitsTable.id, usage.id));
  }
}

export const billingEngine = new BillingEngine();
