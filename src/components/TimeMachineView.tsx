import React, { useState, useMemo } from 'react';
import { Snapshot, SnapshotComparison } from '../types';
import { compareSnapshots } from '../lib/snapshotEngine';

interface TimeMachineViewProps {
  snapshots: Snapshot[];
  onOpenImport?: () => void;
  onSelectProfile: (username: string) => void;
}

export const TimeMachineView: React.FC<TimeMachineViewProps> = ({
  snapshots,
  onOpenImport,
  onSelectProfile,
}) => {
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(() =>
    Math.max(0, snapshots.length - 1)
  );

  const activeSnapshot = snapshots[selectedSnapshotIndex] || snapshots[0];
  const previousSnapshot =
    selectedSnapshotIndex > 0 ? snapshots[selectedSnapshotIndex - 1] : null;

  const diffComparison: SnapshotComparison | null = useMemo(() => {
    if (!activeSnapshot || !previousSnapshot) return null;
    return compareSnapshots(previousSnapshot, activeSnapshot);
  }, [activeSnapshot, previousSnapshot]);

  const hasMultipleSnapshots = snapshots.length > 1;

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in select-none text-white w-full min-w-0">
      
      {/* Title & Metadata Strip */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 sm:pb-6 border-b border-white/[0.08] min-w-0">
        <div className="min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Temporal Chronology
          </div>
          <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight mt-1 truncate">
            Follower Changes
          </h2>
          <p className="text-xs text-[#8E909D] mt-1 font-normal">
            Audit delta changes across checkpoints to detect who unfollowed or started following you.
          </p>
        </div>

        <span className="text-xs text-[#D1D3DC] bg-[#131418] px-3.5 py-1.5 rounded border border-white/[0.08] font-mono shrink-0">
          {formatDate(activeSnapshot?.effectiveAt || (activeSnapshot as any)?.createdAt)} · {activeSnapshot?.label}
        </span>
      </div>

      {/* Scrubber & Timeline Module */}
      <div className="p-5 sm:p-6 bg-[#131418] border border-white/[0.08] rounded-xl space-y-4 min-w-0">
        <div className="flex items-center justify-between text-xs text-[#8E909D] font-mono">
          <span className="uppercase tracking-widest text-[10px]">Checkpoint Timeline</span>
          <span>
            Checkpoint {selectedSnapshotIndex + 1} of {snapshots.length}
          </span>
        </div>

        {hasMultipleSnapshots ? (
          <div className="space-y-3 min-w-0">
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              step={1}
              value={selectedSnapshotIndex}
              onChange={e => setSelectedSnapshotIndex(parseInt(e.target.value, 10))}
              className="w-full accent-white cursor-pointer h-1.5 bg-[#1A1C22] rounded-lg"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              {snapshots.map((snap, idx) => (
                <button
                  key={snap.id}
                  onClick={() => setSelectedSnapshotIndex(idx)}
                  className={`px-3 py-1.5 rounded transition cursor-pointer font-mono text-xs border ${
                    idx === selectedSnapshotIndex
                      ? 'bg-white border-white text-[#0C0D0F] font-semibold'
                      : 'bg-[#131418] border-white/[0.08] text-[#8E909D] hover:text-white'
                  }`}
                >
                  {snap.label || `Checkpoint #${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-4">
            <p className="text-xs text-[#8E909D] leading-relaxed">
              Baseline checkpoint active ({activeSnapshot?.label}). Follow Signal compares consecutive archive exports to automatically calculate who unfollowed you and who followed you.
            </p>

            <div className="flex items-center gap-3 pt-1">
              {onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="px-4 py-2.5 bg-white hover:bg-neutral-100 text-[#0C0D0F] font-semibold text-xs rounded transition-all cursor-pointer flex items-center justify-center space-x-2 tracking-wide"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Import Newer Archive Checkpoint</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparative Delta Analysis */}
      {diffComparison ? (
        <div className="space-y-5 min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Changes Since Prior Checkpoint
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 min-w-0">
            <div className="p-4 bg-[#131418] border border-white/[0.08] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-mono font-medium uppercase text-[#2A8F53] block truncate">New Followers</span>
              <span className="text-2xl sm:text-3xl font-light text-white tabular-nums font-mono">
                +{diffComparison.newFollowers.length}
              </span>
            </div>

            <div className="p-4 bg-[#131418] border border-white/[0.08] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-mono font-medium uppercase text-[#D94444] block truncate">Lost Followers</span>
              <span className="text-2xl sm:text-3xl font-light text-white tabular-nums font-mono">
                -{diffComparison.lostFollowers.length}
              </span>
            </div>

            <div className="p-4 bg-[#131418] border border-white/[0.08] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-mono font-medium uppercase text-[#D1D3DC] block truncate">New Following</span>
              <span className="text-2xl sm:text-3xl font-light text-white tabular-nums font-mono">
                +{diffComparison.newFollowing.length}
              </span>
            </div>

            <div className="p-4 bg-[#131418] border border-white/[0.08] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-mono font-medium uppercase text-[#8E909D] block truncate">Unfollowed</span>
              <span className="text-2xl sm:text-3xl font-light text-white tabular-nums font-mono">
                -{diffComparison.unfollowed.length}
              </span>
            </div>
          </div>

          {/* Granular Deltas List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 min-w-0">
            
            {/* New Followers Roster */}
            <div className="space-y-2 min-w-0">
              <div className="text-xs font-mono font-medium text-[#2A8F53] uppercase tracking-wide">
                New Followers (+{diffComparison.newFollowers.length})
              </div>

              {diffComparison.newFollowers.length > 0 ? (
                <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.08] min-w-0">
                  {diffComparison.newFollowers.map(handle => (
                    <div
                      key={handle}
                      onClick={() => onSelectProfile(handle)}
                      className="py-2.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-[#131418] transition min-w-0"
                    >
                      <span className="text-white font-mono font-medium truncate">@{handle}</span>
                      <span className="text-[#2A8F53] text-xs font-mono shrink-0 ml-2">+ Started following</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#565866] italic py-2">
                  No new followers detected between these dates.
                </p>
              )}
            </div>

            {/* Severed / Lost Followers Roster */}
            <div className="space-y-2 min-w-0">
              <div className="text-xs font-mono font-medium text-[#D94444] uppercase tracking-wide">
                Unfollowers (-{diffComparison.lostFollowers.length})
              </div>

              {diffComparison.lostFollowers.length > 0 ? (
                <div className="divide-y divide-white/[0.06] border-t border-b border-white/[0.08] min-w-0">
                  {diffComparison.lostFollowers.map(handle => (
                    <div
                      key={handle}
                      onClick={() => onSelectProfile(handle)}
                      className="py-2.5 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-[#131418] transition min-w-0"
                    >
                      <span className="text-white font-mono font-medium truncate">@{handle}</span>
                      <span className="text-[#D94444] text-xs font-mono shrink-0 ml-2">&minus; Stopped following</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#565866] italic py-2">
                  Zero unfollowers recorded between these checkpoints.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-[#131418] border border-white/[0.08] rounded-xl text-center space-y-1 min-w-0">
          <p className="text-sm font-medium text-white">
            Baseline Active ({activeSnapshot?.label})
          </p>
          <p className="text-xs text-[#8E909D]">
            Add a subsequent archive checkpoint to examine follower fluctuations.
          </p>
        </div>
      )}
    </div>
  );
};
