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
  events,
  onSelectCategory,
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

  // Reciprocity Rate
  const reciprocityRate = followingCount > 0 ? Math.round((mutualCount / followingCount) * 100) : 0;
  const mutualPct = followingCount > 0 ? (mutualCount / followingCount) * 100 : 0;
  const notFollowingPct = followingCount > 0 ? (notFollowingBackCount / followingCount) * 100 : 0;

  const handleDownloadReport = () => {
    const reportData = {
      product: 'Follow Signal',
      generatedAt: new Date().toISOString(),
      snapshot: {
        id: snapshot.id,
        label: snapshot.label,
        effectiveAt: snapshot.effectiveAt,
        followersCount,
        followingCount,
        mutualCount,
        notFollowingBackCount,
        youDontFollowBackCount,
        closeFriendsCount,
        pendingRequestsCount,
        reciprocityRate: `${reciprocityRate}%`,
      },
      eventsRecorded: events.length,
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
    a.download = `instagram_circle_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 sm:space-y-8 animate-fade-in select-none w-full min-w-0">
      
      {/* Overview Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 sm:pb-5 border-b border-[#242630] min-w-0">
        <div className="min-w-0">
          <div className="text-[11px] font-mono tracking-wider text-[#C5A869] uppercase">
            Snapshot · {snapshot.label}
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#F5F5F3] tracking-tight mt-0.5 truncate">
            Circle Overview
          </h2>
          <p className="text-xs text-[#9596A2] mt-0.5">
            Relationship distribution from your imported archive.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="text-xs font-medium text-[#F5F5F3] bg-[#21232A] hover:bg-[#292B33] border border-[#2B2D37] px-3.5 py-2 rounded-lg transition cursor-pointer flex items-center justify-center space-x-2 shrink-0 active:scale-95 w-full sm:w-auto"
        >
          <span>Download Report (JSON)</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      {/* Reciprocity Ratio Bar */}
      <div className="p-4 sm:p-6 bg-[#1A1B20] border border-[#242630] rounded-xl sm:rounded-2xl space-y-3 sm:space-y-4 shadow-md min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <span className="text-[11px] font-mono tracking-wide text-[#9596A2] uppercase">
              Reciprocity Index
            </span>
            <div className="flex items-baseline space-x-2 mt-0.5 min-w-0">
              <span className="text-2xl sm:text-3xl font-extrabold text-[#F5F5F3] font-mono shrink-0">
                {reciprocityRate}%
              </span>
              <span className="text-xs text-[#9596A2] truncate">
                of people you follow reciprocate and follow back
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs font-medium shrink-0">
            <button
              onClick={() => onSelectCategory('MUTUALS')}
              className="flex items-center space-x-1.5 text-[#2E7D47] hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#2E7D47]" />
              <span>{mutualCount} Mutual</span>
            </button>
            <button
              onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
              className="flex items-center space-x-1.5 text-[#C93B3B] hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#C93B3B]" />
              <span>{notFollowingBackCount} Not Back</span>
            </button>
          </div>
        </div>

        {/* Reciprocity Distribution Gauge */}
        <div className="h-2 w-full bg-[#21232A] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${mutualPct}%` }}
            className="bg-[#2E7D47] hover:opacity-90 transition-all cursor-pointer"
            onClick={() => onSelectCategory('MUTUALS')}
            title={`${mutualCount} Mutual Friends (${Math.round(mutualPct)}%)`}
          />
          <div
            style={{ width: `${notFollowingPct}%` }}
            className="bg-[#C93B3B] hover:opacity-90 transition-all cursor-pointer"
            onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
            title={`${notFollowingBackCount} Don't Follow Back (${Math.round(notFollowingPct)}%)`}
          />
        </div>
      </div>

      {/* Primary Metric Tiles (Zero AI Slop - Clear Data-Driven Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0">
        
        {/* Metric 1: Don't Follow Back */}
        <div
          onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
          className="p-4 sm:p-5 bg-[#1A1B20] border border-[#242630] hover:border-[#C93B3B]/60 rounded-xl sm:rounded-2xl cursor-pointer group transition space-y-2 shadow-sm active:scale-[0.99] min-w-0"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#C93B3B]">
            <span className="tracking-wide">DON&apos;T FOLLOW BACK</span>
            <span className="group-hover:translate-x-1 transition text-sm">&rarr;</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F3] tracking-tight tabular-nums">
            {notFollowingBackCount}
          </div>
          <p className="text-xs text-[#9596A2] leading-relaxed">
            Accounts you follow who do not follow your account back.
          </p>
        </div>

        {/* Metric 2: Mutual Friends */}
        <div
          onClick={() => onSelectCategory('MUTUALS')}
          className="p-4 sm:p-5 bg-[#1A1B20] border border-[#242630] hover:border-[#2E7D47]/60 rounded-xl sm:rounded-2xl cursor-pointer group transition space-y-2 shadow-sm active:scale-[0.99] min-w-0"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#2E7D47]">
            <span className="tracking-wide">MUTUAL CONNECTIONS</span>
            <span className="group-hover:translate-x-1 transition text-sm">&rarr;</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F3] tracking-tight tabular-nums">
            {mutualCount}
          </div>
          <p className="text-xs text-[#9596A2] leading-relaxed">
            Two-way connections where you follow each other.
          </p>
        </div>

        {/* Metric 3: Total Followers */}
        <div
          onClick={() => onSelectCategory('FOLLOWERS')}
          className="p-4 sm:p-5 bg-[#1A1B20] border border-[#242630] hover:border-[#C5A869]/60 rounded-xl sm:rounded-2xl cursor-pointer group transition space-y-2 shadow-sm active:scale-[0.99] min-w-0"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-[#C5A869]">
            <span className="tracking-wide">TOTAL FOLLOWERS</span>
            <span className="group-hover:translate-x-1 transition text-sm">&rarr;</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#F5F5F3] tracking-tight tabular-nums">
            {followersCount}
          </div>
          <p className="text-xs text-[#9596A2] leading-relaxed">
            Verified accounts following your profile.
          </p>
        </div>
      </div>

      {/* Secondary Metrics Strip */}
      <div className="space-y-3 min-w-0">
        <div className="text-xs font-mono tracking-wider text-[#9596A2] uppercase">
          Extended Categories
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => onSelectCategory('FOLLOWING')}
            className="p-3.5 bg-[#1A1B20] border border-[#242630] hover:border-[#2B2D37] rounded-xl text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-xl sm:text-2xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
              {followingCount}
            </div>
            <div className="text-xs text-[#9596A2] mt-1 flex items-center justify-between font-medium">
              <span className="truncate">Following</span>
              <span className="text-[#636573] group-hover:text-[#F5F5F3] transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('YOU_DONT_FOLLOW')}
            className="p-3.5 bg-[#1A1B20] border border-[#242630] hover:border-[#2B2D37] rounded-xl text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-xl sm:text-2xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
              {youDontFollowBackCount}
            </div>
            <div className="text-xs text-[#9596A2] mt-1 flex items-center justify-between font-medium">
              <span className="truncate">Fans</span>
              <span className="text-[#636573] group-hover:text-[#F5F5F3] transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('CLOSE_FRIENDS')}
            className="p-3.5 bg-[#1A1B20] border border-[#242630] hover:border-[#2B2D37] rounded-xl text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-xl sm:text-2xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
              {closeFriendsCount}
            </div>
            <div className="text-xs text-[#9596A2] mt-1 flex items-center justify-between font-medium">
              <span className="truncate">Close friends</span>
              <span className="text-[#636573] group-hover:text-[#F5F5F3] transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('REQUESTS')}
            className="p-3.5 bg-[#1A1B20] border border-[#242630] hover:border-[#2B2D37] rounded-xl text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-xl sm:text-2xl font-extrabold text-[#F5F5F3] tabular-nums font-mono">
              {pendingRequestsCount}
            </div>
            <div className="text-xs text-[#9596A2] mt-1 flex items-center justify-between font-medium">
              <span className="truncate">Pending</span>
              <span className="text-[#636573] group-hover:text-[#F5F5F3] transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
