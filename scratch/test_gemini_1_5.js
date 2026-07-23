const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const GEMINI_MODEL = "gemini-2.0-flash-lite-001";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function run() {
  const payload = {
    contents: [
      { role: "user", parts: [{ text: "Hello" }] }
    ]
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

run();
