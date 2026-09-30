import React from 'react';
import { Snapshot, RelationshipEvent, SocialProfile } from '../types';

interface OverviewViewProps {
  snapshot: Snapshot;
  previousSnapshot: Snapshot | null;
  events: RelationshipEvent[];
  profiles: Record<string, SocialProfile>;
  onSelectCategory: (category: any) => void;
  onSelectProfile: (username: string) => void;
  onNavigateToRelationships?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  snapshot,
  previousSnapshot,
  events,
  profiles,
  onSelectCategory,
  onSelectProfile,
  onNavigateToRelationships,
}) => {
  const followersCount = snapshot.followersCount;
  const followingCount = snapshot.followingCount;
  const mutualCount = snapshot.mutualCount;

  const notFollowingBackCount =
    snapshot.followingNotFollowingBack?.length ??
    Math.max(0, followingCount - mutualCount);

  const youDontFollowBackCount =
    snapshot.followersNotFollowedBack?.length ??
    Math.max(0, followersCount - mutualCount);

  const closeFriendsCount = snapshot.closeFriends?.length || 0;
  const pendingRequestsCount = snapshot.pendingRequests?.length || 0;

  // 6 preview mutuals
  const mutualsPreview = (snapshot.mutuals || []).slice(0, 6);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#E5E1D8] pb-4">
        <div>
          <span className="text-[11px] font-mono tracking-wider uppercase text-[#6E6A63]">
            CURRENT SNAPSHOT · {snapshot.label}
          </span>
          <h2 className="text-3xl font-sans font-bold text-[#111111] tracking-tight">
            Your circle.
          </h2>
        </div>

        <span className="text-xs font-mono text-[#8C6338] bg-[#FAF1E4] px-2.5 py-1 rounded-md border border-[#EADAC5]">
          Verified Data · 100% Client-side
        </span>
      </div>

      {/* Primary Big Numbers — Compact, tactile cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Followers */}
        <button
          onClick={() => onSelectCategory('FOLLOWERS')}
          className="p-5 bg-white border border-[#E5E1D8] rounded-xl hover:border-[#111111] transition text-left cursor-pointer shadow-sm group"
        >
          <div className="text-4xl sm:text-5xl font-sans font-extrabold text-[#111111] tracking-tight group-hover:text-[#8C6338] transition">
            {followersCount}
          </div>
          <div className="text-xs font-mono font-medium text-[#6E6A63] uppercase tracking-wider mt-1.5 flex items-center justify-between">
            <span>Followers</span>
            <span className="text-xs text-[#99948B] group-hover:text-[#111111]">→</span>
          </div>
        </button>

        {/* Following */}
        <button
          onClick={() => onSelectCategory('FOLLOWING')}
          className="p-5 bg-white border border-[#E5E1D8] rounded-xl hover:border-[#111111] transition text-left cursor-pointer shadow-sm group"
        >
          <div className="text-4xl sm:text-5xl font-sans font-extrabold text-[#111111] tracking-tight group-hover:text-[#8C6338] transition">
            {followingCount}
          </div>
          <div className="text-xs font-mono font-medium text-[#6E6A63] uppercase tracking-wider mt-1.5 flex items-center justify-between">
            <span>Following</span>
            <span className="text-xs text-[#99948B] group-hover:text-[#111111]">→</span>
          </div>
        </button>

        {/* Mutuals */}
        <button
          onClick={() => onSelectCategory('MUTUALS')}
          className="p-5 bg-white border border-[#E5E1D8] rounded-xl hover:border-[#111111] transition text-left cursor-pointer shadow-sm group"
        >
          <div className="text-4xl sm:text-5xl font-sans font-extrabold text-[#111111] tracking-tight group-hover:text-[#2E7D52] transition">
            {mutualCount}
          </div>
          <div className="text-xs font-mono font-medium text-[#6E6A63] uppercase tracking-wider mt-1.5 flex items-center justify-between">
            <span>Mutual bonds</span>
            <span className="text-xs text-[#99948B] group-hover:text-[#111111]">→</span>
          </div>
        </button>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
          className="p-3.5 bg-white border border-[#E5E1D8] rounded-lg hover:border-[#111111] text-left cursor-pointer transition group"
        >
          <div className="text-xl font-bold font-mono text-[#111111] group-hover:text-[#8C6338]">
            {notFollowingBackCount}
          </div>
          <div className="text-[11px] font-sans text-[#6E6A63] mt-0.5">
            Don&apos;t follow back
          </div>
        </button>

        <button
          onClick={() => onSelectCategory('YOU_DONT_FOLLOW')}
          className="p-3.5 bg-white border border-[#E5E1D8] rounded-lg hover:border-[#111111] text-left cursor-pointer transition group"
        >
          <div className="text-xl font-bold font-mono text-[#111111] group-hover:text-[#8C6338]">
            {youDontFollowBackCount}
          </div>
          <div className="text-[11px] font-sans text-[#6E6A63] mt-0.5">
            You don&apos;t follow
          </div>
        </button>

        <button
          onClick={() => onSelectCategory('CLOSE_FRIENDS')}
          className="p-3.5 bg-white border border-[#E5E1D8] rounded-lg hover:border-[#111111] text-left cursor-pointer transition group"
        >
          <div className="text-xl font-bold font-mono text-[#111111] group-hover:text-[#2E7D52]">
            {closeFriendsCount}
          </div>
          <div className="text-[11px] font-sans text-[#6E6A63] mt-0.5">
            Close friends
          </div>
        </button>

        <button
          onClick={() => onSelectCategory('REQUESTS')}
          className="p-3.5 bg-white border border-[#E5E1D8] rounded-lg hover:border-[#111111] text-left cursor-pointer transition group"
        >
          <div className="text-xl font-bold font-mono text-[#111111] group-hover:text-[#8C6338]">
            {pendingRequestsCount}
          </div>
          <div className="text-[11px] font-sans text-[#6E6A63] mt-0.5">
            Pending requests
          </div>
        </button>
      </div>

      {/* Mutual Connections Roster Preview */}
      {mutualsPreview.length > 0 && (
        <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
            <span className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
              MUTUAL CONNECTIONS SAMPLE
            </span>
            <button
              onClick={() => onSelectCategory('MUTUALS')}
              className="text-xs font-mono text-[#111111] hover:underline font-semibold cursor-pointer"
            >
              View all {mutualCount} →
            </button>
          </div>

          <div className="divide-y divide-[#F0ECE1]">
            {mutualsPreview.map(handle => {
              const lower = handle.toLowerCase();
              const prof = profiles[lower];
              return (
                <div
                  key={lower}
                  onClick={() => onSelectProfile(lower)}
                  className="py-3 px-2 flex items-center justify-between hover:bg-[#FAF8F5] rounded-md transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-full bg-[#E8E4DC] text-[#44403C] flex items-center justify-center font-mono text-xs font-bold">
                      {lower.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-mono text-xs font-bold text-[#111111]">
                      @{lower}
                    </span>
                    {prof?.displayName && (
                      <span className="text-xs text-[#6E6A63] truncate">
                        · {prof.displayName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-[#2E7D52] bg-[#EBF5EE] px-2 py-0.5 rounded">
                    Mutual
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
