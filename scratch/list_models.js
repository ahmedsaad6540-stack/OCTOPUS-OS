const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`;

async function run() {
  const res = await fetch(url);
  const data = await res.json();
  console.log(data.models.map(m => m.name));
}

run();
