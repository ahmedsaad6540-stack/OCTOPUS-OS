import { test, expect } from '@playwright/test';

test.describe('Operational Proof Gate: Dogfooding Journey', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Registration / Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dogfooding@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL('/');
  });

  test('Full dogfooding journey', async ({ page }) => {
    // 2. Provider configuration & 3. Network connection
    await page.click('text=Affiliate Networks');
    await expect(page).toHaveURL(/.*\/affiliates/);
    await page.fill('input[placeholder*="Enter API Key"]', 'manual-secret-key-456');
    await page.click('button:has-text("Manual Save")');
    await expect(page.locator('text=o. Credentials saved securely')).toBeVisible();

    // 4. Product import
    await page.click('button:has-text("Manual Import")');
    await page.fill('input[placeholder="e.g. Meticore"]', 'Dogfooding Product');
    await page.fill('input[placeholder="e.g. 12345"]', '9999');
    await page.fill('input[placeholder*="checkout-ds24.com"]', 'https://www.checkout-ds24.com/redir/9999/test');
    
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Import Product")');
    await expect(page.locator('text=Dogfooding Product')).toBeVisible();

    // 5. Autonomous AI video script generation
    await page.click('button:has-text("Promote with AI")');
    await expect(page).toHaveURL(/.*\/campaigns\?draft=1/);
    await expect(page.locator('input[name="name"]')).toHaveValue('Dogfooding Product', { timeout: 10000 });
    await page.click('button:has-text("Create Campaign")');
    await expect(page.locator('text=Dogfooding Product')).toBeVisible();

    // Go to Video Factory to trigger render
    await page.click('text=Video Factory');
    await expect(page).toHaveURL(/.*\/video-factory/);

    // Trigger video generation
    await page.fill('input[placeholder*="Health and Wellness"]', 'Dogfooding Product');
    await page.click('button:has-text("Launch Real Production Batch")');

    // 6. Render triggering & 7. Job completion polling
    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 15000 });
    // Wait for completion (the table should update to show status done)
    await expect(page.locator('text=done').first()).toBeVisible({ timeout: 30000 });

    // 8. Video playback or file verification
    // There should be a video tag or a link to the video if we click the job row or it shows up
    // Wait for the download button
    const downloadButton = page.locator('button:has-text("Download Production Manifest")').first();
    await expect(downloadButton).toBeVisible();
    
    // Test passes!
  });
});
