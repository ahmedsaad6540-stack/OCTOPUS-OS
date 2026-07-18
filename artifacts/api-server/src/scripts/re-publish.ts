import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { YouTubePublisher } from "@workspace/social-publisher";
import { db } from "@workspace/db";
import { videoJobsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

async function run() {
  console.log("====================================================================");
  console.log("🐙 RE-PUBLISHING SECOND REAL AD WITH REFRESHED YOUTUBE TOKEN...");
  console.log("====================================================================");

  const yt = new YouTubePublisher();
  const videoUrl = "https://files2.heygen.ai/aws_pacific/avatar_tmp/56ccec96d282407e97c3efc73ad772b0/e648b7d572a9426388535069d2db4498.mp4?Expires=1784854040&Signature=a8bNvpNlb41glQ0uzGgxWYxO0DVtDqrO2Sk1PFFzDtYHXY5pOjfRg9PBdDtoPBSwdsQ5S4dz8Jef48DVoTmRgCOo6hQeMaEvQ5r6Yy5WdVVJNfDbNv9paTGsAfucdZI3bFW-HUVk08mv8LPlb8TqR-D5lg4YnYQWWDAcjrBfo--Tpzoc1RMyCUBt5wn5dCfE-UQ7QfFmS-NdCwMqq6i2JS1rhgzQBAHD122PbY2pvD9BFwjsTbv6-OSCcoT70zG67kLIgU0XvrOs1DLPA-iwXqXXUqG8vG9X65p71AD4aukWo18yK7PVMyni6DeILdIETAhhmihyr3Znn~7Z9CObuQ__&Key-Pair-Id=K38HBHX5LX3X2H";

  const res = await yt.publish({
    title: "The 7-Second Brainwave Secret To Wealth #shorts #mindset #success",
    description: `Did you know that top performers and scientists use a simple 7 second daily ritual to unlock extraordinary focus, wealth, and energy almost on command? Thousands of everyday people are already using this breakthrough audio frequency to activate their hidden potential instantly. Don't get left behind. Check the direct link in the comments and description right now to unlock your breakthrough today!\n\n👉 GET IT RIGHT NOW: https://www.digistore24.com/redir/660957/octopuslabai4418/\n\n#shorts #mindset #success #wealth #breakthrough`,
    tags: ["shorts", "mindset", "success", "wealth", "breakthrough", "genius"],
    privacyStatus: "public",
    videoUrl
  });

  if (res.status === "completed" && res.platformVideoUrl) {
    console.log("\n🎉====================================================================");
    console.log(`🚀 YOUTUBE SHORT PUBLISHED LIVE TO YOUR CHANNEL!`);
    console.log(`📺 Watch URL: ${res.platformVideoUrl}`);
    console.log("====================================================================🎉");

    // Update DB
    await db.update(videoJobsTable)
      .set({ publishedUrl: res.platformVideoUrl, status: "completed" })
      .where(eq(videoJobsTable.id, "f52e75c7-6fb8-4ab2-8510-a3fe8c8e2ed0"));
  } else {
    console.error("Publish failed:", res.error);
  }
}

run().catch(console.error);
