async function runReport() {
  console.log("======================================================");
  console.log("   OCTOPUS NEXUS OS — END-TO-END PRODUCTION TEST      ");
  console.log("======================================================");

  // 1. Login
  console.log("\n[Step 0] Authenticating as admin@octopus.ai...");
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@octopus.ai", password: "octopus123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) {
    console.error("Authentication failed:", loginData);
    process.exit(1);
  }
  console.log("-> Authenticated successfully. Token obtained.");

  // Check existing campaigns
  console.log("\n[Step 0.1] Checking existing campaigns via GET /api/campaigns...");
  const campRes = await fetch("http://localhost:5000/api/campaigns", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const campData = await campRes.json();
  const campaigns = campData.campaigns || [];
  console.log(`-> Found ${campaigns.length} campaigns in database.`);
  let testCampaign = campaigns[0];
  console.log("-> Using Campaign ID:", testCampaign?.id, "Name:", testCampaign?.name);

  // 1 & 2. Click Generate Videos from UI / Request arrived at API
  console.log("\n======================================================");
  console.log("1- الضغط على زر Generate Videos من الواجهة / 2- الطلب الذي وصل إلى API");
  console.log("======================================================");
  const generatePayload = {
    productName: testCampaign?.name || "OCTOPUS AI Content Writer",
    category: "SaaS",
    videoCount: 1,
    targetPlatform: "tiktok",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    avatarId: "josh_lite3_20230714"
  };
  console.log("POST /api/production/generate-video-batch payload:", JSON.stringify(generatePayload, null, 2));

  const startGenTime = Date.now();
  const genRes = await fetch("http://localhost:5000/api/production/generate-video-batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(generatePayload)
  });
  const genData = await genRes.json();
  console.log(`HTTP Status: ${genRes.status} (${Date.now() - startGenTime}ms)`);
  console.log("API Response:", JSON.stringify(genData, null, 2));

  // 3. Job ID
  console.log("\n======================================================");
  console.log("3- Job ID");
  console.log("======================================================");
  const jobs = genData.jobs || [];
  const firstJob = jobs[0];
  console.log("Generated Job ID:", firstJob?.id || "N/A");
  console.log("HeyGen Video ID:", firstJob?.heygenVideoId || "N/A");

  // 4 & 5. PostgreSQL Record & HeyGen Status (via GET /api/production/jobs)
  console.log("\n======================================================");
  console.log("4- سجل PostgreSQL بعد إنشاء الـ Job / 5- استجابة HeyGen الحقيقية");
  console.log("======================================================");
  const jobsRes = await fetch("http://localhost:5000/api/production/jobs", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const jobsData = await jobsRes.json();
  const foundJobInDb = (jobsData.jobs || []).find(j => j.id === firstJob?.id) || jobsData.jobs?.[0];
  console.log("GET /api/production/jobs Response (Postgres Row + Active HeyGen Poll):", JSON.stringify(foundJobInDb, null, 2));

  // 6, 7, 8, 9, 10. Testing POST /api/production/launch-campaign/:id (End-to-End Pipeline)
  console.log("\n======================================================");
  console.log("6- رابط MP4 / 7- رفع على YouTube / 8- Video ID / 9- الرابط العام / 10- تحديث campaignsTable");
  console.log("Testing POST /api/production/launch-campaign/:id (End-to-End Pipeline)");
  console.log("======================================================");
  if (testCampaign?.id) {
    const launchRes = await fetch(`http://localhost:5000/api/production/launch-campaign/${testCampaign.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    });
    const launchData = await launchRes.json();
    console.log("Launch Campaign HTTP Status:", launchRes.status);
    console.log("Launch Campaign Response:", JSON.stringify(launchData, null, 2));

    const allCampsRes = await fetch("http://localhost:5000/api/campaigns", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const allCampsData = await allCampsRes.json();
    const updatedCamp = (allCampsData.campaigns || []).find(c => c.id === testCampaign.id);
    console.log("Updated Campaign Table Row (`campaignsTable`):", JSON.stringify(updatedCamp, null, 2));
  }

  // 11. Production Logs Table
  console.log("\n======================================================");
  console.log("11- السجلات الموجودة في productionLogsTable");
  console.log("======================================================");
  const logsRes = await fetch("http://localhost:5000/api/production/logs", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const logsData = await logsRes.json();
  console.log("Production Logs (`productionLogsTable` rows - top 5):", JSON.stringify((logsData.logs || []).slice(0, 5), null, 2));

  console.log("\n======================================================");
  console.log("REPORT COMPLETED.");
  console.log("======================================================");
}

runReport().catch(console.error);
