import { UserIdentity } from '../providers/auth/authTypes';

export class AuthClient {
  static async getCurrentUser(): Promise<UserIdentity | null> {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      const data = await res.json();
      return data.isAuthenticated ? data.user : null;
    } catch {
      return null;
    }
  }

  static async getConfig(): Promise<{ configured: boolean; clientId?: string; serverRedirectConfigured?: boolean }> {
    try {
      const res = await fetch('/api/auth/config');
      if (!res.ok) return { configured: false };
      return res.json();
    } catch {
      return { configured: false };
    }
  }

  static async verifyGoogleToken(credential: string): Promise<{ success: boolean; user?: UserIdentity; error?: string }> {
    try {
      const res = await fetch('/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      return res.json();
    } catch (e: any) {
      return { success: false, error: e.message || 'Network failure' };
    }
  }

  static async getGoogleAuthUrl(): Promise<{
    configured: boolean;
    clientId?: string;
    url?: string;
    message?: string;
    serverRedirectConfigured?: boolean;
  }> {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) {
        return {
          configured: false,
          message: 'Google authentication requires OAuth configuration.',
        };
      }
      return res.json();
    } catch {
      return {
        configured: false,
        message: 'Unable to reach authentication service.',
      };
    }
  }

  static async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  }
}
