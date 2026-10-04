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
    a.download = `instagram_circle_audit_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in select-none w-full min-w-0">
      
      {/* Overview Masthead */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 sm:pb-6 border-b border-white/[0.08] min-w-0">
        <div className="min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Snapshot · {snapshot.label}
          </div>
          <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight mt-1 truncate">
            Relationship Audit
          </h2>
          <p className="text-xs text-[#8E909D] mt-1 font-normal">
            Account reciprocity and distribution from your imported archive.
          </p>
        </div>

        <button
          onClick={handleDownloadReport}
          className="text-xs font-medium text-[#D1D3DC] hover:text-white bg-[#131418] hover:bg-[#1A1C22] border border-white/[0.08] px-3.5 py-2 rounded transition cursor-pointer flex items-center justify-center space-x-2 shrink-0 active:scale-95 w-full sm:w-auto"
        >
          <span>Download Audit Report (JSON)</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      {/* Reciprocity Ratio Bar */}
      <div className="p-5 sm:p-7 bg-[#131418] border border-white/[0.08] rounded-xl space-y-4 shadow-sm min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <span className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
              Reciprocity Index
            </span>
            <div className="flex items-baseline space-x-3 mt-1 min-w-0">
              <span className="text-3xl sm:text-4xl font-light text-white font-mono shrink-0">
                {reciprocityRate}%
              </span>
              <span className="text-xs text-[#8E909D] truncate">
                of people you follow reciprocate and follow back
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono shrink-0">
            <button
              onClick={() => onSelectCategory('MUTUALS')}
              className="flex items-center space-x-1.5 text-[#2A8F53] hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#2A8F53]" />
              <span>{mutualCount} Mutual</span>
            </button>
            <button
              onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
              className="flex items-center space-x-1.5 text-[#D94444] hover:underline cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-[#D94444]" />
              <span>{notFollowingBackCount} Not Back</span>
            </button>
          </div>
        </div>

        {/* Reciprocity Distribution Gauge */}
        <div className="h-1.5 w-full bg-[#1A1C22] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${mutualPct}%` }}
            className="bg-[#2A8F53] hover:opacity-90 transition-all cursor-pointer"
            onClick={() => onSelectCategory('MUTUALS')}
            title={`${mutualCount} Mutual (${Math.round(mutualPct)}%)`}
          />
          <div
            style={{ width: `${notFollowingPct}%` }}
            className="bg-[#D94444] hover:opacity-90 transition-all cursor-pointer"
            onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
            title={`${notFollowingBackCount} Don't Follow Back (${Math.round(notFollowingPct)}%)`}
          />
        </div>
      </div>

      {/* Primary Metric Tiles (Zero AI Slop - Monochromatic Luxury) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 min-w-0">
        
        {/* Metric 1: Don't Follow Back */}
        <div
          onClick={() => onSelectCategory('DONT_FOLLOW_BACK')}
          className="p-5 sm:p-6 bg-[#131418] border border-white/[0.08] hover:border-[#D94444]/60 rounded-xl cursor-pointer group transition space-y-2.5 shadow-sm active:scale-[0.99] min-w-0"
        >
          <div className="flex items-center justify-between text-xs font-mono font-medium text-[#D94444]">
            <span className="tracking-wider">DON&apos;T FOLLOW BACK</span>
            <span className="group-hover:translate-x-1 transition text-sm">&rarr;</span>
          </div>
          <div className="text-3xl sm:text-5xl font-light text-white tracking-tight tabular-nums font-mono">
            {notFollowingBackCount}
          </div>
          <p className="text-xs text-[#8E909D] leading-relaxed">
            Accounts you follow who do not follow your profile back.
          </p>
        </div>

        {/* Metric 2: Mutual Friends */}
        <div
          onClick={() => onSelectCategory('MUTUALS')}
          className="p-5 sm:p-6 bg-[#131418] border border-white/[0.08] hover:border-[#2A8F53]/60 rounded-xl cursor-pointer group transition space-y-2.5 shadow-sm active:scale-[0.99] min-w-0"
        >
          <div className="flex items-center justify-between text-xs font-mono font-medium text-[#2A8F53]">
            <span className="tracking-wider">MUTUAL CONNECTIONS</span>
            <span className="group-hover:translate-x-1 transition text-sm">&rarr;</span>
          </div>
          <div className="text-3xl sm:text-5xl font-light text-white tracking-tight tabular-nums font-mono">
            {mutualCount}
          </div>
          <p className="text-xs text-[#8E909D] leading-relaxed">
            Confirmed two-way mutual relationships.
          </p>
        </div>

        {/* Metric 3: Total Followers */}
        <div
          onClick={() => onSelectCategory('FOLLOWERS')}
          className="p-5 sm:p-6 bg-[#131418] border border-white/[0.08] hover:border-white/30 rounded-xl cursor-pointer group transition space-y-2.5 shadow-sm active:scale-[0.99] min-w-0"
        >
          <div className="flex items-center justify-between text-xs font-mono font-medium text-[#D1D3DC]">
            <span className="tracking-wider">TOTAL FOLLOWERS</span>
            <span className="group-hover:translate-x-1 transition text-sm">&rarr;</span>
          </div>
          <div className="text-3xl sm:text-5xl font-light text-white tracking-tight tabular-nums font-mono">
            {followersCount}
          </div>
          <p className="text-xs text-[#8E909D] leading-relaxed">
            Accounts recorded in your followers archive.
          </p>
        </div>
      </div>

      {/* Secondary Categories Grid */}
      <div className="space-y-3 min-w-0">
        <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
          Additional Cohorts
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => onSelectCategory('FOLLOWING')}
            className="p-4 bg-[#131418] border border-white/[0.08] hover:border-white/[0.15] rounded-lg text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-2xl font-light text-white tabular-nums font-mono">
              {followingCount}
            </div>
            <div className="text-xs text-[#8E909D] mt-1.5 flex items-center justify-between font-normal">
              <span className="truncate">Following</span>
              <span className="text-[#565866] group-hover:text-white transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('YOU_DONT_FOLLOW')}
            className="p-4 bg-[#131418] border border-white/[0.08] hover:border-white/[0.15] rounded-lg text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-2xl font-light text-white tabular-nums font-mono">
              {youDontFollowBackCount}
            </div>
            <div className="text-xs text-[#8E909D] mt-1.5 flex items-center justify-between font-normal">
              <span className="truncate">Fans</span>
              <span className="text-[#565866] group-hover:text-white transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('CLOSE_FRIENDS')}
            className="p-4 bg-[#131418] border border-white/[0.08] hover:border-white/[0.15] rounded-lg text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-2xl font-light text-white tabular-nums font-mono">
              {closeFriendsCount}
            </div>
            <div className="text-xs text-[#8E909D] mt-1.5 flex items-center justify-between font-normal">
              <span className="truncate">Close friends</span>
              <span className="text-[#565866] group-hover:text-white transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>

          <button
            onClick={() => onSelectCategory('REQUESTS')}
            className="p-4 bg-[#131418] border border-white/[0.08] hover:border-white/[0.15] rounded-lg text-left cursor-pointer transition group min-w-0"
          >
            <div className="text-2xl font-light text-white tabular-nums font-mono">
              {pendingRequestsCount}
            </div>
            <div className="text-xs text-[#8E909D] mt-1.5 flex items-center justify-between font-normal">
              <span className="truncate">Pending</span>
              <span className="text-[#565866] group-hover:text-white transition shrink-0 ml-1">&rarr;</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
