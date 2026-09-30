import React, { useState, useEffect } from 'react';
import { Snapshot, RelationshipEvent, SocialProfile } from '../types';

interface ProfileDetailPaneProps {
  username: string | null;
  onClose: () => void;
  snapshots: Snapshot[];
  events: RelationshipEvent[];
  profile?: SocialProfile;
  onSaveNotes?: (username: string, notes: string, tags?: string[], isStarred?: boolean) => void;
}

export const ProfileDetailPane: React.FC<ProfileDetailPaneProps> = ({
  username,
  onClose,
  snapshots,
  events,
  profile,
  onSaveNotes,
}) => {
  if (!username) return null;

  const lower = username.toLowerCase();
  const latestSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;

  // Determine relationship state
  const isFollower = latestSnapshot?.followers.some(u => u.toLowerCase() === lower) || false;
  const isFollowing = latestSnapshot?.following.some(u => u.toLowerCase() === lower) || false;
  const isCloseFriend = latestSnapshot?.closeFriends?.some(u => u.toLowerCase() === lower) || false;

  let stateLabel = 'NOT CONNECTED';
  let description = 'Neither account follows the other.';
  let badgeColor = 'bg-[#F0ECE1] text-[#55514B]';

  if (isFollower && isFollowing) {
    stateLabel = 'MUTUAL BOND';
    description = 'You follow them, and they follow you back.';
    badgeColor = 'bg-[#EBF5EE] text-[#2E7D52]';
  } else if (isFollowing && !isFollower) {
    stateLabel = "DOESN'T FOLLOW BACK";
    description = "You follow this account, but they do not follow you.";
    badgeColor = 'bg-[#FBF0EE] text-[#8C6338]';
  } else if (isFollower && !isFollowing) {
    stateLabel = 'FOLLOWS YOU';
    description = 'They follow you, but you do not follow them back.';
    badgeColor = 'bg-[#F5F2EB] text-[#55514B]';
  }

  // Related events
  const userEvents = events.filter(e => e.subjectUsername.toLowerCase() === lower);

  // Private notes state
  const [notes, setNotes] = useState(profile?.notes || '');
  const [isStarred, setIsStarred] = useState(profile?.isStarred || false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    setNotes(profile?.notes || '');
    setIsStarred(profile?.isStarred || false);
  }, [profile, username]);

  const handleSaveNotes = () => {
    if (!onSaveNotes) return;
    onSaveNotes(lower, notes, profile?.tags, isStarred);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleToggleStar = () => {
    const nextStar = !isStarred;
    setIsStarred(nextStar);
    if (onSaveNotes) {
      onSaveNotes(lower, notes, profile?.tags, nextStar);
    }
  };

  const firstObservedDate = profile?.firstSeenAt
    ? new Date(profile.firstSeenAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Archive Import';

  const lastObservedDate = profile?.lastSeenAt
    ? new Date(profile.lastSeenAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Present Snapshot';

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-2xl p-5 sm:p-6 space-y-6 shadow-sm animate-fade-in">
      {/* Header with Close and Star */}
      <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-3">
        <span className="text-[11px] font-mono tracking-wider text-[#6E6A63] uppercase">
          PERSON DETAIL
        </span>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStar}
            className={`text-base cursor-pointer transition ${
              isStarred ? 'text-[#8C6338]' : 'text-[#D5D0C5] hover:text-[#8C6338]'
            }`}
            title={isStarred ? 'Starred account' : 'Star this account'}
          >
            ★
          </button>
          <button
            onClick={onClose}
            className="text-xs font-mono text-[#6E6A63] hover:text-[#111111] transition cursor-pointer px-2 py-0.5 rounded hover:bg-[#F3EFE8]"
          >
            Close ✕
          </button>
        </div>
      </div>

      {/* Account Identity */}
      <div className="flex items-start space-x-3">
        <div className="w-12 h-12 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono text-sm font-bold shrink-0">
          {lower.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h3 className="text-xl font-sans font-bold text-[#111111] tracking-tight">
            @{lower}
          </h3>
          {profile?.displayName && (
            <p className="text-xs text-[#6E6A63] font-sans">{profile.displayName}</p>
          )}
          <div className="pt-1.5 flex items-center gap-2">
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${badgeColor}`}>
              {stateLabel}
            </span>
            {isCloseFriend && (
              <span className="text-[10px] font-mono text-[#2E7D52] bg-[#EBF5EE] px-2 py-0.5 rounded font-semibold">
                Close friend
              </span>
            )}
          </div>
          <p className="text-xs text-[#6E6A63] font-sans mt-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Observation Provenance */}
      <div className="bg-[#FAF8F5] border border-[#E5E1D8] rounded-xl p-3.5 space-y-2 font-mono text-xs text-[#6E6A63]">
        <div className="flex justify-between">
          <span>First observed</span>
          <span className="text-[#111111] font-medium">{firstObservedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Last observed</span>
          <span className="text-[#111111] font-medium">{lastObservedDate}</span>
        </div>
        <div className="flex justify-between">
          <span>Snapshots detected</span>
          <span className="text-[#111111] font-medium">{snapshots.length}</span>
        </div>
      </div>

      {/* Relationship History Timeline */}
      {userEvents.length > 0 && (
        <div className="space-y-2.5 border-t border-[#F0ECE1] pt-4">
          <span className="text-[11px] font-mono text-[#6E6A63] uppercase tracking-wider block font-semibold">
            RECORDED TIMELINE EVENTS
          </span>
          <div className="space-y-2 font-mono text-xs">
            {userEvents.map(evt => {
              const d = new Date(evt.effectiveAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div key={evt.id} className="p-2 bg-[#FAF8F5] rounded-md flex items-baseline space-x-2 text-[#111111]">
                  <span className="text-[#99948B] text-[11px] shrink-0 font-bold">{d}</span>
                  <span className="text-xs leading-snug">{evt.summary}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Private Notes */}
      <div className="space-y-2 border-t border-[#F0ECE1] pt-4">
        <label className="text-[11px] font-mono text-[#6E6A63] uppercase tracking-wider block font-semibold">
          PRIVATE NOTES
        </label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add private context, how you know them, or relationship reminders..."
          rows={3}
          className="w-full bg-[#FAF9F7] border border-[#D5D0C5] rounded-lg p-2.5 text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111] focus:bg-white placeholder-[#99948B] transition"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={handleSaveNotes}
            className="px-3.5 py-1.5 bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-sans font-medium rounded-md transition cursor-pointer"
          >
            Save notes
          </button>
          {isSavedNotice && (
            <span className="text-[11px] font-mono text-[#2E7D52] font-semibold">Saved.</span>
          )}
        </div>
      </div>

      {/* External Instagram Link */}
      <div className="pt-2 border-t border-[#F0ECE1]">
        <a
          href={`https://instagram.com/${lower}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-2.5 bg-[#FAF8F5] hover:bg-[#EFECE6] border border-[#D5D0C5] text-center font-sans text-xs font-semibold text-[#111111] rounded-lg transition cursor-pointer"
        >
          Open Instagram profile ↗
        </a>
      </div>
    </div>
  );
};
