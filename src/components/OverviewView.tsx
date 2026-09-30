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
  const recentRequestsCount = snapshot.recentRequests?.length || 0;

  // 6 preview mutuals
  const mutualsPreview = (snapshot.mutuals || []).slice(0, 6);

  const handleDownloadReport = () => {
    const reportData = {
      app: 'Follow Signal',
      generatedAt: new Date().toISOString(),
      snapshot: {
        id: snapshot.id,
        label: snapshot.label,
        effectiveAt: snapshot.effectiveAt,
        source: snapshot.source,
        followersCount,
        followingCount,
        mutualCount,
        notFollowingBackCount,
        youDontFollowBackCount,
        closeFriendsCount,
        pendingRequestsCount,
        recentRequestsCount,
      },
      eventsCount: events.length,
      mutuals: snapshot.mutuals || [],
      followingNotFollowingBack: snapshot.followingNotFollowingBack || [],
      followersNotFollowedBack: snapshot.followersNotFollowedBack || [],
      closeFriends: snapshot.closeFriends || [],
      pendingRequests: snapshot.pendingRequests || [],
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `follow_signal_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-12 animate-fade-in select-none">
      {/* Title Header with Snapshot Label & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#1C1C1A] pb-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#5F5F5B] flex items-center space-x-2">
            <span>ACTIVE SNAPSHOT</span>
            <span>·</span>
            <span className="text-[#9A9A96]">{snapshot.label}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-[#F5F5F2] tracking-tight mt-1">
            Social Circle Intelligence
          </h2>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleDownloadReport}
            className="text-xs font-mono text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#141414] border border-[#1C1C1A] hover:border-[#262624] px-3 py-1.5 rounded-lg transition cursor-pointer"
            title="Download JSON Snapshot Audit Report"
          >
            Export JSON Report ↓
          </button>
          <span className="text-xs font-mono text-[#2E9E60] bg-[#0B2416] px-2.5 py-1.5 rounded-lg border border-[#164227]">
            Verified Local Data
          </span>
        </div>
      </div>

      {/* Dominant Metrics — High-Hierarchy Canvas Display */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Dominant Stat 1: Followers */}
        <div
          onClick={() => onSelectCategory('FOLLOWERS')}
          className="md:col-span-4 p-6 sm:p-8 bg-[#080808] border border-[#1C1C1A] hover:border-[#262624] rounded-2xl cursor-pointer group transition space-y-3"
        >
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#5F5F5B] flex items-center justify-between">
            <span>AUDIENCE REACH</span>
            <span className="text-xs text-[#5F5F5B] group-hover:text-[#F5F5F2] transition">→</span>
          </div>
          <div className="text-6xl sm:text-7xl font-sans font-extrabold text-[#F5F5F2] tracking-tight group-hover:text-white transition">
            {followersCount}
          </div>
          <div className="text-xs font-sans text-[#9A9A96]">
            Total accounts subscribed to your updates.
          </div>
        </div>

        {/* Dominant Stat 2: Mutual Bonds */}
        <div
          onClick={() => onSelectCategory('MUTUALS')}
          className="md:col-span-4 p-6 sm:p-8 bg-[#080808] border border-[#1C1C1A] hover:border-[#262624] rounded-2xl cursor-pointer group transition space-y-3"
        >
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#5F5F5B] flex items-center justify-between">
            <span>MUTUAL RECIPROCITY</span>
            <span className="text-xs text-[#5F5F5B] group-hover:text-[#F5F5F2] transition">→</span>
          </div>
          <div className="text-6xl sm:text-7xl font-sans font-extrabold text-[#F5F5F2] tracking-tight group-hover:text-[#2E9E60] transition">
            {mutualCount}
          </div>
          <div className="text-xs font-sans text-[#9A9A96]">
            Accounts with bilateral follow agreements.
          </div>
        </div>

        {/* Dominant Stat 3: Unreciprocated Outbound (Attention Imbalance) */}
        <div
          onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
          className="md:col-span-4 p-6 sm:p-8 bg-[#080808] border border-[#1C1C1A] hover:border-[#262624] rounded-2xl cursor-pointer group transition space-y-3"
        >
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#5F5F5B] flex items-center justify-between">
            <span>NOT FOLLOWING BACK</span>
            <span className="text-xs text-[#5F5F5B] group-hover:text-[#FF3048] transition">→</span>
          </div>
          <div className="text-6xl sm:text-7xl font-sans font-extrabold text-[#F5F5F2] tracking-tight group-hover:text-[#FF3048] transition">
            {notFollowingBackCount}
          </div>
          <div className="text-xs font-sans text-[#9A9A96]">
            People you follow who do not follow you back.
          </div>
        </div>
      </div>

      {/* Secondary Metrics Strip — Quiet Horizontal Flow */}
      <div className="pt-2">
        <div className="text-[11px] font-mono tracking-wider uppercase text-[#5F5F5B] pb-3">
          ANCILLARY SEGMENTS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onSelectCategory('FOLLOWING')}
            className="p-4 bg-[#050505] border border-[#1C1C1A] hover:border-[#262624] rounded-xl text-left cursor-pointer transition group"
          >
            <div className="text-2xl font-bold font-mono text-[#F5F5F2] group-hover:text-white">
              {followingCount}
            </div>
            <div className="text-xs font-sans text-[#9A9A96] mt-1 flex items-center justify-between">
              <span>Following</span>
              <span className="text-[#5F5F5B] group-hover:text-[#F5F5F2]">→</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('YOU_DONT_FOLLOW')}
            className="p-4 bg-[#050505] border border-[#1C1C1A] hover:border-[#262624] rounded-xl text-left cursor-pointer transition group"
          >
            <div className="text-2xl font-bold font-mono text-[#F5F5F2] group-hover:text-white">
              {youDontFollowBackCount}
            </div>
            <div className="text-xs font-sans text-[#9A9A96] mt-1 flex items-center justify-between">
              <span>You don&apos;t follow</span>
              <span className="text-[#5F5F5B] group-hover:text-[#F5F5F2]">→</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('CLOSE_FRIENDS')}
            className="p-4 bg-[#050505] border border-[#1C1C1A] hover:border-[#262624] rounded-xl text-left cursor-pointer transition group"
          >
            <div className="text-2xl font-bold font-mono text-[#F5F5F2] group-hover:text-[#2E9E60]">
              {closeFriendsCount}
            </div>
            <div className="text-xs font-sans text-[#9A9A96] mt-1 flex items-center justify-between">
              <span>Close friends</span>
              <span className="text-[#5F5F5B] group-hover:text-[#F5F5F2]">→</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('REQUESTS')}
            className="p-4 bg-[#050505] border border-[#1C1C1A] hover:border-[#262624] rounded-xl text-left cursor-pointer transition group"
          >
            <div className="text-2xl font-bold font-mono text-[#F5F5F2] group-hover:text-[#FF3048]">
              {pendingRequestsCount}
            </div>
            <div className="text-xs font-sans text-[#9A9A96] mt-1 flex items-center justify-between">
              <span>Pending requests</span>
              <span className="text-[#5F5F5B] group-hover:text-[#F5F5F2]">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mutual Bonds Preview Roster */}
      {mutualsPreview.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#1C1C1A]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#5F5F5B]">
              VERIFIED MUTUAL SAMPLE
            </span>
            <button
              onClick={() => onSelectCategory('MUTUALS')}
              className="text-xs font-mono text-[#9A9A96] hover:text-[#F5F5F2] transition cursor-pointer"
            >
              View all {mutualCount} mutuals →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {mutualsPreview.map(user => {
              const lower = user.toLowerCase();
              return (
                <div
                  key={lower}
                  onClick={() => onSelectProfile(lower)}
                  className="p-3 bg-[#080808] border border-[#1C1C1A] hover:border-[#262624] rounded-xl transition cursor-pointer truncate space-y-1.5 group"
                >
                  <div className="w-8 h-8 rounded-full bg-[#141414] border border-[#262624] text-[#F5F5F2] flex items-center justify-center font-mono text-xs font-bold group-hover:border-[#FF3048] transition">
                    {lower.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="font-mono text-xs text-[#F5F5F2] truncate group-hover:text-white">
                    @{lower}
                  </div>
                  <div className="text-[10px] font-mono text-[#2E9E60]">
                    Mutual
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
