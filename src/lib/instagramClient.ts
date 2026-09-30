import { InstagramConfigStatus, InstagramConnectionState } from '../providers/instagram/instagramTypes';
import { Snapshot } from '../types';

export class InstagramClient {
  // Check if server is configured with Meta App credentials
  static async getConfig(): Promise<InstagramConfigStatus> {
    const res = await fetch('/api/instagram/config');
    if (!res.ok) {
      throw new Error(`Failed to check Instagram config: HTTP ${res.status}`);
    }
    return res.json();
  }

  // Get official authorization URL
  static async getAuthUrl(): Promise<{ configured: boolean; url?: string; message?: string; redirectUri?: string }> {
    const res = await fetch('/api/instagram/auth-url');
    const data = await res.json();
    return data;
  }

  // Check authenticated connection status
  static async getStatus(): Promise<InstagramConnectionState> {
    const res = await fetch('/api/instagram/status');
    if (!res.ok) {
      return {
        connected: false,
        account: null,
        permissions: [],
        limitations: {
          hasFollowerRosters: false,
          reason: 'Could not reach server status endpoint',
        },
      };
    }
    return res.json();
  }

  // Pull latest live metrics and get new snapshot
  static async syncLatest(): Promise<{
    account: any;
    snapshot: Snapshot;
    lastSynced: string;
  }> {
    const res = await fetch('/api/instagram/sync', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Sync failed');
    }
    return data;
  }

  // Disconnect Instagram account
  static async disconnect(): Promise<void> {
    const res = await fetch('/api/instagram/disconnect', { method: 'POST' });
    if (!res.ok) {
      throw new Error('Failed to disconnect');
    }
  }
}
