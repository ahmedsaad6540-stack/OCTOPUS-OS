import { randomBytes } from "node:crypto";

export interface OAuthState {
  userId: string;
  workspaceId?: string; // currently unused but ready for workspace isolation
  expiresAt: number;
}

export const oauthStates = new Map<string, OAuthState>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, state] of oauthStates.entries()) {
    if (now > state.expiresAt) {
      oauthStates.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function createOAuthState(userId: string): string {
  const state = randomBytes(32).toString("hex");
  oauthStates.set(state, {
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes expiry
  });
  return state;
}

export function validateOAuthState(state: string, userId?: string): boolean {
  const stored = oauthStates.get(state);
  if (!stored) return false;
  
  // Enforce one-time use
  oauthStates.delete(state);
  
  if (Date.now() > stored.expiresAt) return false;
  
  if (userId && stored.userId !== userId) return false;
  
  return true;
}

export function consumeOAuthState(state: string): OAuthState | null {
  const stored = oauthStates.get(state);
  if (!stored) return null;
  
  // Enforce one-time use
  oauthStates.delete(state);
  
  if (Date.now() > stored.expiresAt) return null;
  return stored;
}
