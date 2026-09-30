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
          auth.message ||
            'Google authentication requires production OAuth configuration. You can import an archive directly without an account.'
        );
      }
    } catch {
      setLoadingGoogle(false);
      setGoogleNotice(
        'Google authentication is temporarily unavailable. You can use Follow Signal directly with your archive.'
      );
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-16 text-center select-none">
      <div className="w-full max-w-md mx-auto space-y-9">
        {/* Subtle Brand & Status Marker */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#0D0D0D] border border-[#1C1C1A] text-[11px] font-mono text-[#9A9A96]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF3048] shadow-[0_0_6px_rgba(255,48,72,0.8)]" />
            <span>LOCAL RELATIONSHIP INTELLIGENCE</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-sans font-extrabold tracking-tight text-[#F5F5F2] leading-tight">
            YOUR CIRCLE,<br />
            OVER TIME.
          </h1>

          <p className="text-sm font-sans text-[#9A9A96] max-w-sm mx-auto leading-relaxed">
            Forensic analysis of your Instagram social graph. Mutual bonds, unreciprocated following, and historical check-in diffs.
          </p>
        </div>

        {/* Notice if Google OAuth is unconfigured */}
        {googleNotice && (
          <div className="p-4 bg-[#0D0D0D] border border-[#262624] rounded-xl text-xs text-[#9A9A96] text-left leading-relaxed space-y-2">
            <p>{googleNotice}</p>
            <button
              onClick={() => {
                setGoogleNotice(null);
                onOpenImport();
              }}
              className="text-[#F5F5F2] font-semibold underline underline-offset-4 block cursor-pointer hover:text-white"
            >
              Continue with archive import →
            </button>
          </div>
        )}

        {/* Authentication Options */}
        <div className="space-y-3.5 pt-1">
          {/* Primary Action: Continue with Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loadingGoogle}
            className="w-full h-12 px-5 bg-[#F5F5F2] hover:bg-white text-black font-sans font-semibold text-xs tracking-wide rounded-xl transition active:scale-[0.99] flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50 shadow-sm"
          >
            {/* Google G icon */}
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
          <div className="flex items-center space-x-3 text-xs text-[#5F5F5B] font-mono py-1">
            <span className="flex-1 h-[1px] bg-[#1C1C1A]" />
            <span>or</span>
            <span className="flex-1 h-[1px] bg-[#1C1C1A]" />
          </div>

          {/* Secondary Action: Guest Archive */}
          <button
            onClick={onOpenImport}
            className="w-full h-12 px-5 bg-[#0D0D0D] hover:bg-[#141414] border border-[#1C1C1A] hover:border-[#262624] text-[#F5F5F2] font-sans font-medium text-xs tracking-wider uppercase rounded-xl transition active:scale-[0.99] cursor-pointer"
          >
            Import archive without an account
          </button>
        </div>

        {/* Verification Fixture Trigger */}
        <div className="pt-2">
          <button
            onClick={onLoadVerifiedArchive}
            disabled={isLoadingVerified}
            className="text-xs text-[#5F5F5B] hover:text-[#9A9A96] font-mono underline underline-offset-4 cursor-pointer transition disabled:opacity-50"
          >
            {isLoadingVerified
              ? 'Loading verified baseline archive...'
              : 'Explore verified baseline dataset (163 accounts) →'}
          </button>
        </div>

        {/* Technical Privacy Commitments */}
        <div className="pt-6 border-t border-[#1C1C1A] text-center space-y-1.5 text-xs text-[#5F5F5B]">
          <p className="font-mono text-[#9A9A96]">
            No Instagram password required.
          </p>
          <p className="text-[11px] leading-relaxed">
            All ZIP files and JSON rosters are parsed locally in browser memory.
          </p>
        </div>
      </div>
    </div>
  );
};
