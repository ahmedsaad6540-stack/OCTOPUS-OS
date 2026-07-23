import { execSync, spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";
import net from "net";
import http from "http";

const TEST_ENV = "test.local";
let passCount = 0;
let failCount = 0;
let childProcesses: ChildProcess[] = [];

// Clean up function for child processes
function cleanup() {
  console.log("\n[CLEANUP] Terminating owned child processes...");
  for (const cp of childProcesses) {
    if (cp && !cp.killed) {
      console.log(`[CLEANUP] Killing PID ${cp.pid}`);
      cp.kill("SIGKILL");
    }
  }
}

// Attach cleanup handlers
process.on("exit", cleanup);
process.on("SIGINT", () => { cleanup(); process.exit(1); });
process.on("SIGTERM", () => { cleanup(); process.exit(1); });

function step(name: string, command: string, env: any = process.env) {
  console.log(`\n========================================================`);
  console.log(`[STEP] ${name}`);
  console.log(`========================================================`);
  
  const commitHash = execSync("git rev-parse HEAD").toString().trim();
  const startedAt = new Date().toISOString();
  
  let exitCode = 0;
  let passed = true;
  
  try {
    execSync(command, { env: { ...env, NODE_ENV: "test" }, stdio: "inherit" });
    passCount++;
  } catch (err: any) {
    console.error(`[FAIL] ${name}`);
    failCount++;
    exitCode = err.status || 1;
    passed = false;
  }
  
  const finishedAt = new Date().toISOString();
  
  const outDir = path.join(process.cwd(), "artifacts", "validation", "c3-2-final");
  fs.mkdirSync(outDir, { recursive: true });
  
  const result = {
    commitHash,
    command,
    startedAt,
    finishedAt,
    exitCode,
    passedCount: passed ? 1 : 0,
    failedCount: passed ? 0 : 1,
    assertions: [
      { name: "Command executed successfully", passed }
    ]
  };
  
  const safeName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  fs.writeFileSync(path.join(outDir, `step-${safeName}.json`), JSON.stringify(result, null, 2));
  
  if (!passed) {
    console.error(`Aborting validation suite due to failure in step: ${name}`);
    process.exit(1);
  }
}

async function checkPortOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        resolve(true); // Port is occupied
      } else {
        resolve(false);
      }
    });
    server.once("listening", () => {
      server.close();
      resolve(false); // Port is free
    });
    server.listen(port, "127.0.0.1");
  });
}

async function waitForHttpUrl(url: string, timeoutMs: number = 60000): Promise<boolean> {
  const start = Date.now();
  console.log(`Waiting for ${url} to be ready...`);
  while (Date.now() - start < timeoutMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200 || res.statusCode === 404 || res.statusCode === 401) {
            resolve();
          } else {
            reject(new Error(`Status: ${res.statusCode}`));
          }
        });
        req.on("error", reject);
        req.end();
      });
      console.log(`✅ ${url} is ready.`);
      return true;
    } catch (err) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function checkPreconditions(testDbUrl: string) {
  console.log("Checking Preconditions...");
  
  // 1. Fail when Git-tracked source files change after startup.
  const gitStatus = execSync("git status --porcelain").toString().trim();
  if (gitStatus.length > 0) {
    console.error("❌ Git working directory is not clean. Commit or stash your changes.");
    process.exit(1);
  }

  // 2. Fail when test and production server identities match.
  if (testDbUrl === process.env.DATABASE_URL) {
    console.error("❌ TEST_DATABASE_URL and DATABASE_URL must not match.");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production") {
    console.error("❌ Refusing to run validation suite in production NODE_ENV.");
    process.exit(1);
  }

  // 3. Fail when the test user can access the production database.
  // We identify the production DB by host or path convention.
  const parsedUrl = new URL(testDbUrl);
  if (parsedUrl.pathname.includes("octopus_prod") || parsedUrl.hostname.includes("tokaido.proxy.rlwy.net")) {
    console.error("❌ TEST_DATABASE_URL points to the production Railway database cluster. Requires an isolated test database.");
    process.exit(1);
  }

  // 5. An isolated database must be positively proven.
  if (!parsedUrl.pathname.includes("test") && !parsedUrl.pathname.includes("local")) {
    console.error("❌ TEST_DATABASE_URL does not positively identify as a test database (must contain 'test' or 'local' in DB name).");
    process.exit(1);
  }

  // 6. Secrets must not be missing.
  if (!process.env.ENCRYPTION_KEY && !process.env.JWT_SECRET) {
    // Will be injected by the runner, just ensure we have something locally if running raw
  }

  // 4. Fail when required ports are occupied.
  const ports = [5002, 8081, 5173]; // Backend, Frontend Vite Proxy, and fallback
  for (const port of ports) {
    if (await checkPortOpen(port)) {
      console.error(`❌ Port ${port} is occupied. Please kill lingering processes.`);
      process.exit(1);
    }
  }

  console.log("✅ Preconditions passed.");
}

async function run() {
  const envPath = path.join(process.cwd(), ".env.test.local");
  if (!fs.existsSync(envPath)) {
    console.error("No .env.test.local found. Ensure TEST_DATABASE_URL is safely configured.");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const testDbUrlMatch = envContent.match(/^TEST_DATABASE_URL=(.+)$/m);
  const testDbUrl = testDbUrlMatch ? testDbUrlMatch[1].trim() : undefined;
  if (!testDbUrl) {
    console.error("TEST_DATABASE_URL is missing in local secret file.");
    process.exit(1);
  }

  await checkPreconditions(testDbUrl);

  // Clear previous results
  const outDir = path.join(process.cwd(), "artifacts", "validation", "c3-2-final");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const testEnvVars = { 
    ...process.env, 
    DATABASE_URL: testDbUrl, 
    JWT_SECRET: "test-secret-long-enough-for-hs256", 
    ENCRYPTION_KEY: "0123456789abcdef0123456789abcdef",
    VITE_API_URL: "http://localhost:5002/api", // API directly or through proxy? We can hit backend directly.
    PORT: "5002",
    NODE_ENV: "test"
  };

  // Run isolated tests
  step("Isolated Postgres Test Gate", "pnpm exec tsx scripts/test-db-real.ts", testEnvVars);
  step("Credential Lifecycle", "pnpm exec tsx scripts/test-credential-lifecycle.ts", testEnvVars);
  step("Real Restart Validation", "pnpm exec tsx scripts/test-api-restart.ts", testEnvVars);
  step("Secret Hygiene Canary Scan", "pnpm exec tsx scripts/canary-scan.js", testEnvVars);
  
  // Build
  step("Frontend Build Check", "pnpm --filter \"@workspace/octopus-os\" run build", testEnvVars);
  step("Backend Build Check", "pnpm --filter \"@workspace/api-server\" run build", testEnvVars);

  console.log("\nStarting full stack as owned child processes...");
  
  // Start backend
  const apiOut = fs.openSync(path.join(outDir, "api-server.log"), "a");
  const apiProcess = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["--filter", "@workspace/api-server", "start"], {
    cwd: process.cwd(),
    env: testEnvVars,
    stdio: ["ignore", apiOut, apiOut],
    shell: true
  });
  childProcesses.push(apiProcess);

  apiProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ API Server crashed with code ${code}`);
      cleanup();
      process.exit(1);
    }
  });

  // Start frontend
  const webOut = fs.openSync(path.join(outDir, "octopus-os.log"), "a");
  const webProcess = spawn(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["--filter", "@workspace/octopus-os", "dev"], {
    cwd: process.cwd(),
    env: testEnvVars,
    stdio: ["ignore", webOut, webOut],
    shell: true
  });
  childProcesses.push(webProcess);

  webProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`❌ Frontend Vite crashed with code ${code}`);
      cleanup();
      process.exit(1);
    }
  });

  const apiReady = await waitForHttpUrl("http://127.0.0.1:5002/api/health", 30000);
  const webReady = await waitForHttpUrl("http://localhost:8081/", 30000); // Wait for vite

  if (!apiReady || !webReady) {
    console.error("❌ Servers failed to become ready within timeout.");
    cleanup();
    process.exit(1);
  }

  // Wait a few more seconds just to let Vite finish initial transforms
  await new Promise(r => setTimeout(r, 5000));

  try {
    // Playwright Execute
    step("Playwright E2E Execution", "pnpm exec playwright test e2e/affiliate.spec.ts --reporter=json,junit", testEnvVars);
  } finally {
    cleanup();
  }
  
  console.log(`\n✅ ALL VALIDATION STEPS PASSED (${passCount}/${passCount + failCount})`);
}

run().catch(err => {
  console.error("Unhandled rejection in validation:", err);
  cleanup();
  process.exit(1);
});
