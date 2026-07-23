import fs from 'fs';
import path from 'path';

const CANARY_STRING = "octsec_test_canary_32byte_string";
const DIRECTORIES_TO_SCAN = [
  "artifacts",
  "dist",
  "lib",
  ".system_generated",
  ".env",
  ".env.production",
  ".env.local"
];

const IGNORE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.zip', '.exe'];

let foundCount = 0;

function scanFile(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (IGNORE_EXTENSIONS.includes(ext)) return;

    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(CANARY_STRING)) {
      // It's allowed in this scan script itself
      if (filePath.includes("canary-scan.js")) return;
      console.log(`[ALERT] Canary leaked in: ${filePath}`);
      foundCount++;
    }
  } catch (err) {
    // Ignore unreadable files
  }
}

function scanDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        scanFile(fullPath);
      }
    }
  } catch (err) {
    // Ignore missing dirs
  }
}

console.log("Starting Canary Secret Scan...");
for (const dir of DIRECTORIES_TO_SCAN) {
  const fullPath = path.join(process.cwd(), dir);
  if (fs.existsSync(fullPath)) {
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirectory(fullPath);
    } else {
      scanFile(fullPath);
    }
  }
}

console.log("Scan Complete.");
if (foundCount === 0) {
  console.log("SUCCESS: Canary string was NOT leaked.");
  process.exit(0);
} else {
  console.error(`FAILURE: Canary leaked in ${foundCount} files.`);
  process.exit(1);
}
