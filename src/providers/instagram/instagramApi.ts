import {
  InstagramOAuthConfig,
  InstagramShortLivedTokenResponse,
  InstagramLongLivedTokenResponse,
  InstagramUserProfile,
} from './instagramTypes';
import { Snapshot } from '../../types';

export class InstagramApi {
  // Official Meta OAuth authorization URL
  static getAuthorizationUrl(appId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: redirectUri,
      scope: 'instagram_business_basic',
      response_type: 'code',
      state: state,
    });
    return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
  }

  // Official OAuth token exchange via POST https://api.instagram.com/oauth/access_token
  static async exchangeCodeForShortLivedToken(
    appId: string,
    appSecret: string,
    redirectUri: string,
    code: string
  ): Promise<InstagramShortLivedTokenResponse> {
    const formData = new URLSearchParams();
    formData.append('client_id', appId);
    formData.append('client_secret', appSecret);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code);

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    if (!response.ok || data.error_type || data.error_message) {
      throw new Error(
        data.error_message ||
          data.error?.message ||
          `Failed to exchange authorization code: HTTP ${response.status}`
      );
    }

    return data as InstagramShortLivedTokenResponse;
  }

  // Exchange short-lived token (1 hr) for long-lived token (60 days)
  static async exchangeForLongLivedToken(
    appSecret: string,
    shortLivedToken: string
  ): Promise<InstagramLongLivedTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: appSecret,
      access_token: shortLivedToken,
    });

    const url = `https://graph.instagram.com/access_token?${params.toString()}`;
    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (!response.ok || data.error) {
      // If long-lived exchange fails, fall back to short-lived token
      console.warn('Long-lived token exchange warning:', data.error);
      return {
        access_token: shortLivedToken,
        token_type: 'bearer',
        expires_in: 3600,
      };
    }

    return data as InstagramLongLivedTokenResponse;
  }

  // Fetch authorized profile info from official graph endpoint
  static async fetchUserProfile(accessToken: string): Promise<InstagramUserProfile> {
    const fields = [
      'id',
      'username',
      'name',
      'account_type',
      'profile_picture_url',
      'followers_count',
      'follows_count',
      'media_count',
    ].join(',');

    const url = `https://graph.instagram.com/v22.0/me?fields=${fields}&access_token=${encodeURIComponent(
      accessToken
    )}`;

    const response = await fetch(url, { method: 'GET' });
    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(
        data.error?.message ||
          `Failed to fetch Instagram profile: HTTP ${response.status}`
      );
    }

    return data as InstagramUserProfile;
  }

  // Normalize API data to application's standard Snapshot format
  static buildSnapshotFromApiProfile(
    profile: InstagramUserProfile,
    isBaseline: boolean = false
  ): Snapshot {
    const now = new Date().toISOString();
    const id = `snap_ig_live_${Date.now()}`;
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const followersCount = profile.followers_count ?? 0;
    const followingCount = profile.follows_count ?? 0;

    return {
      id,
      userId: profile.username || 'my_instagram',
      label: `Official Sync (${profile.username}) · ${dateFormatted}`,
      createdAt: now,
      effectiveAt: now,
      source: 'OFFICIAL_OAUTH',
      followers: [],
      following: [],
      mutuals: [],
      closeFriends: [],
      pendingRequests: [],
      recentRequests: [],
      recentlyUnfollowed: [],
      followingNotFollowingBack: [],
      followersNotFollowedBack: [],
      mutualCount: 0,
      followersCount,
      followingCount,
      profiles: {},
      metadata: {
        formatDetected: 'Meta Instagram Graph API v22.0',
        fileName: 'Official Meta OAuth Endpoint',
        parsedRecords: followersCount + followingCount,
        skippedRecords: 0,
        accountUsername: profile.username,
        version: 'v22.0',
      },
    };
  }
}
