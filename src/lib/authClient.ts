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

  static async getGoogleAuthUrl(): Promise<{ configured: boolean; url?: string; message?: string }> {
    const res = await fetch('/api/auth/google/url');
    if (!res.ok) {
      return {
        configured: false,
        message: 'Google authentication requires production OAuth configuration.',
      };
    }
    return res.json();
  }

  static async logout(): Promise<void> {
    await fetch('/api/auth/logout', { method: 'POST' });
  }
}
