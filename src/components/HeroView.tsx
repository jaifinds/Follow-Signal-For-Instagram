import React from 'react';

interface HeroViewProps {
  userName?: string;
  onOpenImport: () => void;
  onOpenConnect?: () => void;
  onLoadVerifiedArchive: () => void;
  isLoadingVerified: boolean;
}

export const HeroView: React.FC<HeroViewProps> = ({
  userName,
  onOpenImport,
  onLoadVerifiedArchive,
  isLoadingVerified,
}) => {
  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-12 space-y-6 sm:space-y-10 select-none animate-fade-in text-[#F5F5F3] min-w-0">
      {/* Hero Masthead */}
      <div className="p-6 sm:p-10 bg-[#1A1B20] border border-[#242630] rounded-2xl space-y-6 sm:space-y-8 shadow-xl min-w-0">
        <div className="space-y-3 sm:space-y-4 max-w-2xl min-w-0">
          <div className="font-mono text-xs text-[#C5A869] tracking-wider uppercase">
            {firstName ? `Workspace Ready · ${firstName}` : 'Instagram Relationship Intelligence'}
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#F5F5F3] leading-tight">
            {firstName ? `Welcome back, ${firstName}.` : 'See who unfollowed you on Instagram.'}
          </h1>

          <p className="text-xs sm:text-sm text-[#9596A2] leading-relaxed">
            Import your official Instagram data export to immediately identify who doesn&apos;t follow you back, see your true mutual connections, and track changes across checkpoints. 100% private, executed locally in your browser sandbox.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
          <button
            onClick={onOpenImport}
            className="px-5 py-3 bg-[#C5A869] hover:bg-[#D4B475] text-[#131417] font-semibold text-xs tracking-wide rounded-lg transition cursor-pointer text-center active:scale-95 shadow-md flex items-center justify-center space-x-2"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import Your Instagram Archive</span>
          </button>

          <button
            onClick={onLoadVerifiedArchive}
            disabled={isLoadingVerified}
            className="px-5 py-3 bg-[#21232A] hover:bg-[#292B33] border border-[#2B2D37] text-[#D4D5DC] font-medium text-xs tracking-wide rounded-lg transition cursor-pointer text-center disabled:opacity-50 active:scale-95"
          >
            {isLoadingVerified ? 'Processing Sample...' : 'Explore Sample Dataset (163 Accounts) →'}
          </button>
        </div>
      </div>

      {/* 3 Step Guide - Fully Responsive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <div className="p-5 bg-[#1A1B20] border border-[#242630] rounded-xl space-y-2 min-w-0">
          <div className="text-xs font-mono font-semibold text-[#C5A869] uppercase tracking-wider">
            Step 01
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F3]">
            Download your archive
          </h3>
          <p className="text-xs text-[#9596A2] leading-relaxed">
            In Instagram &rarr; Accounts Center &rarr; Download Your Information. Choose JSON format (takes a couple of minutes).
          </p>
        </div>

        <div className="p-5 bg-[#1A1B20] border border-[#242630] rounded-xl space-y-2 min-w-0">
          <div className="text-xs font-mono font-semibold text-[#C5A869] uppercase tracking-wider">
            Step 02
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F3]">
            Browser-only processing
          </h3>
          <p className="text-xs text-[#9596A2] leading-relaxed">
            Drop your ZIP file here. Your browser evaluates all followers and mutuals in local memory. Zero credentials needed.
          </p>
        </div>

        <div className="p-5 bg-[#1A1B20] border border-[#242630] rounded-xl space-y-2 min-w-0">
          <div className="text-xs font-mono font-semibold text-[#C5A869] uppercase tracking-wider">
            Step 03
          </div>
          <h3 className="text-sm font-semibold text-[#F5F5F3]">
            Instant results & history
          </h3>
          <p className="text-xs text-[#9596A2] leading-relaxed">
            Instantly see non-followers, mutuals, and compare future checkpoints to see exactly who departed or followed.
          </p>
        </div>
      </div>
    </div>
  );
};
