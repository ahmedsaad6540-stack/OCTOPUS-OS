import fs from "fs";
import path from "path";

function walkDir(dir: string, callback: (filePath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      if (f !== "node_modules" && f !== ".git" && f !== ".next" && f !== "dist") {
        walkDir(dirPath, callback);
      }
    } else {
      callback(dirPath);
    }
  });
}

console.log("Searching for registerHandler in codebase...");
walkDir("d:\\OCTOPUS_OS_FINAL\\final_snapshot", (filePath) => {
  if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
    const content = fs.readFileSync(filePath, "utf8");
    if (content.includes("registerHandler")) {
      console.log(`Found in: ${filePath}`);
    }
  }
});
console.log("Done.");
