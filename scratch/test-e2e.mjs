async function run() {
  console.log("1. Logging in as admin@octopus.ai...");
  const loginRes = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@octopus.ai", password: "octopus123" })
  });
  const loginData = await loginRes.json();
  console.log("Login status:", loginRes.status);
  console.log("Login response:", loginData);

  const token = loginData.token;
  if (!token) {
    console.error("Failed to get token!");
    process.exit(1);
  }

  console.log("\n2. Checking GET /api/system-status/live...");
  const statusRes = await fetch("http://localhost:5000/api/system-status/live", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const statusData = await statusRes.json();
  console.log("Live status:", JSON.stringify(statusData, null, 2));

  console.log("\n3. Testing POST /api/production/generate-video-batch...");
  const genRes = await fetch("http://localhost:5000/api/production/generate-video-batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      productName: "OCTOPUS AI Content Writer",
      category: "SaaS",
      videoCount: 1,
      targetPlatform: "tiktok",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
      avatarId: "josh_lite3_20230714"
    })
  });
  const genData = await genRes.json();
  console.log("Generate status:", genRes.status);
  console.log("Generate response:", JSON.stringify(genData, null, 2));
}

run().catch(console.error);
