import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { InstagramApi } from './instagramApi';
import { InstagramConfigStatus, InstagramUserProfile } from './instagramTypes';

export const instagramRouter = Router();

// In-memory state store with 10-minute expiry to protect OAuth against CSRF
const oauthStateStore = new Map<string, { createdAt: number; redirectOrigin: string }>();

// Clean up expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, meta] of oauthStateStore.entries()) {
    if (now - meta.createdAt > 10 * 60 * 1000) {
      oauthStateStore.delete(state);
    }
  }
}, 60 * 1000);

// In-memory session store mapped to secure session ID cookie
interface UserSession {
  accessToken: string;
  tokenType: string;
  expiresAt: number;
  profile: InstagramUserProfile;
  lastSynced: string;
}

const activeSessions = new Map<string, UserSession>();

const SESSION_COOKIE_NAME = 'fs_ig_session_id';

function getOrSetSessionId(req: Request, res: Response): string {
  let sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (!sessionId) {
    sessionId = crypto.randomBytes(24).toString('hex');
    res.cookie(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
    });
  }
  return sessionId;
}

function resolveRedirectUri(req: Request): string {
  if (process.env.INSTAGRAM_REDIRECT_URI) {
    return process.env.INSTAGRAM_REDIRECT_URI;
  }
  const host = req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  return `${proto}://${host}/api/instagram/callback`;
}

// 1. GET /api/instagram/config — Check environment readiness
instagramRouter.get('/config', (req: Request, res: Response) => {
  const appId = process.env.INSTAGRAM_APP_ID || '';
  const appSecret = process.env.INSTAGRAM_APP_SECRET || '';
  const redirectUri = resolveRedirectUri(req);

  const missing: string[] = [];
  if (!appId) missing.push('INSTAGRAM_APP_ID');
  if (!appSecret) missing.push('INSTAGRAM_APP_SECRET');

  const status: InstagramConfigStatus = {
    configured: missing.length === 0,
    appIdConfigured: Boolean(appId),
    appSecretConfigured: Boolean(appSecret),
    redirectUri: redirectUri,
    suggestedRedirectUri: redirectUri,
    missing,
    instructions: {
      portalUrl: 'https://developers.facebook.com/',
      productName: 'Instagram API with Instagram Login',
      scope: 'instagram_business_basic',
      notice:
        'Personal accounts cannot use the Graph API. Instagram requires an eligible Business or Creator account for official API connection.',
    },
  };

  res.json(status);
});

// 2. GET /api/instagram/auth-url — Generate official Meta authorization URL
instagramRouter.get('/auth-url', (req: Request, res: Response) => {
  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;

  if (!appId || !appSecret) {
    return res.status(200).json({
      configured: false,
      message: 'Instagram connection is temporarily unavailable. You can still import your Instagram archive.',
    });
  }

  const redirectUri = resolveRedirectUri(req);
  const state = crypto.randomBytes(16).toString('hex');
  const origin = req.get('referer') || `${req.protocol}://${req.get('host')}`;

  oauthStateStore.set(state, {
    createdAt: Date.now(),
    redirectOrigin: origin,
  });

  const url = InstagramApi.getAuthorizationUrl(appId, redirectUri, state);
  res.json({ configured: true, url, state, redirectUri });
});

// 3. GET /api/instagram/callback — OAuth Code Exchange & Token Lifecycle
instagramRouter.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error, error_reason, error_description } = req.query as Record<
    string,
    string
  >;

  // Handle OAuth rejection or error from Meta
  if (error || error_reason) {
    const errorMsg = encodeURIComponent(
      error_description || error_reason || error || 'Authorization was cancelled or denied.'
    );
    return res.redirect(`/?instagram_error=${errorMsg}`);
  }

  if (!code) {
    return res.redirect('/?instagram_error=' + encodeURIComponent('Missing authorization code'));
  }

  // Validate CSRF state
  const stateMeta = state ? oauthStateStore.get(state) : null;
  if (!state || !stateMeta) {
    return res.redirect(
      '/?instagram_error=' + encodeURIComponent('Security verification failed (invalid or expired state token). Please try again.')
    );
  }
  oauthStateStore.delete(state);

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  const redirectUri = resolveRedirectUri(req);

  if (!appId || !appSecret) {
    return res.redirect(
      '/?instagram_error=' + encodeURIComponent('Instagram App credentials are not configured on the server.')
    );
  }

  try {
    // Step 1: Exchange code for short-lived access token
    const tokenData = await InstagramApi.exchangeCodeForShortLivedToken(
      appId,
      appSecret,
      redirectUri,
      code
    );

    // Step 2: Exchange for long-lived 60-day token
    const longLivedData = await InstagramApi.exchangeForLongLivedToken(
      appSecret,
      tokenData.access_token
    );

    // Step 3: Query profile from official Graph API
    const userProfile = await InstagramApi.fetchUserProfile(longLivedData.access_token);

    // Step 4: Save session server-side
    const sessionId = getOrSetSessionId(req, res);
    const expiresAt = Date.now() + (longLivedData.expires_in || 3600) * 1000;

    activeSessions.set(sessionId, {
      accessToken: longLivedData.access_token,
      tokenType: longLivedData.token_type,
      expiresAt,
      profile: userProfile,
      lastSynced: new Date().toISOString(),
    });

    return res.redirect(
      `/?instagram_connected=true&username=${encodeURIComponent(userProfile.username)}`
    );
  } catch (err: any) {
    console.error('Instagram OAuth exchange error:', err);
    return res.redirect(
      `/?instagram_error=${encodeURIComponent(
        err.message || 'Token exchange failed with Meta servers'
      )}`
    );
  }
});

// 4. GET /api/instagram/status — Current authenticated connection status
instagramRouter.get('/status', (req: Request, res: Response) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  const session = sessionId ? activeSessions.get(sessionId) : null;

  if (!session) {
    return res.json({
      connected: false,
      account: null,
      permissions: [],
      limitations: {
        hasFollowerRosters: false,
        reason:
          'Meta Graph API policy prohibits accessing consumer follower handles and unfollow events. For complete relationship forensics, use Archive Import.',
      },
    });
  }

  // Check if token expired
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(sessionId);
    return res.json({
      connected: false,
      account: null,
      expired: true,
      permissions: [],
      limitations: {
        hasFollowerRosters: false,
        reason: 'Session expired. Please reconnect.',
      },
    });
  }

  res.json({
    connected: true,
    account: {
      id: session.profile.id,
      username: session.profile.username,
      name: session.profile.name,
      accountType: session.profile.account_type,
      profilePictureUrl: session.profile.profile_picture_url,
      followersCount: session.profile.followers_count ?? 0,
      followsCount: session.profile.follows_count ?? 0,
      mediaCount: session.profile.media_count ?? 0,
      lastSynced: session.lastSynced,
    },
    permissions: ['instagram_business_basic'],
    limitations: {
      hasFollowerRosters: false,
      reason:
        'Meta Graph API policy strictly limits API access to profile metrics and aggregate counts to protect consumer privacy. For individual accounts and diff tracking, use Archive Import.',
    },
  });
});

// 5. POST /api/instagram/sync — Pull latest metrics from official Graph API
instagramRouter.post('/sync', async (req: Request, res: Response) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  const session = sessionId ? activeSessions.get(sessionId) : null;

  if (!session) {
    return res.status(401).json({ error: 'NOT_CONNECTED', message: 'No active Instagram session' });
  }

  try {
    const updatedProfile = await InstagramApi.fetchUserProfile(session.accessToken);
    session.profile = updatedProfile;
    session.lastSynced = new Date().toISOString();

    const snapshot = InstagramApi.buildSnapshotFromApiProfile(updatedProfile);

    res.json({
      success: true,
      account: updatedProfile,
      snapshot,
      lastSynced: session.lastSynced,
    });
  } catch (err: any) {
    console.error('Failed to sync live metrics from Meta:', err);
    res.status(500).json({
      error: 'SYNC_FAILED',
      message: err.message || 'Could not reach Meta Graph API',
    });
  }
});

// 6. POST /api/instagram/disconnect — Disconnect and clear session
instagramRouter.post('/disconnect', (req: Request, res: Response) => {
  const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
  if (sessionId) {
    activeSessions.delete(sessionId);
    res.clearCookie(SESSION_COOKIE_NAME);
  }
  res.json({ success: true, disconnected: true });
});
