import { createOAuthState, validateOAuthState, consumeOAuthState, oauthStates } from "../artifacts/api-server/src/lib/oauth-state.js";

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  console.log("Running YouTube OAuth State Tests...");

  // 1. Generate state
  const state = createOAuthState("user-123");
  assert(typeof state === "string" && state.length === 64, "random state is generated");

  // 2. Validate state
  const isValid = validateOAuthState(state, "user-123");
  assert(isValid, "valid state is accepted");

  // 3. One-time usage (should fail second time)
  const isReusedValid = validateOAuthState(state, "user-123");
  assert(!isReusedValid, "reused state is rejected");

  // 4. Cross-workspace / wrong user
  const state2 = createOAuthState("user-123");
  const isWrongUserValid = validateOAuthState(state2, "user-456");
  assert(!isWrongUserValid, "cross-workspace state is rejected");

  // 5. Expired state
  const state3 = createOAuthState("user-123");
  const stored = oauthStates.get(state3);
  if (stored) {
    stored.expiresAt = Date.now() - 1000; // Force expiration
  }
  const isExpiredValid = validateOAuthState(state3, "user-123");
  assert(!isExpiredValid, "expired state is rejected");

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests();
