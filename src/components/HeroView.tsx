import React from 'react';

interface HeroViewProps {
  userName?: string;
  onOpenImport: () => void;
  onOpenConnect: () => void;
  onLoadVerifiedArchive: () => void;
  isLoadingVerified: boolean;
}

export const HeroView: React.FC<HeroViewProps> = ({
  userName,
  onOpenImport,
  onOpenConnect,
  onLoadVerifiedArchive,
  isLoadingVerified,
}) => {
  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div className="w-full max-w-5xl mx-auto py-16 sm:py-24 space-y-20 select-none animate-fade-in">
      {/* Editorial Headline & Status */}
      <div className="max-w-3xl space-y-6">
        <div className="inline-flex items-center space-x-2.5 px-3 py-1 rounded-full bg-[#0D0D0D] border border-[#1C1C1A] text-[11px] font-mono text-[#9A9A96]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF3048] shadow-[0_0_6px_rgba(255,48,72,0.8)]" />
          <span>
            {firstName ? `WORKSPACE ACTIVE · ${firstName.toUpperCase()}` : 'RELATIONSHIP INTELLIGENCE'}
          </span>
        </div>

        {firstName ? (
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-sans font-extrabold tracking-tight text-[#F5F5F2] leading-none">
              Hi, {firstName}.
            </h1>
            <p className="text-xl sm:text-2xl font-serif italic text-[#9A9A96]">
              Your workspace is ready.
            </p>
            <p className="text-sm sm:text-base text-[#5F5F5B] max-w-xl leading-relaxed pt-1">
              Import an official Instagram archive to inspect mutual connections, identify unreciprocated following, and track changes across snapshots.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-sans font-extrabold tracking-tight text-[#F5F5F2] leading-[1.05]">
              YOUR CIRCLE,<br />
              <span className="text-[#5F5F5B]">OVER TIME.</span>
            </h1>

            <p className="text-lg sm:text-xl text-[#9A9A96] font-sans max-w-xl leading-relaxed">
              Understand who follows you, who you follow, and what changes between check-ins. No passwords, no scraping, no tracking.
            </p>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-4">
          <button
            onClick={onOpenImport}
            className="px-7 py-4 bg-[#F5F5F2] hover:bg-white text-black font-sans text-xs font-semibold tracking-wider uppercase rounded-xl shadow-lg transition active:scale-[0.99] cursor-pointer text-center"
          >
            Import Instagram Archive
          </button>

          <button
            onClick={onOpenConnect}
            className="px-7 py-4 bg-[#0D0D0D] hover:bg-[#141414] border border-[#1C1C1A] hover:border-[#262624] text-[#F5F5F2] font-sans text-xs font-semibold tracking-wider uppercase rounded-xl transition active:scale-[0.99] cursor-pointer text-center"
          >
            Connect Instagram
          </button>
        </div>

        {/* Baseline Verification Dataset Link */}
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
      </div>

      {/* Architectural Pillars — Editorial Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#1C1C1A]">
        {/* Pillar 01 */}
        <div className="space-y-3 font-sans">
          <div className="text-[11px] font-mono text-[#5F5F5B] tracking-wider uppercase">
            01 / EXTRACTION
          </div>
          <h3 className="text-base font-bold text-[#F5F5F2] tracking-tight">
            Local In-Browser Parsing
          </h3>
          <p className="text-xs text-[#9A9A96] leading-relaxed">
            Upload your Meta data export (ZIP or JSON). All decryption and parsing executes locally inside your browser memory. Zero relationship files leave your machine.
          </p>
        </div>

        {/* Pillar 02 */}
        <div className="space-y-3 font-sans">
          <div className="text-[11px] font-mono text-[#5F5F5B] tracking-wider uppercase">
            02 / RESOLUTION
          </div>
          <h3 className="text-base font-bold text-[#F5F5F2] tracking-tight">
            Mathematical Precision
          </h3>
          <p className="text-xs text-[#9A9A96] leading-relaxed">
            Exact set operations resolve mutual bonds, unreciprocated following, and close friends without relying on fragile web scrapers or unauthorized APIs.
          </p>
        </div>

        {/* Pillar 03 */}
        <div className="space-y-3 font-sans">
          <div className="text-[11px] font-mono text-[#5F5F5B] tracking-wider uppercase">
            03 / DIFF ENGINE
          </div>
          <h3 className="text-base font-bold text-[#F5F5F2] tracking-tight">
            Temporal Check-ins
          </h3>
          <p className="text-xs text-[#9A9A96] leading-relaxed">
            Import consecutive snapshots to scrub through history with the Time Machine, revealing newly acquired followers and verified severed connections.
          </p>
        </div>
      </div>
    </div>
  );
};
