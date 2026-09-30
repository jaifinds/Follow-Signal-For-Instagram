import React, { useState, useMemo } from 'react';
import { Snapshot, SnapshotComparison } from '../types';
import { compareSnapshots } from '../lib/snapshotEngine';

interface TimeMachineViewProps {
  snapshots: Snapshot[];
  onSimulateSecondCheckIn?: () => void;
  onSelectProfile: (username: string) => void;
}

export const TimeMachineView: React.FC<TimeMachineViewProps> = ({
  snapshots,
  onSimulateSecondCheckIn,
  onSelectProfile,
}) => {
  const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState(() =>
    Math.max(0, snapshots.length - 1)
  );

  const activeSnapshot = snapshots[selectedSnapshotIndex] || snapshots[0];
  const previousSnapshot =
    selectedSnapshotIndex > 0 ? snapshots[selectedSnapshotIndex - 1] : null;

  // Compute differences against prior snapshot using verified snapshotEngine
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
    <div className="space-y-8 animate-fade-in select-none text-[#F5F5F2]">
      {/* Title & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#1C1C1A] pb-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#5F5F5B]">
            TEMPORAL SCRUBBER
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-[#F5F5F2] tracking-tight mt-1">
            Time Machine
          </h2>
          <p className="text-xs font-sans text-[#9A9A96] mt-1">
            Scrub across chronological checkpoints to witness topological changes in your social circle.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-[#F5F5F2] bg-[#0D0D0D] px-3 py-1.5 rounded-lg border border-[#1C1C1A]">
            {formatDate(activeSnapshot?.effectiveAt || (activeSnapshot as any)?.createdAt)} · {activeSnapshot?.label}
          </span>
        </div>
      </div>

      {/* Tactile Scrubber Module */}
      <div className="bg-[#080808] border border-[#1C1C1A] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between text-xs font-mono text-[#5F5F5B]">
          <span className="uppercase tracking-wider">CHRONOLOGICAL POSITION</span>
          <span>
            CHECKPOINT {selectedSnapshotIndex + 1} OF {snapshots.length}
          </span>
        </div>

        {hasMultipleSnapshots ? (
          <div className="space-y-4 pt-2">
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              step={1}
              value={selectedSnapshotIndex}
              onChange={e => setSelectedSnapshotIndex(parseInt(e.target.value, 10))}
              className="w-full accent-[#FF3048] cursor-pointer h-2 bg-[#1C1C1A] rounded-lg"
            />
            <div className="flex justify-between text-xs font-mono text-[#5F5F5B]">
              {snapshots.map((snap, idx) => (
                <button
                  key={snap.id}
                  onClick={() => setSelectedSnapshotIndex(idx)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    idx === selectedSnapshotIndex
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-bold'
                      : 'hover:text-[#9A9A96] hover:bg-[#0D0D0D]'
                  }`}
                >
                  {snap.label || `#${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-3">
            <p className="text-xs text-[#9A9A96] leading-relaxed">
              Baseline snapshot active. To observe temporal mutations, import a second archive or test with a simulated second check-in.
            </p>
            {onSimulateSecondCheckIn && (
              <button
                onClick={onSimulateSecondCheckIn}
                className="py-2 px-3.5 bg-[#0D0D0D] hover:bg-[#141414] border border-[#1C1C1A] text-[#F5F5F2] rounded-lg text-xs font-mono transition cursor-pointer"
              >
                Simulate Second Check-in (+3 new / -2 severed) →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Comparative Delta Analysis */}
      {diffComparison ? (
        <div className="space-y-6">
          <div className="text-[11px] font-mono tracking-wider uppercase text-[#5F5F5B]">
            MUTATION SUMMARY (VERSUS PREVIOUS CHECKPOINT)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 bg-[#050505] border border-[#1C1C1A] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#5F5F5B] block">New Followers</span>
              <span className="text-3xl font-mono font-bold text-[#2E9E60]">
                +{diffComparison.newFollowers.length}
              </span>
            </div>

            <div className="p-5 bg-[#050505] border border-[#1C1C1A] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#5F5F5B] block">Severed / Lost</span>
              <span className="text-3xl font-mono font-bold text-[#FF3048]">
                -{diffComparison.lostFollowers.length}
              </span>
            </div>

            <div className="p-5 bg-[#050505] border border-[#1C1C1A] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#5F5F5B] block">New Following</span>
              <span className="text-3xl font-mono font-bold text-[#F5F5F2]">
                +{diffComparison.newFollowing.length}
              </span>
            </div>

            <div className="p-5 bg-[#050505] border border-[#1C1C1A] rounded-xl space-y-1">
              <span className="text-[10px] font-mono uppercase text-[#5F5F5B] block">Unfollowed</span>
              <span className="text-3xl font-mono font-bold text-[#9A9A96]">
                -{diffComparison.unfollowed.length}
              </span>
            </div>
          </div>

          {/* Granular Account Deltas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* New Followers Roster */}
            <div className="p-5 bg-[#050505] border border-[#1C1C1A] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#2E9E60]">
                <span>NEW ARRIVALS (+{diffComparison.newFollowers.length})</span>
              </div>

              {diffComparison.newFollowers.length > 0 ? (
                <div className="space-y-1.5">
                  {diffComparison.newFollowers.map(handle => (
                    <div
                      key={handle}
                      onClick={() => onSelectProfile(handle)}
                      className="p-2.5 bg-[#0A0A0A] hover:bg-[#141414] rounded-lg flex items-center justify-between font-mono text-xs cursor-pointer transition"
                    >
                      <span className="text-[#F5F5F2]">@{handle}</span>
                      <span className="text-[#2E9E60] text-[10px]">Followed you</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#5F5F5B] italic py-2">
                  No new followers between these two checkpoints.
                </p>
              )}
            </div>

            {/* Severed / Lost Followers Roster */}
            <div className="p-5 bg-[#050505] border border-[#1C1C1A] rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-[#FF3048]">
                <span>SEVERED CONNECTIONS (-{diffComparison.lostFollowers.length})</span>
              </div>

              {diffComparison.lostFollowers.length > 0 ? (
                <div className="space-y-1.5">
                  {diffComparison.lostFollowers.map(handle => (
                    <div
                      key={handle}
                      onClick={() => onSelectProfile(handle)}
                      className="p-2.5 bg-[#0A0A0A] hover:bg-[#141414] rounded-lg flex items-center justify-between font-mono text-xs cursor-pointer transition"
                    >
                      <span className="text-[#F5F5F2]">@{handle}</span>
                      <span className="text-[#FF3048] text-[10px]">No longer following</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-[#5F5F5B] italic py-2">
                  Zero lost followers between these two checkpoints.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-[#050505] border border-[#1C1C1A] rounded-xl text-center space-y-2">
          <p className="font-mono text-xs text-[#9A9A96]">
            This is your baseline checkpoint ({activeSnapshot?.label}).
          </p>
          <p className="text-xs text-[#5F5F5B]">
            Future check-in archives reveal the exact people who joined or departed your circle.
          </p>
        </div>
      )}
    </div>
  );
};
