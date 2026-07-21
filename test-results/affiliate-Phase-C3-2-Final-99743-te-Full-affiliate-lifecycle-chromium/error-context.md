# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: affiliate.spec.ts >> Phase C3.2 Final Pre-Live Gate >> Full affiliate lifecycle
- Location: e2e\affiliate.spec.ts:13:7

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Phase C3.2 Final Pre-Live Gate', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Navigate to login
  6  |     await page.goto('/login');
> 7  |     await page.fill('input[type="email"]', 'restart@example.com');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  8  |     await page.fill('input[type="password"]', 'password123');
  9  |     await page.click('button:has-text("Sign In")');
  10 |     await expect(page).toHaveURL('/');
  11 |   });
  12 | 
  13 |   test('Full affiliate lifecycle', async ({ page, context }) => {
  14 |     // 1. Navigate to Affiliate Networks
  15 |     await page.click('text=Affiliate Networks');
  16 |     await expect(page).toHaveURL(/.*\/affiliates/);
  17 | 
  18 |     // 2. Interactive Authorization using a provider boundary mock
  19 |     await page.click('button:has-text("Connect securely with Digistore24")');
  20 |     // It should navigate to Digistore request URL, we assume we intercept it or our mock API returns our local callback
  21 |     // Wait, the API returns redirectUrl. We can mock the network if needed.
  22 |     // If the backend returns `http://localhost:5173/affiliates/callback`, Playwright will follow.
  23 |     await expect(page).toHaveURL(/.*\/affiliates\/callback/);
  24 |     await expect(page.locator('text=Authorization successful')).toBeVisible({ timeout: 10000 });
  25 |     await expect(page).toHaveURL(/.*\/affiliates/);
  26 | 
  27 |     // 3. Manual fallback & Credential field clearing & No stored secret redisplay
  28 |     await page.fill('input[placeholder*="Enter API Key"]', 'manual-secret-key-456');
  29 |     await page.click('button:has-text("Manual Save")');
  30 |     await expect(page.locator('text=✅ Credentials saved securely')).toBeVisible();
  31 |     await expect(page.locator('input[placeholder*="(Set)"]')).toBeVisible(); // No stored secret redisplay
  32 |     
  33 |     // Verify field cleared
  34 |     const val = await page.inputValue('input[placeholder*="(Set)"]');
  35 |     expect(val).toBe('');
  36 | 
  37 |     // 4. Product Import & Promolink import
  38 |     await page.click('button:has-text("Manual Import")');
  39 |     await page.fill('input[placeholder="e.g. Meticore"]', 'E2E Test Product');
  40 |     await page.fill('input[placeholder="e.g. 12345"]', '8888');
  41 |     await page.fill('input[placeholder*="checkout-ds24.com"]', 'https://www.checkout-ds24.com/redir/8888/test');
  42 |     
  43 |     page.on('dialog', dialog => dialog.accept());
  44 |     await page.click('button:has-text("Import Product")');
  45 |     await expect(page.locator('text=E2E Test Product')).toBeVisible();
  46 | 
  47 |     // 5. Idempotent tracking-link creation & Persistent campaign draft creation
  48 |     await page.click('button:has-text("Promote with AI")');
  49 |     
  50 |     // 6. Campaign form server-side hydration
  51 |     await expect(page).toHaveURL(/.*\/campaigns\?draft=1/);
  52 |     await expect(page.locator('input[name="name"]')).toHaveValue('E2E Test Product', { timeout: 10000 });
  53 |     await expect(page.locator('input[name="productUrl"]')).toHaveValue(/.*checkout-ds24\.com.*/);
  54 | 
  55 |     // 7. Campaign creation
  56 |     await page.click('button:has-text("Create Campaign")');
  57 |     await expect(page.locator('text=E2E Test Product')).toBeVisible();
  58 | 
  59 |     // 8. Full browser reload
  60 |     await page.reload();
  61 |     await expect(page.locator('text=E2E Test Product')).toBeVisible();
  62 | 
  63 |     // 9. API process restart & persistence after restart
  64 |     // This part is hard to do pure E2E without executing shell commands from inside playwright. 
  65 |     // We already have `test-api-restart.ts` testing the backend restart. 
  66 |     // Here we can just verify the data persists across reloads.
  67 |     
  68 |     // 10. Connection disconnect
  69 |     await page.click('text=Affiliate Networks');
  70 |     await page.click('button:has-text("Revoke Connection")');
  71 |     await expect(page.locator('text=✅ Connection revoked successfully')).toBeVisible();
  72 | 
  73 |     // 11. Provider actions disabled after revocation
  74 |     // After revoke, it should say "Not Configured"
  75 |     await expect(page.locator('text=Not Configured').first()).toBeVisible();
  76 |     
  77 |     // Test Cross-workspace access rejection (We can create another context, login as a different user, and try fetching the draft ID)
  78 |     const draftIdStr = await page.evaluate(() => sessionStorage.getItem('campaign_draft_id'));
  79 |     if (draftIdStr) {
  80 |       const newContext = await context.browser()?.newContext()!;
  81 |       const page2 = await newContext.newPage();
  82 |       await page2.goto('/login');
  83 |       // Assume a second test user
  84 |       await page2.fill('input[type="email"]', 'cross@example.com');
  85 |       await page2.fill('input[type="password"]', 'password123');
  86 |       await page2.click('button:has-text("Sign In")');
  87 |       await page2.goto(`/campaigns?draft=1`);
  88 |       
  89 |       // Setup session storage in second browser
  90 |       await page2.evaluate((id) => sessionStorage.setItem('campaign_draft_id', id), draftIdStr);
  91 |       await page2.reload();
  92 |       
  93 |       // Should reject fetching draft and show empty form
  94 |       await expect(page2.locator('input[name="name"]')).toHaveValue('');
  95 |       await newContext.close();
  96 |     }
  97 |   });
  98 | });
  99 | 
```