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

  // Compute differences against prior snapshot
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm space-y-1">
        <span className="text-[11px] font-mono tracking-wider text-[#6E6A63] uppercase">
          TEMPORAL RELATIONSHIP ENGINE
        </span>
        <h2 className="text-2xl font-sans font-bold text-[#111111] tracking-tight">
          Time machine.
        </h2>
        <p className="text-xs font-sans text-[#6E6A63]">
          Scrub through check-in snapshots to observe how your social circle evolved.
        </p>
      </div>

      {/* Interactive Timeline Scrubber Card */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#6E6A63]">
          <span className="font-semibold text-[#111111] uppercase tracking-wider">
            ACTIVE SNAPSHOT IN TIME
          </span>
          <span className="bg-[#FAF8F5] px-2.5 py-1 rounded border border-[#E5E1D8] text-[#111111]">
            {formatDate(activeSnapshot?.createdAt)} · {activeSnapshot?.label}
          </span>
        </div>

        {hasMultipleSnapshots ? (
          <div className="space-y-3 pt-2">
            <input
              type="range"
              min={0}
              max={snapshots.length - 1}
              step={1}
              value={selectedSnapshotIndex}
              onChange={e => setSelectedSnapshotIndex(parseInt(e.target.value, 10))}
              className="w-full accent-[#111111] cursor-pointer h-2 bg-[#EFECE6] rounded-lg"
            />
            <div className="flex justify-between text-xs font-mono text-[#6E6A63]">
              {snapshots.map((snap, idx) => (
                <button
                  key={snap.id}
                  onClick={() => setSelectedSnapshotIndex(idx)}
                  className={`px-2 py-1 rounded transition cursor-pointer ${
                    idx === selectedSnapshotIndex
                      ? 'bg-[#111111] text-white font-bold'
                      : 'hover:text-[#111111] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {snap.label || `#${idx + 1}`}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-3">
            <p className="text-xs text-[#6E6A63] leading-relaxed">
              Baseline snapshot active. To observe temporal mutations, import a second archive or simulate the second check-in diff.
            </p>
            {onSimulateSecondCheckIn && (
              <button
                onClick={onSimulateSecondCheckIn}
                className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#D5D0C5] text-[#111111] text-xs font-sans font-medium rounded-lg transition cursor-pointer"
              >
                + Ingest Second Check-In Archive (+3 / −2 followers)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Snapshot Ledger Changes Card */}
      {diffComparison ? (
        <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
          <span className="text-xs font-mono tracking-wider text-[#6E6A63] uppercase font-bold block border-b border-[#F0ECE1] pb-2.5">
            CHANGES DETECTED AT THIS CHECK-IN
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
            <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#E5E1D8]">
              <span className="text-[#2E7D52] font-bold block mb-2 text-sm">
                +{diffComparison.newFollowers.length} NEW FOLLOWERS
              </span>
              <div className="space-y-1.5">
                {diffComparison.newFollowers.map(h => (
                  <button
                    key={h}
                    onClick={() => onSelectProfile(h)}
                    className="block text-[#111111] hover:underline font-semibold"
                  >
                    @{h}
                  </button>
                ))}
                {diffComparison.newFollowers.length === 0 && (
                  <span className="text-[#99948B]">None recorded</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#E5E1D8]">
              <span className="text-[#B83A2E] font-bold block mb-2 text-sm">
                −{diffComparison.lostFollowers.length} SEVERED BONDS
              </span>
              <div className="space-y-1.5">
                {diffComparison.lostFollowers.map(h => (
                  <button
                    key={h}
                    onClick={() => onSelectProfile(h)}
                    className="block text-[#B83A2E] hover:underline line-through font-semibold"
                  >
                    @{h}
                  </button>
                ))}
                {diffComparison.lostFollowers.length === 0 && (
                  <span className="text-[#99948B]">None recorded</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#E5E1D8]">
              <span className="text-[#8C6338] font-bold block mb-2 text-sm">
                +{diffComparison.becameMutual.length} BECAME MUTUAL
              </span>
              <div className="space-y-1.5">
                {diffComparison.becameMutual.map(h => (
                  <button
                    key={h}
                    onClick={() => onSelectProfile(h)}
                    className="block text-[#8C6338] hover:underline font-semibold"
                  >
                    @{h}
                  </button>
                ))}
                {diffComparison.becameMutual.length === 0 && (
                  <span className="text-[#99948B]">None recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 bg-white border border-[#E5E1D8] rounded-xl text-xs font-mono text-[#6E6A63] shadow-sm">
          Initial baseline checkpoint. All subsequent imported archives will compute exact mathematical set differences.
        </div>
      )}

      {/* 2D Topological Spatial Map */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2.5">
          <span className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
            TOPOLOGICAL CIRCLE MAP
          </span>
          <span className="text-xs font-mono text-[#6E6A63]">
            {activeSnapshot?.followersCount} followers · {activeSnapshot?.followingCount} following
          </span>
        </div>

        <div className="relative w-full h-72 sm:h-80 bg-[#FAF9F7] rounded-xl border border-[#E5E1D8] overflow-hidden flex items-center justify-center">
          {/* Subtle concentric rings */}
          <div className="absolute w-28 h-28 rounded-full border border-[#E5E1D8]" />
          <div className="absolute w-52 h-52 rounded-full border border-[#E5E1D8]" />
          <div className="absolute w-72 h-72 rounded-full border border-[#E5E1D8]" />
          <div className="absolute w-full h-[1px] bg-[#EAE6DE]" />
          <div className="absolute h-full w-[1px] bg-[#EAE6DE]" />

          {/* Center Anchor */}
          <div className="relative z-10 w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono text-xs font-bold shadow-md">
            YOU
          </div>

          {activeSnapshot && (
            <>
              {/* Mutuals arc */}
              {(activeSnapshot.mutuals || []).slice(0, 8).map((handle, idx) => {
                const angle = -0.8 + idx * 0.22;
                const r = 50 + (idx % 3) * 12;
                const x = Math.sin(angle) * r;
                const y = Math.cos(angle) * r;
                return (
                  <button
                    key={handle}
                    onClick={() => onSelectProfile(handle)}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className="absolute z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#2E7D52] text-[#2E7D52] hover:bg-[#2E7D52] hover:text-white transition cursor-pointer shadow-xs"
                    title={`Mutual: @${handle}`}
                  >
                    @{handle}
                  </button>
                );
              })}

              {/* Unreciprocated flank */}
              {(activeSnapshot.followingNotFollowingBack || []).slice(0, 5).map((handle, idx) => {
                const x = -88 - (idx % 2) * 20;
                const y = -35 + idx * 22;
                return (
                  <button
                    key={handle}
                    onClick={() => onSelectProfile(handle)}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className="absolute z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#8C6338] text-[#8C6338] hover:bg-[#8C6338] hover:text-white transition cursor-pointer shadow-xs"
                    title={`Doesn't follow back: @${handle}`}
                  >
                    @{handle}
                  </button>
                );
              })}

              {/* Inbound fans flank */}
              {(activeSnapshot.followersNotFollowedBack || []).slice(0, 5).map((handle, idx) => {
                const x = 88 + (idx % 2) * 20;
                const y = -35 + idx * 22;
                return (
                  <button
                    key={handle}
                    onClick={() => onSelectProfile(handle)}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className="absolute z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-white border border-[#D5D0C5] text-[#6E6A63] hover:border-[#111111] hover:text-[#111111] transition cursor-pointer shadow-xs"
                    title={`Follower: @${handle}`}
                  >
                    @{handle}
                  </button>
                );
              })}

              {/* Lost followers if present */}
              {diffComparison?.lostFollowers.map((handle, idx) => {
                const x = -40 + idx * 45;
                const y = -105;
                return (
                  <button
                    key={handle}
                    onClick={() => onSelectProfile(handle)}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className="absolute z-10 px-2 py-0.5 rounded text-[10px] font-mono bg-[#FBEBEA] border border-[#B83A2E] text-[#B83A2E] line-through transition cursor-pointer shadow-xs"
                    title={`Severed: @${handle}`}
                  >
                    @{handle}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
