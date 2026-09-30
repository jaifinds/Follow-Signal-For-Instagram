import React, { useState, useMemo } from 'react';
import { Snapshot, SnapshotComparison } from '../types';
import { compareSnapshots } from '../lib/snapshotEngine';

interface TimeMachineViewProps {
  snapshots: Snapshot[];
  onSimulateSecondCheckIn?: () => void;
  onOpenImport?: () => void;
  onSelectProfile: (username: string) => void;
}

export const TimeMachineView: React.FC<TimeMachineViewProps> = ({
  snapshots,
  onSimulateSecondCheckIn,
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
    <div className="space-y-4 sm:space-y-6 animate-fade-in select-none text-[#F5F5F3] w-full min-w-0">
      
      {/* Title & Metadata Strip */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 sm:pb-5 border-b border-[#242630] min-w-0">
        <div className="min-w-0">
          <div className="text-[11px] font-mono tracking-wider text-[#C5A869] uppercase">
            Timeline
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#F5F5F3] tracking-tight mt-0.5 truncate">
            Follower Changes
          </h2>
          <p className="text-xs text-[#9596A2] mt-0.5">
            Compare checkpoints across dates to see who started or stopped following you.
          </p>
        </div>

        <span className="text-xs text-[#D4D5DC] bg-[#1A1B20] px-3.5 py-1.5 rounded-lg border border-[#242630] font-mono shrink-0">
          {formatDate(activeSnapshot?.effectiveAt || (activeSnapshot as any)?.createdAt)} · {activeSnapshot?.label}
        </span>
      </div>

      {/* Scrubber Module */}
      <div className="p-4 sm:p-5 bg-[#1A1B20] border border-[#242630] rounded-xl sm:rounded-2xl space-y-3 min-w-0">
        <div className="flex items-center justify-between text-xs text-[#9596A2] font-mono">
          <span className="uppercase tracking-wider">Checkpoint Timeline</span>
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
              className="w-full accent-[#C5A869] cursor-pointer h-2 bg-[#21232A] rounded-lg border border-[#2B2D37]"
            />
            <div className="flex flex-wrap gap-2 text-xs">
              {snapshots.map((snap, idx) => (
                <button
                  key={snap.id}
                  onClick={() => setSelectedSnapshotIndex(idx)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer font-medium border text-xs ${
                    idx === selectedSnapshotIndex
                      ? 'bg-[#C5A869] border-[#C5A869] text-[#131417] font-semibold'
                      : 'bg-[#21232A] border-[#2B2D37] text-[#9596A2] hover:text-[#F5F5F3]'
                  }`}
                >
                  {snap.label || `#${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-4">
            <p className="text-xs text-[#9596A2] leading-relaxed">
              Baseline checkpoint active ({activeSnapshot?.label}). To detect unfollowers and new followers, add a second date checkpoint.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              {onSimulateSecondCheckIn && (
                <button
                  onClick={onSimulateSecondCheckIn}
                  className="px-4 py-2 bg-[#C5A869] hover:bg-[#D4B475] text-[#131417] font-semibold text-xs rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 active:scale-95 shadow-sm"
                >
                  <span>Simulate 2nd Check-in (+3 New / -2 Unfollowed) &rarr;</span>
                </button>
              )}

              {onOpenImport && (
                <button
                  onClick={onOpenImport}
                  className="px-4 py-2 bg-[#21232A] hover:bg-[#292B33] border border-[#2B2D37] text-[#D4D5DC] text-xs font-medium rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Import Newer Archive</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comparative Delta Analysis */}
      {diffComparison ? (
        <div className="space-y-4 sm:space-y-5 min-w-0">
          <div className="text-xs font-mono tracking-wider text-[#C5A869] uppercase">
            Changes Since Prior Checkpoint
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 min-w-0">
            <div className="p-3.5 sm:p-4 bg-[#1A1B20] border border-[#242630] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-semibold uppercase text-[#2E7D47] block truncate">New Followers</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
                +{diffComparison.newFollowers.length}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 bg-[#1A1B20] border border-[#242630] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-semibold uppercase text-[#C93B3B] block truncate">Lost Followers</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
                -{diffComparison.lostFollowers.length}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 bg-[#1A1B20] border border-[#242630] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-semibold uppercase text-[#D4D5DC] block truncate">New Following</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
                +{diffComparison.newFollowing.length}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 bg-[#1A1B20] border border-[#242630] rounded-xl space-y-1 min-w-0">
              <span className="text-xs font-semibold uppercase text-[#9596A2] block truncate">Unfollowed</span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
                -{diffComparison.unfollowed.length}
              </span>
            </div>
          </div>

          {/* Granular Deltas List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 min-w-0">
            
            {/* New Followers Roster */}
            <div className="space-y-2 min-w-0">
              <div className="text-xs font-semibold text-[#2E7D47] uppercase tracking-wide">
                New Followers (+{diffComparison.newFollowers.length})
              </div>

              {diffComparison.newFollowers.length > 0 ? (
                <div className="divide-y divide-[#242630] border-t border-b border-[#242630] min-w-0">
                  {diffComparison.newFollowers.map(handle => (
                    <div
                      key={handle}
                      onClick={() => onSelectProfile(handle)}
                      className="py-2 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-[#1A1B20] transition min-w-0"
                    >
                      <span className="text-[#F5F5F3] font-mono font-medium truncate">@{handle}</span>
                      <span className="text-[#2E7D47] text-xs font-medium shrink-0 ml-2">+ Started following</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#636573] italic py-2">
                  No new followers recorded between these dates.
                </p>
              )}
            </div>

            {/* Severed / Lost Followers Roster */}
            <div className="space-y-2 min-w-0">
              <div className="text-xs font-semibold text-[#C93B3B] uppercase tracking-wide">
                Unfollowers (-{diffComparison.lostFollowers.length})
              </div>

              {diffComparison.lostFollowers.length > 0 ? (
                <div className="divide-y divide-[#242630] border-t border-b border-[#242630] min-w-0">
                  {diffComparison.lostFollowers.map(handle => (
                    <div
                      key={handle}
                      onClick={() => onSelectProfile(handle)}
                      className="py-2 px-2 flex items-center justify-between text-xs cursor-pointer hover:bg-[#1A1B20] transition min-w-0"
                    >
                      <span className="text-[#F5F5F3] font-mono font-medium truncate">@{handle}</span>
                      <span className="text-[#C93B3B] text-xs font-medium shrink-0 ml-2">&minus; Stopped following</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#636573] italic py-2">
                  Zero unfollowers between these checkpoints.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-[#1A1B20] border border-[#242630] rounded-xl text-center space-y-1 min-w-0">
          <p className="text-sm font-semibold text-[#F5F5F3]">
            Baseline Active ({activeSnapshot?.label})
          </p>
          <p className="text-xs text-[#9596A2]">
            Add a second archive checkpoint above to compare differences.
          </p>
        </div>
      )}
    </div>
  );
};
