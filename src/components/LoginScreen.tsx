import React, { useState } from 'react';
import { AuthClient } from '../lib/authClient';

interface LoginScreenProps {
  onContinueAsGuestArchive: () => void;
  onOpenImport: () => void;
  onLoadVerifiedArchive: () => void;
  isLoadingVerified: boolean;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onContinueAsGuestArchive,
  onOpenImport,
  onLoadVerifiedArchive,
  isLoadingVerified,
}) => {
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoadingGoogle(true);
    setGoogleNotice(null);

    try {
      const auth = await AuthClient.getGoogleAuthUrl();
      if (auth.configured && auth.url) {
        window.location.href = auth.url;
      } else {
        setLoadingGoogle(false);
        setGoogleNotice(
          auth.message || 'Google authentication requires production OAuth configuration. You can use Follow Signal directly with your archive.'
        );
      }
    } catch {
      setLoadingGoogle(false);
      setGoogleNotice('Google authentication is temporarily unavailable. You can use Follow Signal directly with your archive.');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-12 text-center animate-fade-in">
      <div className="w-full max-w-sm mx-auto space-y-8">
        {/* Brand & Subtitle */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E0DCD3] text-xs font-mono text-[#55514B]">
            <span className="w-2 h-2 rounded-full bg-[#2E7D52]" />
            <span>Private by default</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tight text-[#111111] leading-none pt-1">
            FOLLOW SIGNAL
          </h1>

          <p className="text-lg font-serif italic text-[#44403C]">
            Your circle, over time.
          </p>
        </div>

        {/* Notice if Google OAuth is not configured on this host */}
        {googleNotice && (
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl text-xs text-[#6E6A63] text-left leading-relaxed space-y-2">
            <p>{googleNotice}</p>
            <button
              onClick={() => {
                setGoogleNotice(null);
                onOpenImport();
              }}
              className="text-[#111111] font-semibold underline underline-offset-2 block cursor-pointer"
            >
              Continue with archive import →
            </button>
          </div>
        )}

        {/* Primary Action: Continue with Google */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="w-full h-12 px-5 bg-white hover:bg-[#F7F5F0] border border-[#D5D0C5] text-[#111111] font-sans font-medium text-sm rounded-xl shadow-xs transition active:scale-[0.99] flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
          >
            {/* Official Google 'G' Mark */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{loadingGoogle ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="flex items-center space-x-3 text-xs text-[#99948B] font-mono">
            <span className="flex-1 h-[1px] bg-[#E5E1D8]" />
            <span>or</span>
            <span className="flex-1 h-[1px] bg-[#E5E1D8]" />
          </div>

          {/* Secondary Action: Archive Without Login */}
          <button
            onClick={onOpenImport}
            className="w-full h-12 px-5 bg-[#111111] hover:bg-[#2A2A2A] text-white font-sans font-medium text-xs tracking-wider uppercase rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            Import archive without an account
          </button>
        </div>

        {/* Verified Sample Archive Link */}
        <div className="pt-2">
          <button
            onClick={onLoadVerifiedArchive}
            disabled={isLoadingVerified}
            className="text-xs text-[#6E6A63] hover:text-[#111111] font-mono underline underline-offset-4 cursor-pointer transition disabled:opacity-50"
          >
            {isLoadingVerified
              ? 'Loading verified archive...'
              : 'Explore verified sample archive (163 accounts) →'}
          </button>
        </div>

        {/* Privacy Note */}
        <div className="pt-4 text-center space-y-1 text-xs text-[#6E6A63] font-sans">
          <p className="font-medium text-[#111111]">
            No Instagram password required.
          </p>
          <p className="text-[11px] text-[#99948B]">
            All relationship files are processed locally in your browser memory.
          </p>
        </div>
      </div>
    </div>
  );
};
