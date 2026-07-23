import fs from "fs";

const logPath = "C:\\Users\\ahmed_rabie\\.gemini\\antigravity\\brain\\35fcf2a4-f179-4ceb-aaed-b51eedfcdf7f\\.system_generated\\logs\\transcript.jsonl";

try {
  const content = fs.readFileSync(logPath, "utf8");
  const lines = content.split("\n").filter(Boolean);
  
  console.log("Searching user messages for affiliate IDs...");
  for (let i = 0; i < lines.length; i++) {
    try {
      const obj = JSON.parse(lines[i]);
      if (obj.type === "USER_INPUT") {
        console.log(`[Line ${i}] User: ${obj.content}`);
      }
    } catch (err) {
      // Ignore syntax errors, just check raw text for matches
      if (lines[i].includes("USER_INPUT") || lines[i].includes("octopuslabai")) {
        console.log(`[Raw Line ${i}] contains match: ${lines[i].substring(0, 150)}...`);
      }
    }
  }
} catch (err) {
  console.error("Error reading transcript:", err);
}
