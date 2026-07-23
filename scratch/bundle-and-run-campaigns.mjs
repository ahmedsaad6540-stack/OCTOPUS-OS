import { build } from "esbuild";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const entry = path.resolve(__dirname, "list-campaigns.mjs");
  const outfile = path.resolve(__dirname, "list-campaigns.bundle.mjs");

  await build({
    entryPoints: [entry],
    platform: "node",
    bundle: true,
    format: "esm",
    outfile,
    external: ["pg-native", "pg"],
  });

  console.log("Bundle created, running list-campaigns.bundle.mjs...");
  execSync(`node -r dotenv/config "${outfile}"`, { stdio: "inherit" });
}

run().catch(console.error);
