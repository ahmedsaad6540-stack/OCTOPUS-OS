import { test, expect } from '@playwright/test';

test.describe('YouTube OAuth Flow', () => {
  test('unauthenticated connect rejected', async ({ request }) => {
    const response = await request.post('/api/integrations/youtube/connect');
    expect(response.status()).toBe(401);
  });

  test('authorization URL returned for authenticated user', async ({ request }) => {
    // Note: We need a valid JWT token. For E2E we usually mock auth or use a test token.
    // In this suite we just ensure the route exists and expects auth.
    // A fully functional test would require seeding a test user and token.
    test.skip();
  });
  
  test('safe status response', async ({ request }) => {
    const response = await request.get('/api/integrations/youtube/status');
    expect(response.status()).toBe(401); // Without token it's 401
  });
});
