import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface HeroViewProps {
  userName?: string;
  onOpenImport: () => void;
  onOpenConnect: () => void;
  onLoadVerifiedArchive: () => void;
  isLoadingVerified: boolean;
}

// Sample accounts representing the verified regression dataset for the live preview
const PREVIEW_SAMPLE_ACCOUNTS = [
  { username: 'alex_adams', state: 'Mutual', since: 'Aug 2024', category: 'mutuals' },
  { username: 'brandon_blake', state: 'Mutual', since: 'Sep 2024', category: 'mutuals' },
  { username: 'claire_cohen', state: 'Mutual', since: 'Oct 2024', category: 'mutuals' },
  { username: 'daniel_davis', state: "Doesn't follow back", since: 'Nov 2024', category: 'unreciprocated' },
  { username: 'elena_evans', state: "Doesn't follow back", since: 'Dec 2024', category: 'unreciprocated' },
  { username: 'reader_fan_001', state: 'Lost follower', since: 'Severed check-in 2', category: 'lost' },
];

export const HeroView: React.FC<HeroViewProps> = ({
  userName,
  onOpenImport,
  onOpenConnect,
  onLoadVerifiedArchive,
  isLoadingVerified,
}) => {
  const [previewTab, setPreviewTab] = useState<'all' | 'mutuals' | 'unreciprocated' | 'lost'>('all');
  const [previewSearch, setPreviewSearch] = useState('');
  const [selectedPreviewUser, setSelectedPreviewUser] = useState<string | null>('alex_adams');

  const filteredPreview = PREVIEW_SAMPLE_ACCOUNTS.filter(acc => {
    const matchesTab = previewTab === 'all' || acc.category === previewTab;
    const matchesSearch = acc.username.toLowerCase().includes(previewSearch.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const activeUser = PREVIEW_SAMPLE_ACCOUNTS.find(a => a.username === selectedPreviewUser);

  const firstName = userName ? userName.split(' ')[0] : null;

  return (
    <div className="w-full max-w-5xl mx-auto py-12 md:py-20 space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EFECE6] border border-[#E0DCD3] text-xs font-mono text-[#55514B]">
          <span className="w-2 h-2 rounded-full bg-[#2E7D52]" />
          <span>{firstName ? 'Authenticated Follow Signal Workspace' : 'Private & client-side by default'}</span>
        </div>

        {firstName ? (
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-sans font-extrabold tracking-tight text-[#111111] leading-none">
              Hi, {firstName}.
            </h1>
            <p className="text-xl sm:text-2xl font-serif italic text-[#44403C]">
              Your workspace.
            </p>
            <p className="text-sm sm:text-base text-[#6E6A63] font-sans max-w-lg mx-auto leading-relaxed pt-1">
              Connect your Instagram or import an archive to explore your circle over time.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="text-5xl sm:text-7xl font-sans font-extrabold tracking-tight text-[#111111] leading-none">
              FOLLOW<br />
              <span className="text-[#33302A]">SIGNAL</span>
            </h1>

            <p className="text-xl sm:text-2xl font-sans font-medium text-[#44403C] tracking-tight">
              Your Instagram circle, over time.
            </p>

            <p className="text-sm sm:text-base text-[#6E6A63] font-sans max-w-lg mx-auto leading-relaxed">
              Understand who follows you, who you follow, and what changes between check-ins. No passwords, no scraping, no tracking.
            </p>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenConnect}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#111111] hover:bg-[#2A2A2A] text-white font-sans text-xs font-semibold tracking-wider uppercase rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            Connect Instagram
          </button>

          <button
            onClick={onOpenImport}
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#F3EFE8] border border-[#D5D0C5] text-[#111111] font-sans text-xs font-semibold tracking-wider uppercase rounded-xl shadow-xs transition active:scale-[0.99] cursor-pointer"
          >
            Import archive
          </button>
        </div>

        <div className="pt-2">
          <button
            onClick={onLoadVerifiedArchive}
            disabled={isLoadingVerified}
            className="text-xs text-[#6E6A63] hover:text-[#111111] font-mono underline underline-offset-4 cursor-pointer transition disabled:opacity-50"
          >
            {isLoadingVerified
              ? 'Loading verified dataset (163 followers)...'
              : 'Or explore verified sample archive (163 followers) →'}
          </button>
        </div>
      </div>

      {/* Live Interactive Product Preview */}
      <div className="bg-white border border-[#E5E1D8] rounded-2xl shadow-xl overflow-hidden">
        {/* Preview Top Header Bar */}
        <div className="bg-[#FAF8F5] border-b border-[#E5E1D8] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#111111]" />
            <span className="text-xs font-mono font-bold tracking-wider text-[#111111] uppercase">
              INTERACTIVE PREVIEW
            </span>
            <span className="px-2 py-0.5 rounded bg-[#FAF1E4] text-[#8C6338] text-[10px] font-mono font-semibold border border-[#EADAC5]">
              DEMO MODE
            </span>
          </div>

          <span className="text-xs font-mono text-[#6E6A63]">
            Verified test archive: 163 followers · 75 following · 60 mutuals
          </span>
        </div>

        {/* Preview Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#E5E1D8]">
          {/* Left Column: Filter Tabs & Search */}
          <div className="md:col-span-7 p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto text-xs font-mono">
                <button
                  onClick={() => setPreviewTab('all')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    previewTab === 'all'
                      ? 'bg-[#111111] text-white font-semibold'
                      : 'text-[#6E6A63] hover:bg-[#F3EFE8]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPreviewTab('mutuals')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    previewTab === 'mutuals'
                      ? 'bg-[#111111] text-white font-semibold'
                      : 'text-[#6E6A63] hover:bg-[#F3EFE8]'
                  }`}
                >
                  Mutuals (60)
                </button>
                <button
                  onClick={() => setPreviewTab('unreciprocated')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    previewTab === 'unreciprocated'
                      ? 'bg-[#111111] text-white font-semibold'
                      : 'text-[#6E6A63] hover:bg-[#F3EFE8]'
                  }`}
                >
                  Doesn&apos;t follow (15)
                </button>
                <button
                  onClick={() => setPreviewTab('lost')}
                  className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                    previewTab === 'lost'
                      ? 'bg-[#111111] text-white font-semibold'
                      : 'text-[#6E6A63] hover:bg-[#F3EFE8]'
                  }`}
                >
                  Lost (2)
                </button>
              </div>

              {/* Minimal Search Input */}
              <div className="relative">
                <input
                  type="text"
                  value={previewSearch}
                  onChange={e => setPreviewSearch(e.target.value)}
                  placeholder="Filter handle..."
                  className="w-full sm:w-40 bg-[#FBF9F5] border border-[#D5D0C5] rounded-md px-2.5 py-1 text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111]"
                />
              </div>
            </div>

            {/* Account List Rows */}
            <div className="divide-y divide-[#F0ECE1] border border-[#F0ECE1] rounded-lg overflow-hidden">
              {filteredPreview.map(acc => {
                const isSelected = selectedPreviewUser === acc.username;
                return (
                  <div
                    key={acc.username}
                    onClick={() => setSelectedPreviewUser(acc.username)}
                    className={`p-3 flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF8F5] border-l-3 border-[#111111]'
                        : 'hover:bg-[#FBF9F5]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-[#E8E4DC] text-[#44403C] flex items-center justify-center font-mono text-xs font-bold">
                        {acc.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-[#111111]">
                          @{acc.username}
                        </div>
                        <div className="text-[11px] text-[#6E6A63] font-sans">
                          {acc.since}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                          acc.category === 'mutuals'
                            ? 'bg-[#EBF5EE] text-[#2E7D52]'
                            : acc.category === 'lost'
                            ? 'bg-[#FBEBEA] text-[#B83A2E] line-through'
                            : 'bg-[#F7F3EC] text-[#8C6338]'
                        }`}
                      >
                        {acc.state}
                      </span>
                      <span className="text-xs text-[#99948B]">→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Mini Profile Inspector Drawer */}
          <div className="md:col-span-5 p-4 sm:p-6 bg-[#FAF9F7] flex flex-col justify-between space-y-6">
            {activeUser ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
                  <span className="text-[10px] font-mono tracking-wider uppercase text-[#6E6A63]">
                    PERSON DETAIL PREVIEW
                  </span>
                  <span className="text-[10px] font-mono text-[#2E7D52] bg-[#2E7D52]/10 px-2 py-0.5 rounded">
                    Active selection
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono font-bold text-sm">
                    {activeUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <h4 className="text-lg font-bold text-[#111111] font-mono">
                    @{activeUser.username}
                  </h4>
                  <p className="text-xs font-mono text-[#6E6A63]">
                    Status: <strong className="text-[#111111]">{activeUser.state}</strong>
                  </p>
                </div>

                <div className="p-3 bg-white border border-[#E5E1D8] rounded-lg space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-[#6E6A63]">
                    <span>First observed</span>
                    <span className="text-[#111111]">Aug 12, 2024</span>
                  </div>
                  <div className="flex justify-between text-[#6E6A63]">
                    <span>Last check-in</span>
                    <span className="text-[#111111]">Present snapshot</span>
                  </div>
                  <div className="flex justify-between text-[#6E6A63]">
                    <span>Relationship type</span>
                    <span className="text-[#111111]">
                      {activeUser.category === 'mutuals'
                        ? 'Two-way reciprocal'
                        : activeUser.category === 'lost'
                        ? 'Severed bond'
                        : 'Unreciprocated'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="pt-4 border-t border-[#E5E1D8]">
              <button
                onClick={onLoadVerifiedArchive}
                disabled={isLoadingVerified}
                className="w-full py-2.5 px-4 bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-sans font-semibold rounded-lg transition cursor-pointer text-center"
              >
                {isLoadingVerified
                  ? 'Loading...'
                  : 'Load full 163-account dataset →'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trust & Transparency Feature Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left border-t border-[#E5E1D8]">
        <div className="space-y-1.5">
          <div className="font-mono text-xs font-bold text-[#111111] uppercase tracking-wider">
            100% In-Browser Privacy
          </div>
          <p className="text-xs text-[#6E6A63] leading-relaxed">
            Your ZIP archive is decompressed and parsed entirely inside browser memory via JSZip. No user data is sent to external servers.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="font-mono text-xs font-bold text-[#111111] uppercase tracking-wider">
            Temporal Check-in Diffs
          </div>
          <p className="text-xs text-[#6E6A63] leading-relaxed">
            Import new archives over time to detect exact additions, deletions, unreciprocated changes, and close friend adjustments.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="font-mono text-xs font-bold text-[#111111] uppercase tracking-wider">
            Official Meta Support
          </div>
          <p className="text-xs text-[#6E6A63] leading-relaxed">
            Connect an eligible Creator or Business account via official Instagram Login for verified profile synchronization.
          </p>
        </div>
      </div>
    </div>
  );
};
