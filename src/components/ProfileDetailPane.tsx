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
  relationshipStatus = 'Audited Account',
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
    <aside className="w-full bg-[#131418] border border-white/[0.08] rounded-xl flex flex-col h-full animate-fade-in text-white select-none overflow-hidden shadow-2xl min-w-0">
      {/* Pane Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between min-w-0">
        <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase truncate">
          Account Dossier
        </div>
        <button
          onClick={onClose}
          className="text-xs font-mono text-[#8E909D] hover:text-white transition cursor-pointer p-1"
        >
          &times; Close
        </button>
      </div>

      <div className="p-5 space-y-5 overflow-y-auto flex-1 min-w-0">
        {/* Account Identity */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between min-w-0">
            <h3 className="text-xl sm:text-2xl font-mono font-medium text-white tracking-tight truncate">
              @{username}
            </h3>

            {onToggleStar && (
              <button
                onClick={() => onToggleStar(username)}
                className="w-8 h-8 rounded border border-white/[0.08] hover:border-white/20 flex items-center justify-center transition cursor-pointer shrink-0 ml-2"
                title={profile?.isStarred ? 'Unstar' : 'Star'}
              >
                <span className={profile?.isStarred ? 'text-white' : 'text-[#565866]'}>
                  ★
                </span>
              </button>
            )}
          </div>

          <div className="text-xs text-[#8E909D] truncate">
            Status: <span className="text-white font-medium">{relationshipStatus}</span>
          </div>
        </div>

        {/* Action Button: Direct Open on Instagram */}
        <div>
          <a
            href={`https://instagram.com/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 bg-white text-[#0C0D0F] font-semibold rounded text-xs flex items-center justify-center space-x-2 transition hover:bg-neutral-100 active:scale-95 tracking-wide"
          >
            <span>Open @{username} on Instagram</span>
            <span>&rarr;</span>
          </a>
        </div>

        {/* Account Metadata */}
        <div className="p-3.5 bg-[#0C0D0F] border border-white/[0.08] rounded-lg space-y-2 text-xs font-mono min-w-0">
          <div className="flex items-center justify-between text-[#8E909D]">
            <span>Observed In Vault</span>
            <span className="text-white">
              {snapshots && snapshots.length > 0 ? `${snapshots.length} checkpoint(s)` : 'Current'}
            </span>
          </div>
          {profile?.firstSeenAt && (
            <div className="flex items-center justify-between text-[#8E909D]">
              <span>First Recorded</span>
              <span className="text-white">
                {new Date(profile.firstSeenAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        {/* Private Personal Notes */}
        <div className="space-y-2 min-w-0">
          <div className="flex items-center justify-between text-xs min-w-0">
            <label className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
              Private Account Notes
            </label>
            {savingNotes && (
              <span className="text-[10px] font-mono text-[#8E909D]">
                Saving...
              </span>
            )}
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            onBlur={handleNotesBlur}
            placeholder="Add context, memory triggers, or notes about this account..."
            rows={4}
            className="w-full p-3 bg-[#0C0D0F] border border-white/[0.08] focus:border-white/30 rounded text-xs text-white placeholder-[#565866] focus:outline-none transition resize-none font-sans"
          />
          <p className="text-[11px] text-[#565866]">
            Notes are saved strictly in your local browser storage.
          </p>
        </div>

        {/* Recorded Relationship History */}
        <div className="space-y-2.5 pt-2 border-t border-white/[0.08] min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Activity Log ({accountEvents.length})
          </div>

          {accountEvents.length === 0 ? (
            <p className="text-xs text-[#565866] italic py-1">
              No state changes recorded across archives.
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06] text-xs font-mono min-w-0">
              {accountEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="py-2 space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between text-[11px] text-[#8E909D]">
                    <span className="truncate">{evt.eventType.replace(/_/g, ' ')}</span>
                    <span className="shrink-0 ml-1">
                      {new Date(evt.effectiveAt || evt.detectedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white text-xs font-sans truncate">{evt.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
