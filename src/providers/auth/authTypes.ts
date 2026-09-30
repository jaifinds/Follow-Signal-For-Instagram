export interface UserIdentity {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt: string;
  provider: 'google' | 'local_guest';
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserIdentity | null;
  mode: 'AUTHENTICATED' | 'GUEST_ARCHIVE' | 'UNAUTHENTICATED';
}

export interface GoogleAuthConfig {
  configured: boolean;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  redirectUri: string;
}
