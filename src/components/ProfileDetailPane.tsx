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
    <aside className="w-full lg:w-96 bg-[#080808] border-t lg:border-t-0 lg:border-l border-[#1C1C1A] flex flex-col h-full animate-fade-in text-[#F5F5F2] select-none">
      {/* Dossier Header */}
      <div className="p-5 border-b border-[#1C1C1A] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#FF3048]" />
          <span className="text-[11px] font-mono tracking-widest text-[#5F5F5B] uppercase">
            FORENSIC DOSSIER
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-mono text-[#5F5F5B] hover:text-[#F5F5F2] transition cursor-pointer"
        >
          [Close]
        </button>
      </div>

      <div className="p-6 space-y-7 overflow-y-auto flex-1">
        {/* Account Identity */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-mono font-bold text-[#F5F5F2] tracking-tight">
              @{username}
            </h3>

            {onToggleStar && (
              <button
                onClick={() => onToggleStar(username)}
                className="text-lg transition cursor-pointer p-1"
                title={profile?.isStarred ? 'Unstar profile' : 'Star profile'}
              >
                <span className={profile?.isStarred ? 'text-[#FF3048]' : 'text-[#262624] hover:text-[#5F5F5B]'}>
                  ★
                </span>
              </button>
            )}
          </div>

          <div className="inline-flex items-center px-2.5 py-1 rounded bg-[#0D0D0D] border border-[#1C1C1A] text-[10px] font-mono uppercase tracking-wider text-[#9A9A96]">
            {relationshipStatus}
          </div>
        </div>

        {/* Forensic Metadata Strip */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-b border-[#1C1C1A] py-4">
          <div className="p-3 bg-[#050505] rounded-lg border border-[#141414]">
            <span className="text-[10px] text-[#5F5F5B] block uppercase">First Observed</span>
            <span className="text-[#F5F5F2] mt-0.5 block">
              {profile?.firstSeenAt
                ? new Date(profile.firstSeenAt).toISOString().split('T')[0]
                : 'Current Baseline'}
            </span>
          </div>

          <div className="p-3 bg-[#050505] rounded-lg border border-[#141414]">
            <span className="text-[10px] text-[#5F5F5B] block uppercase">Recorded Changes</span>
            <span className="text-[#F5F5F2] mt-0.5 block">
              {accountEvents.length} {accountEvents.length === 1 ? 'event' : 'events'}
            </span>
          </div>
        </div>

        {/* Private Local Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono uppercase text-[#5F5F5B] tracking-wider">
              Private Dossier Notes
            </label>
            {savingNotes && (
              <span className="text-[10px] font-mono text-[#2E9E60]">Saved</span>
            )}
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add private observations (stored locally on this device)..."
            rows={3}
            className="w-full bg-[#050505] border border-[#1C1C1A] focus:border-[#FF3048] rounded-xl p-3 text-xs font-mono text-[#F5F5F2] focus:outline-none placeholder-[#3A3A36] transition resize-none"
          />
        </div>

        {/* Recorded Event History */}
        <div className="space-y-3">
          <label className="text-[11px] font-mono uppercase text-[#5F5F5B] tracking-wider block">
            State Transitions
          </label>

          {accountEvents.length > 0 ? (
            <div className="space-y-2">
              {accountEvents.map((evt, i) => (
                <div
                  key={evt.id || i}
                  className="p-3 bg-[#050505] border border-[#141414] rounded-lg text-xs font-mono space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#5F5F5B]">
                    <span>{new Date(evt.effectiveAt || evt.detectedAt).toISOString().split('T')[0]}</span>
                    <span className="text-[#9A9A96]">{evt.eventType}</span>
                  </div>
                  <p className="text-xs text-[#F5F5F2] font-sans">{evt.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-[#5F5F5B] italic">
              No state transitions recorded for this handle across available snapshots.
            </p>
          )}
        </div>

        {/* Outbound Link */}
        <div className="pt-2">
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 bg-[#0D0D0D] hover:bg-[#141414] border border-[#1C1C1A] hover:border-[#262624] text-[#F5F5F2] rounded-xl text-xs font-mono flex items-center justify-center space-x-2 transition"
          >
            <span>Open @{username} on Instagram</span>
            <span className="text-[#5F5F5B]">↗</span>
          </a>
        </div>
      </div>
    </aside>
  );
};
