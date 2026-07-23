import { execSync } from "child_process";
import fs from "fs";

function step(name: string, cmd: string) {
  console.log(`\n========================================================`);
  console.log(`[PREFLIGHT] ${name}`);
  console.log(`========================================================`);
  try {
    execSync(cmd, { stdio: "inherit", shell: true } as any);
    console.log(`✅ ${name} passed.`);
  } catch (err) {
    console.error(`❌ ${name} failed.`);
    process.exit(1);
  }
}

function run() {
  step("Frontend Typecheck", "pnpm --filter \"@workspace/octopus-os\" exec tsc --noEmit");
  step("Backend Typecheck", "pnpm --filter \"@workspace/api-server\" exec tsc --noEmit");
  step("Validation Runner Typecheck", "pnpm exec tsc -p scripts/tsconfig.json --noEmit");
  step("Frontend Build", "pnpm --filter \"@workspace/octopus-os\" run build");
  step("Backend Build", "pnpm --filter \"@workspace/api-server\" run build");

  console.log(`\n✅ ALL PREFLIGHT CHECKS PASSED.`);
}

run();
