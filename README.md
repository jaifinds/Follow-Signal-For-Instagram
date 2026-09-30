# FOLLOW SIGNAL — Production Deployment & Configuration Guide

Follow Signal is a private Instagram relationship intelligence platform that tracks follower changes, mutual bonds, and snapshot diffing over time.

---

## 1. Architectural Distinction

Follow Signal enforces a strict separation between two independent identities:

1. **Follow Signal User Account (Google OAuth / Guest Archive)**:
   - Authenticates the user into their personal workspace.
   - Preserves session via secure HTTP-only cookies (`fs_auth_session`).
   - Keeps user data strictly isolated.
2. **Connected Instagram Account (Meta OAuth 2.0)**:
   - Connects an eligible Instagram Professional (Creator/Business) account.
   - Synchronizes live follower/following counts, profile picture, and verified metadata.
   - Does NOT replace archive mode; archive mode provides 100% individual follower rosters and unfollow diffs.

---

## 2. Environment Variables

Configure these variables in your deployment environment or `.env`:

```bash
# Application Host URL
APP_URL="https://your-domain.com"
PORT=3000

# ==============================================================================
# GOOGLE OAUTH CONFIGURATION (Follow Signal User Authentication)
# ==============================================================================
# 1. Create a project at https://console.cloud.google.com/
# 2. Go to APIs & Services > Credentials > Create OAuth client ID (Web application)
# 3. Add Authorized Redirect URI:
#    - Local: http://localhost:3000/api/auth/google/callback
#    - Production: https://<YOUR_DOMAIN>/api/auth/google/callback
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="https://<YOUR_DOMAIN>/api/auth/google/callback"

# ==============================================================================
# META INSTAGRAM OAUTH CONFIGURATION (Official Instagram Connection)
# ==============================================================================
# 1. Create a Meta Developer App at https://developers.facebook.com/
# 2. Add product: "Instagram API with Instagram Login"
# 3. Under Instagram Settings, add Valid OAuth Redirect URI:
#    - Local: http://localhost:3000/api/instagram/callback
#    - Production: https://<YOUR_DOMAIN>/api/instagram/callback
# 4. Scope requested: instagram_business_basic
INSTAGRAM_APP_ID="your-meta-app-id"
INSTAGRAM_APP_SECRET="your-meta-app-secret"
INSTAGRAM_REDIRECT_URI="https://<YOUR_DOMAIN>/api/instagram/callback"
```

---

## 3. Production Deployment

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
2. **Start the production server**:
   ```bash
   npm start
   ```
   This executes `node server.ts`, which serves the optimized Vite static SPA and backend API endpoints on port 3000.

---

## 4. Verification & Testing

Run the test and verification suite:
```bash
npm run lint
npm run build
npx tsx scripts/verifyPipeline.ts
```
