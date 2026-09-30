import React, { useState, useEffect, useRef } from 'react';
import { AuthClient } from '../lib/authClient';
import { UserIdentity } from '../providers/auth/authTypes';

interface LoginScreenProps {
  onContinueAsGuestArchive: () => void;
  onOpenImport: () => void;
  onLoadVerifiedArchive: () => void;
  isLoadingVerified: boolean;
  onUserAuthenticated?: (user: UserIdentity) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onOpenImport,
  onLoadVerifiedArchive,
  isLoadingVerified,
  onUserAuthenticated,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [, setOAuthConfig] = useState<{ configured: boolean; clientId?: string } | null>(null);
  const googleBtnRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    AuthClient.getConfig().then(cfg => {
      if (!isMounted) return;
      setOAuthConfig(cfg);

      if (cfg.configured && cfg.clientId && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: cfg.clientId,
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
            (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              shape: 'rectangular',
              width: 320,
              text: 'continue_with',
            });
          }
        } catch (e) {
          console.error('Failed to initialize Google button:', e);
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

    try {
      const auth = await AuthClient.getGoogleAuthUrl();
      if (auth.configured && auth.url && auth.serverRedirectConfigured) {
        window.location.href = auth.url;
      } else if (auth.configured && auth.clientId && (window as any).google?.accounts?.id) {
        (window as any).google.accounts.id.prompt((notification: any) => {
          setLoadingGoogle(false);
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setGoogleNotice('Google prompt dismissed. You can explore directly with the verified sample dataset or import your archive.');
          }
        });
      } else {
        setLoadingGoogle(false);
        setGoogleNotice(auth.message || 'Ready to explore directly.');
      }
    } catch {
      setLoadingGoogle(false);
      setGoogleNotice('Authentication service unreachable. Continue directly with archive import.');
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 sm:py-12 select-none w-full max-w-lg mx-auto">
      <div className="w-full space-y-6 sm:space-y-8 min-w-0">
        
        {/* Masthead */}
        <div className="space-y-3 text-center min-w-0">
          <div className="font-mono text-xs text-[#C5A869] tracking-wider uppercase">
            Private Instagram Relationship Tracker
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#F5F5F3] tracking-tight leading-tight">
            See who unfollowed you on Instagram.
          </h1>

          <p className="text-xs sm:text-sm text-[#9596A2] max-w-md mx-auto leading-relaxed">
            Discover unreciprocated following, mutual connections, and track changes across dates. 100% private, executed locally in your browser.
          </p>
        </div>

        {/* Notice Message */}
        {googleNotice && (
          <div className="p-3 bg-[#1A1B20] border border-[#2B2D37] rounded-xl text-xs text-[#D4D5DC] text-left space-y-1.5">
            <p className="text-[#F5F5F3] font-medium">{googleNotice}</p>
            <button
              onClick={() => {
                setGoogleNotice(null);
                onOpenImport();
              }}
              className="text-[#C5A869] underline cursor-pointer hover:text-[#D4B475]"
            >
              Continue directly with archive import &rarr;
            </button>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#1A1B20] border border-[#242630] rounded-2xl p-5 sm:p-7 space-y-5 shadow-xl min-w-0">
          
          {/* Sample Data Fast Preview */}
          <div className="space-y-3 pb-5 border-b border-[#242630]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#F5F5F3] font-semibold tracking-wide">
                Live Sample Dataset
              </span>
              <span className="text-[#9596A2] font-mono text-[11px]">
                163 accounts
              </span>
            </div>

            <p className="text-xs text-[#9596A2] leading-relaxed">
              Explore an authentic relationship export with mutuals, fans, and unreciprocated accounts before uploading your own.
            </p>

            {/* Quick Count Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 rounded-lg bg-[#21232A] border border-[#2B2D37]">
                <div className="font-bold text-[#C93B3B] text-base font-mono">15</div>
                <div className="text-[10px] text-[#9596A2] mt-0.5">Don&apos;t follow back</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#21232A] border border-[#2B2D37]">
                <div className="font-bold text-[#2E7D47] text-base font-mono">60</div>
                <div className="text-[10px] text-[#9596A2] mt-0.5">Mutual friends</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#21232A] border border-[#2B2D37]">
                <div className="font-bold text-[#F5F5F3] text-base font-mono">103</div>
                <div className="text-[10px] text-[#9596A2] mt-0.5">Fans</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#21232A] border border-[#2B2D37]">
                <div className="font-bold text-[#C5A869] text-base font-mono">43</div>
                <div className="text-[10px] text-[#9596A2] mt-0.5">Close friends</div>
              </div>
            </div>

            <button
              onClick={onLoadVerifiedArchive}
              disabled={isLoadingVerified}
              className="w-full h-11 bg-[#C5A869] hover:bg-[#D4B475] text-[#131417] font-semibold text-xs tracking-wide rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 shadow-sm"
            >
              <span>{isLoadingVerified ? 'Processing Sample...' : 'Explore Sample Dataset (163 Accounts) →'}</span>
            </button>
          </div>

          {/* Action Row */}
          <div className="space-y-2.5">
            <div ref={googleBtnRef} className="flex justify-center empty:hidden" />

            <button
              onClick={handleGoogleLogin}
              disabled={loadingGoogle}
              className="w-full h-11 px-4 bg-[#21232A] hover:bg-[#292B33] border border-[#2B2D37] text-[#F5F5F3] font-medium text-xs rounded-lg transition flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loadingGoogle ? 'Connecting...' : 'Sign in with Google Account'}</span>
            </button>

            <button
              onClick={onOpenImport}
              className="w-full h-11 px-4 bg-transparent hover:bg-[#21232A] border border-[#2B2D37] text-[#D4D5DC] font-medium text-xs rounded-lg transition cursor-pointer flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import Your Instagram Archive (ZIP/JSON)</span>
            </button>
          </div>
        </div>

        {/* Security Guarantee */}
        <div className="text-center space-y-1">
          <p className="text-xs font-semibold text-[#D4D5DC]">
            Client-Side Privacy Guarantee
          </p>
          <p className="text-[11px] text-[#636573] max-w-sm mx-auto leading-relaxed">
            Archive files are parsed exclusively in your local browser sandbox. No follower names, relationship history, or passwords ever leave your machine.
          </p>
        </div>
      </div>
    </div>
  );
};
