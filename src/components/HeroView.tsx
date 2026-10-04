import React from 'react';

interface HeroViewProps {
  userName?: string;
  onOpenImport: () => void;
  onOpenConnect?: () => void;
}

export const HeroView: React.FC<HeroViewProps> = ({
  userName,
  onOpenImport,
}) => {
  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 sm:py-16 space-y-8 sm:space-y-12 select-none animate-fade-in text-[#FFFFFF] min-w-0">
      
      {/* Luxury Masthead */}
      <div className="p-8 sm:p-14 bg-[#131418] border border-white/[0.08] rounded-xl space-y-8 shadow-2xl min-w-0">
        <div className="space-y-4 max-w-2xl min-w-0">
          <div className="tracking-[0.25em] text-[10px] uppercase font-mono text-[#8E909D]">
            {firstName ? `Welcome Back · ${firstName}` : 'Private Archive Intelligence'}
          </div>

          <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
            See who unfollowed you on Instagram.
          </h1>

          <p className="text-xs sm:text-sm text-[#8E909D] leading-relaxed font-normal">
            Import your official Instagram data export to immediately audit unreciprocated accounts, examine your true mutual relationships, and detect historical changes. 100% private, executed locally in your browser memory.
          </p>
        </div>

        {/* Action Button: Luxury Monochrome */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onOpenImport}
            className="px-6 py-3.5 bg-white hover:bg-neutral-100 text-[#0C0D0F] font-semibold text-xs tracking-wider uppercase rounded-lg transition-all cursor-pointer text-center active:scale-[0.99] shadow-sm flex items-center justify-center space-x-2.5"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import Your Instagram Archive (ZIP / JSON)</span>
          </button>
        </div>
      </div>

      {/* 3 Step Protocol Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
        <div className="p-6 bg-[#131418] border border-white/[0.08] rounded-xl space-y-2.5 min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Protocol 01
          </div>
          <h3 className="text-sm font-medium text-white">
            Request official archive
          </h3>
          <p className="text-xs text-[#8E909D] leading-relaxed">
            In Instagram &rarr; Accounts Center &rarr; Your information &rarr; Download your information. Select JSON format.
          </p>
        </div>

        <div className="p-6 bg-[#131418] border border-white/[0.08] rounded-xl space-y-2.5 min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Protocol 02
          </div>
          <h3 className="text-sm font-medium text-white">
            Client-side evaluation
          </h3>
          <p className="text-xs text-[#8E909D] leading-relaxed">
            Drop the downloaded ZIP archive into the vault. Parsing occurs entirely in browser memory. Zero credentials or passwords needed.
          </p>
        </div>

        <div className="p-6 bg-[#131418] border border-white/[0.08] rounded-xl space-y-2.5 min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Protocol 03
          </div>
          <h3 className="text-sm font-medium text-white">
            Audit relationships
          </h3>
          <p className="text-xs text-[#8E909D] leading-relaxed">
            Instantly view non-followers, mutuals, fans, and compare future archive dates to detect who unfollowed you over time.
          </p>
        </div>
      </div>
    </div>
  );
};
