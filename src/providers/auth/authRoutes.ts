import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { UserIdentity, GoogleAuthConfig } from './authTypes';

export const authRouter = Router();

const AUTH_COOKIE_NAME = 'fs_auth_session';

function getGoogleClientId(): string {
  if (process.env.GOOGLE_CLIENT_ID) return process.env.GOOGLE_CLIENT_ID;
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.oAuthClientId) return config.oAuthClientId;
    }
  } catch (e) {
    // fallback
  }
  return '';
}

// In-memory session store (sessionId -> UserIdentity)
const userSessions = new Map<string, { user: UserIdentity; expiresAt: number }>();

// In-memory OAuth state store (10 minute expiry)
const googleOAuthStates = new Map<string, { createdAt: number; redirectOrigin: string }>();

setInterval(() => {
  const now = Date.now();
  for (const [state, meta] of googleOAuthStates.entries()) {
    if (now - meta.createdAt > 10 * 60 * 1000) {
      googleOAuthStates.delete(state);
    }
  }
  for (const [sessId, data] of userSessions.entries()) {
    if (now > data.expiresAt) {
      userSessions.delete(sessId);
    }
  }
}, 60 * 1000);

function resolveGoogleRedirectUri(req: Request): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI;
  }
  const host = req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  return `${proto}://${host}/api/auth/google/callback`;
}

function getSessionUser(req: Request): UserIdentity | null {
  const sessionId = req.cookies?.[AUTH_COOKIE_NAME];
  if (!sessionId) return null;
  const session = userSessions.get(sessionId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    userSessions.delete(sessionId);
    return null;
  }
  return session.user;
}

function createSession(res: Response, user: UserIdentity): string {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  userSessions.set(sessionId, {
    user,
    expiresAt: Date.now() + maxAge,
  });

  res.cookie(AUTH_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
  });

  return sessionId;
}

// 1. GET /api/auth/me — Check current Follow Signal user session
authRouter.get('/me', (req: Request, res: Response) => {
  const user = getSessionUser(req);
  if (!user) {
    return res.json({ isAuthenticated: false, user: null });
  }
  res.json({ isAuthenticated: true, user });
});

// GET /api/auth/config — Check client-side GIS and server OAuth configuration
authRouter.get('/config', (req: Request, res: Response) => {
  const clientId = getGoogleClientId();
  res.json({
    configured: !!clientId,
    clientId,
    serverRedirectConfigured: !!(clientId && process.env.GOOGLE_CLIENT_SECRET),
  });
});

// 2. GET /api/auth/google/url — Initiate official Google OAuth
authRouter.get('/google/url', (req: Request, res: Response) => {
  const clientId = getGoogleClientId();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId) {
    return res.status(200).json({
      configured: false,
      message: 'Google authentication requires OAuth configuration.',
    });
  }

  // If we have clientId, return client GIS capability
  const redirectUri = resolveGoogleRedirectUri(req);
  const state = crypto.randomBytes(16).toString('hex');
  const origin = req.get('referer') || `${req.protocol}://${req.get('host')}`;

  googleOAuthStates.set(state, {
    createdAt: Date.now(),
    redirectOrigin: origin,
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    access_type: 'online',
    prompt: 'select_account',
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({
    configured: true,
    clientId,
    url,
    serverRedirectConfigured: !!clientSecret,
  });
});

// 3. GET /api/auth/google/callback — Google OAuth code exchange
authRouter.get('/google/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.redirect(`/?auth_error=${encodeURIComponent('Google sign-in was cancelled.')}`);
  }

  if (!code) {
    return res.redirect(`/?auth_error=${encodeURIComponent('Missing authorization code.')}`);
  }

  const stateMeta = state ? googleOAuthStates.get(state) : null;
  if (!state || !stateMeta) {
    return res.redirect(`/?auth_error=${encodeURIComponent('Security verification failed. Please try again.')}`);
  }
  googleOAuthStates.delete(state);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = resolveGoogleRedirectUri(req);

  if (!clientId || !clientSecret) {
    return res.redirect(`/?auth_error=${encodeURIComponent('Google authentication requires production OAuth configuration.')}`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange token with Google');
    }

    // Fetch verified Google user info
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await userinfoRes.json();

    if (!userinfoRes.ok || !profile.sub) {
      throw new Error('Failed to retrieve verified user profile from Google');
    }

    const now = new Date().toISOString();
    const user: UserIdentity = {
      id: profile.sub,
      email: profile.email || '',
      name: profile.name || profile.email?.split('@')[0] || 'User',
      avatar: profile.picture,
      createdAt: now,
      lastLoginAt: now,
      provider: 'google',
    };

    createSession(res, user);
    return res.redirect('/?auth=success');
  } catch (err: any) {
    console.error('Google OAuth callback error:', err);
    return res.redirect(`/?auth_error=${encodeURIComponent(err.message || 'Authentication failed')}`);
  }
});

// 4. POST /api/auth/google/verify — For client-side Google Identity Services credential
authRouter.post('/google/verify', async (req: Request, res: Response) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Missing credential token' });
  }

  try {
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const payload = await verifyRes.json();

    if (!verifyRes.ok || payload.error_description || !payload.sub) {
      return res.status(401).json({ error: payload.error_description || 'Invalid Google token' });
    }

    const clientId = getGoogleClientId();
    if (clientId && payload.aud !== clientId) {
      return res.status(401).json({ error: 'Audience mismatch for Google token' });
    }

    const now = new Date().toISOString();
    const user: UserIdentity = {
      id: payload.sub,
      email: payload.email || '',
      name: payload.name || payload.email?.split('@')[0] || 'User',
      avatar: payload.picture,
      createdAt: now,
      lastLoginAt: now,
      provider: 'google',
    };

    createSession(res, user);
    res.json({ success: true, user });
  } catch (err: any) {
    console.error('Google token verification error:', err);
    res.status(500).json({ error: err.message || 'Token verification failed' });
  }
});

// 5. POST /api/auth/logout — Destroy Follow Signal session
authRouter.post('/logout', (req: Request, res: Response) => {
  const sessionId = req.cookies?.[AUTH_COOKIE_NAME];
  if (sessionId) {
    userSessions.delete(sessionId);
    res.clearCookie(AUTH_COOKIE_NAME);
  }
  res.json({ success: true, loggedOut: true });
});
