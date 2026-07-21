import { test, expect } from '@playwright/test';

test.describe('Operational Proof Gate: Dogfooding Journey', () => {
  test.setTimeout(180000); // 3 minutes for video generation
  let testEmail: string;

  test.beforeEach(async ({ page, context, request }) => {
    testEmail = `dogfooding-${Date.now()}@example.com`;
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err));
    // Force English language to avoid translation-based selector failures
    await context.addInitScript(() => {
      localStorage.setItem('octopus_language', 'en');
      localStorage.setItem('octopus_theme', 'dark');
    });
    
    // 1. Setup Phase & Environment configuration
    // Use the backend API directly to create the test user to bypass manual registration UI
    await request.post('http://localhost:5002/api/auth/register', {
      data: { name: 'Test User', email: testEmail, password: 'password123' }
    });

    await page.goto('http://localhost:8081/login');
    // Ensure we are on the login form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=OCTOPUS').first()).toBeVisible({ timeout: 10000 });
  });

  test('Full dogfooding journey', async ({ page }) => {
    // 2. Provider configuration & 3. Network connection
    await page.locator('button', { hasText: '💰' }).click();
    await expect(page).toHaveURL(/.*\/affiliates/);
    await page.fill('input[placeholder*="Enter API Key"]', 'manual-secret-key-456');
    await page.fill('input[placeholder*="Enter Affiliate ID"]', 'my-affiliate-id-123');
    await page.locator('button', { hasText: 'Manual Save' }).click();
    await expect(page.locator('text=Credentials saved securely')).toBeVisible();
    
    // 4. Product import
    await page.locator('button', { hasText: '📥' }).click();
    await page.fill('input[placeholder="e.g. Meticore"]', 'Dogfooding Product');
    await page.fill('input[placeholder="e.g. 12345"]', '9999');
    await page.fill('input[placeholder*="checkout-ds24.com"]', 'https://www.checkout-ds24.com/redir/9999/test');
    
    page.on('dialog', dialog => dialog.accept());
    await page.locator('button.bg-blue-600').click();
    await expect(page.locator('text=Dogfooding Product')).toBeVisible();

    // 5. Autonomous AI video script generation
    await page.locator('button.from-emerald-600').click();
    await expect(page).toHaveURL(/.*\/campaigns/);
    await expect(page.locator('input[placeholder="Campaign Name"]')).toHaveValue('Dogfooding Product', { timeout: 10000 });
    await page.locator('button[type="submit"]').click();
    await expect(page.locator('text=Dogfooding Product')).toBeVisible();

    // Go to Video Factory to trigger render
    await page.locator('button', { hasText: '🎬' }).click();
    await expect(page).toHaveURL(/.*\/video-factory/);

    // Trigger video generation
    await page.fill('input[placeholder*="Genius Wave"]', 'Dogfooding Product');
    await page.locator('button', { hasText: 'Batch' }).click();

    // 6. Render triggering & 7. Job completion polling
    await expect(page.locator('text=Generating').first()).toBeVisible({ timeout: 15000 });
    // Wait for completion (the table should update to show status done)
    await expect(page.locator('text=Rendered & Ready').first()).toBeVisible({ timeout: 120000 });

    // 8. Video playback or file verification
    // There should be a video tag or a link to the video if we click the job row or it shows up
    // Wait for the download button
    const downloadButton = page.getByRole('button', { name: /Download Production Manifest/i }).first();
    await expect(downloadButton).toBeVisible({ timeout: 15000 });
    
    // Test passes!
  });
});
