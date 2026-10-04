import React, { useState, useEffect, useRef } from 'react';
import { AuthClient } from '../lib/authClient';
import { UserIdentity } from '../providers/auth/authTypes';

interface LoginScreenProps {
  onContinueAsGuestArchive: () => void;
  onOpenImport: () => void;
  onUserAuthenticated?: (user: UserIdentity) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onContinueAsGuestArchive,
  onOpenImport,
  onUserAuthenticated,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [oAuthConfig, setOAuthConfig] = useState<{ configured: boolean; clientId?: string } | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    AuthClient.getConfig().then(cfg => {
      if (!isMounted) return;
      setOAuthConfig(cfg);

      const resolvedClientId = cfg.clientId || '730936171710-3ui0lb0gnr2ns3vtvl2isrlv2s0u8alr.apps.googleusercontent.com';

      if ((window as any).google?.accounts?.id && resolvedClientId) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: resolvedClientId,
            callback: async (response: any) => {
              if (response.credential) {
                setLoadingGoogle(true);
                const verifyRes = await AuthClient.verifyGoogleToken(response.credential);
                setLoadingGoogle(false);
                if (verifyRes.success && verifyRes.user && onUserAuthenticated) {
                  onUserAuthenticated(verifyRes.user);
                } else if (verifyRes.error) {
                  setGoogleNotice(verifyRes.error);
                }
              }
            },
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_black',
              size: 'large',
              shape: 'rectangular',
              width: 320,
              text: 'signin_with',
            });
          }
        } catch (e) {
          console.error('Failed to initialize Google Identity Services:', e);
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [onUserAuthenticated]);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setGoogleNotice(null);

    const clientId = oAuthConfig?.clientId || '730936171710-3ui0lb0gnr2ns3vtvl2isrlv2s0u8alr.apps.googleusercontent.com';

    if ((window as any).google?.accounts?.id && clientId) {
      try {
        (window as any).google.accounts.id.prompt((notification: any) => {
          setLoadingGoogle(false);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Trigger direct token client fallback
            if ((window as any).google?.accounts?.oauth2) {
              const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'openid email profile',
                callback: async (tokenResponse: any) => {
                  if (tokenResponse.access_token) {
                    try {
                      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                      });
                      const userInfo = await userRes.json();
                      if (userInfo.sub && onUserAuthenticated) {
                        const verifiedUser: UserIdentity = {
                          id: userInfo.sub,
                          email: userInfo.email || '',
                          name: userInfo.name || userInfo.email?.split('@')[0] || 'User',
                          avatar: userInfo.picture,
                          createdAt: new Date().toISOString(),
                          lastLoginAt: new Date().toISOString(),
                          provider: 'google',
                        };
                        onUserAuthenticated(verifiedUser);
                      }
                    } catch (err: any) {
                      setGoogleNotice(err.message || 'Failed to authenticate user.');
                    }
                  }
                },
              });
              client.requestAccessToken();
            }
          }
        });
      } catch (err: any) {
        setLoadingGoogle(false);
        setGoogleNotice(err.message || 'Google sign-in could not be initiated.');
      }
    } else {
      setLoadingGoogle(false);
      setGoogleNotice('Google authentication service ready. Use Archive Vault below.');
    }
  };

  return (
    <div className="min-h-[88vh] flex flex-col items-center justify-center px-4 py-8 sm:py-16 select-none w-full max-w-xl mx-auto">
      <div className="w-full space-y-8 sm:space-y-12 min-w-0">
        
        {/* Luxury Masthead */}
        <div className="space-y-4 text-center min-w-0">
          <div className="inline-flex items-center space-x-2 tracking-[0.25em] text-[10px] uppercase font-mono text-[#8E909D]">
            <span>FOLLOW SIGNAL</span>
            <span>·</span>
            <span>EDITION 2026</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-light text-[#FFFFFF] tracking-tight leading-tight">
            Instagram relationship intelligence.
          </h1>

          <p className="text-xs sm:text-sm text-[#8E909D] max-w-md mx-auto leading-relaxed font-normal">
            A private, client-side instrument to identify unreciprocated following, inspect mutual bonds, and audit changes across your account history.
          </p>
        </div>

        {/* Notice Message */}
        {googleNotice && (
          <div className="p-3.5 bg-[#131418] border border-white/10 rounded-lg text-xs text-[#D1D3DC] text-left space-y-1.5">
            <p className="text-white font-medium">{googleNotice}</p>
            <button
              onClick={() => {
                setGoogleNotice(null);
                onOpenImport();
              }}
              className="text-white underline cursor-pointer hover:text-white/80"
            >
              Proceed directly with archive &rarr;
            </button>
          </div>
        )}

        {/* Authentication & Access Card */}
        <div className="bg-[#131418] border border-white/[0.08] rounded-xl p-6 sm:p-8 space-y-6 shadow-2xl min-w-0">
          
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono tracking-widest text-[#8E909D] uppercase">
              Access Credentials
            </div>
            <h2 className="text-lg font-medium text-white tracking-tight">
              Sign in with your Google account
            </h2>
            <p className="text-xs text-[#8E909D] leading-relaxed">
              Authenticate securely via Google OAuth to preserve your personal account notes, star lists, and comparison checkpoints.
            </p>
          </div>

          {/* Official GIS Button Container & Custom Action */}
          <div className="space-y-3 pt-1">
            <div ref={googleBtnRef} className="flex justify-center empty:hidden w-full overflow-hidden" />

            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="w-full h-12 px-5 bg-white hover:bg-neutral-100 text-[#0C0D0F] font-semibold text-xs tracking-wider uppercase rounded-lg transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50 active:scale-[0.99] shadow-sm"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loadingGoogle ? 'Authenticating...' : 'Continue with Google Account'}</span>
            </button>

            {/* Subtle Divider */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/[0.08]" />
              </div>
              <span className="relative px-3 bg-[#131418] text-[10px] font-mono tracking-widest text-[#565866] uppercase">
                Or Direct Vault Access
              </span>
            </div>

            {/* Direct Vault Upload without login */}
            <button
              onClick={() => {
                onContinueAsGuestArchive();
                onOpenImport();
              }}
              className="w-full h-12 px-5 bg-[#1A1C22] hover:bg-[#22252C] border border-white/[0.1] text-white font-medium text-xs tracking-wider uppercase rounded-lg transition-all cursor-pointer flex items-center justify-center space-x-2 active:scale-[0.99]"
            >
              <svg className="w-4 h-4 shrink-0 text-[#8E909D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import Instagram Archive (ZIP / JSON)</span>
            </button>
          </div>
        </div>

        {/* Minimalist Trust & Privacy Guarantee */}
        <div className="text-center space-y-1 pt-2">
          <p className="text-[11px] font-mono tracking-wider uppercase text-[#D1D3DC]">
            Client-Side Confidentiality
          </p>
          <p className="text-xs text-[#565866] max-w-sm mx-auto leading-relaxed">
            Archive files are parsed exclusively in your local browser sandbox. No follower data, relationship lists, or passwords ever leave your computer.
          </p>
        </div>
      </div>
    </div>
  );
};
