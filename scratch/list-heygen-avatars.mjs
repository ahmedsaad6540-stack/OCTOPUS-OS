import "dotenv/config";

async function listAvatars() {
  const apiKey = process.env.HEYGEN_API_KEY;
  console.log("Fetching available HeyGen avatars for space...");
  const response = await fetch("https://api.heygen.com/v2/avatars", {
    headers: { "X-Api-Key": apiKey || "" }
  });

  if (!response.ok) {
    console.error("Failed to list avatars:", response.status, await response.text());
    return;
  }

  const data = await response.json();
  const avatars = data?.data?.avatars || [];
  console.log(`Found ${avatars.length} avatars available to your account! Showing top 10:`);
  for (const av of avatars.slice(0, 10)) {
    console.log(` - Avatar ID: "${av.avatar_id}" | Name: "${av.avatar_name || av.name || "Unnamed"}" | Gender: ${av.gender || "N/A"}`);
  }
}

listAvatars().catch(console.error);
