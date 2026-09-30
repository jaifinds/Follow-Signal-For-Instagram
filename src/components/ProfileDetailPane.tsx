import React, { useState, useEffect } from 'react';
import { SocialProfile, RelationshipEvent, Snapshot } from '../types';

interface ProfileDetailPaneProps {
  username: string | null;
  profile?: SocialProfile;
  events: RelationshipEvent[];
  snapshots?: Snapshot[];
  onClose: () => void;
  onToggleStar?: (username: string) => void;
  onSaveNotes?: (username: string, notes: string, tags?: string[], isStarred?: boolean) => void;
  relationshipStatus?: string;
}

export const ProfileDetailPane: React.FC<ProfileDetailPaneProps> = ({
  username,
  profile,
  events,
  snapshots,
  onClose,
  onToggleStar,
  onSaveNotes,
  relationshipStatus = 'Observed Account',
}) => {
  const [notes, setNotes] = useState(profile?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    setNotes(profile?.notes || '');
  }, [profile]);

  if (!username) return null;

  const handleNotesBlur = () => {
    if (onSaveNotes) {
      setSavingNotes(true);
      onSaveNotes(username, notes);
      setTimeout(() => setSavingNotes(false), 500);
    }
  };

  const accountEvents = events.filter(
    e => e.subjectUsername?.toLowerCase() === username.toLowerCase()
  );

  return (
    <aside className="w-full bg-[#141414] border border-white/[0.08] rounded-2xl flex flex-col h-full animate-fade-in text-white select-none overflow-hidden shadow-2xl min-w-0">
      {/* Pane Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between min-w-0">
        <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase truncate">
          Account Details
        </div>
        <button
          onClick={onClose}
          className="text-xs font-mono text-neutral-400 hover:text-white transition cursor-pointer p-1"
        >
          &times; Close
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto flex-1 min-w-0">
        {/* Account Identity */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <h3 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-tight truncate">
              @{username}
            </h3>

            {onToggleStar && (
              <button
                onClick={() => onToggleStar(username)}
                className="w-8 h-8 rounded-lg border border-white/[0.08] hover:border-white/[0.2] flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
                title={profile?.isStarred ? 'Unstar' : 'Star'}
              >
                <span className={profile?.isStarred ? 'text-amber-400' : 'text-neutral-500'}>
                  ★
                </span>
              </button>
            )}
          </div>

          <div className="text-xs text-neutral-400 truncate">
            Status: <span className="text-white font-medium">{relationshipStatus}</span>
          </div>
        </div>

        {/* Action Button: Direct Open on Instagram */}
        <div>
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-white text-black font-semibold rounded-lg text-xs flex items-center justify-center space-x-2 transition hover:bg-neutral-200 active:scale-95"
          >
            <span>Open @{username} on Instagram</span>
            <span>&rarr;</span>
          </a>
        </div>

        {/* Account Metadata */}
        <div className="grid grid-cols-2 gap-3 text-xs border-t border-b border-white/[0.08] py-3.5">
          <div>
            <span className="text-[10px] font-mono text-neutral-500 block uppercase">First Seen</span>
            <span className="text-white font-medium mt-0.5 block font-mono text-xs">
              {profile?.firstSeenAt
                ? new Date(profile.firstSeenAt).toISOString().split('T')[0]
                : 'Current Snapshot'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-mono text-neutral-500 block uppercase">Log Events</span>
            <span className="text-white font-medium mt-0.5 block font-mono text-xs">
              {accountEvents.length} {accountEvents.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>

        {/* Private Local Notes */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label className="text-neutral-400 font-medium">
              Private Note (Saved locally)
            </label>
            {savingNotes && (
              <span className="text-emerald-400 font-mono text-[11px]">Saved</span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add a private note about this person..."
            rows={3}
            className="w-full bg-[#0A0A0A] border border-white/[0.08] focus:border-white/[0.2] rounded-lg p-2.5 text-xs text-white focus:outline-none placeholder-neutral-600 transition resize-none"
          />
        </div>

        {/* Activity Log */}
        <div className="space-y-2.5">
          <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
            Activity Log
          </div>

          {accountEvents.length > 0 ? (
            <div className="space-y-2 divide-y divide-white/[0.04]">
              {accountEvents.map((evt, i) => (
                <div key={evt.id || i} className="pt-2 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono">
                    <span>
                      {new Date(evt.effectiveAt || evt.detectedAt).toISOString().split('T')[0]}
                    </span>
                    <span className="text-neutral-300">{evt.eventType}</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-sans">{evt.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">
              No historical changes recorded for this account.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
