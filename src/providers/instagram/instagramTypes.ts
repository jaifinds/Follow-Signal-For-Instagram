export interface InstagramOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
}

export interface InstagramConfigStatus {
  configured: boolean;
  appIdConfigured: boolean;
  appSecretConfigured: boolean;
  redirectUri: string;
  suggestedRedirectUri: string;
  missing: string[];
  instructions: {
    portalUrl: string;
    productName: string;
    scope: string;
    notice: string;
  };
}

export interface InstagramShortLivedTokenResponse {
  access_token: string;
  user_id: string;
  permissions?: string[];
  error_type?: string;
  code?: number;
  error_message?: string;
}

export interface InstagramLongLivedTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface InstagramUserProfile {
  id: string;
  username: string;
  name?: string;
  account_type?: 'BUSINESS' | 'MEDIA_CREATOR' | 'PERSONAL' | string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
}

export interface InstagramConnectionState {
  connected: boolean;
  account: {
    id: string;
    username: string;
    name?: string;
    accountType?: string;
    profilePictureUrl?: string;
    followersCount: number;
    followsCount: number;
    mediaCount: number;
    lastSynced: string;
  } | null;
  permissions: string[];
  limitations: {
    hasFollowerRosters: boolean;
    reason: string;
  };
}
