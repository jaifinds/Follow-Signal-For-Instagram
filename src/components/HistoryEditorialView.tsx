import React from 'react';
import { RelationshipEvent } from '../types';

interface HistoryEditorialViewProps {
  events: RelationshipEvent[];
  onSelectProfile: (username: string) => void;
}

export const HistoryEditorialView: React.FC<HistoryEditorialViewProps> = ({
  events,
  onSelectProfile,
}) => {
  const groupedByDate: { [dateStr: string]: RelationshipEvent[] } = {};
  for (const evt of events) {
    const d = new Date(evt.effectiveAt || evt.detectedAt);
    const dateKey = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(evt);
  }

  const dateKeys = Object.keys(groupedByDate);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in select-none text-white w-full min-w-0">
      {/* Title & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 sm:pb-6 border-b border-white/[0.08] min-w-0">
        <div className="min-w-0">
          <div className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
            Activity Chronicle
          </div>
          <h2 className="text-2xl sm:text-4xl font-light text-white tracking-tight mt-1 truncate">
            Relationship Event Log
          </h2>
          <p className="text-xs text-[#8E909D] mt-1 font-normal">
            Recorded follower transitions, mutual bonds, and archive checkpoints.
          </p>
        </div>

        <span className="text-xs text-[#D1D3DC] bg-[#131418] px-3.5 py-1.5 rounded border border-white/[0.08] font-mono shrink-0">
          {events.length} {events.length === 1 ? 'event' : 'events'} logged
        </span>
      </div>

      {/* Date Groups */}
      <div className="space-y-6 min-w-0">
        {dateKeys.map(dateStr => {
          const dateEvents = groupedByDate[dateStr];

          const positiveCount = dateEvents.filter(
            e =>
              e.eventType === 'NEW_FOLLOWER' ||
              e.eventType === 'BECAME_MUTUAL'
          ).length;

          const negativeCount = dateEvents.filter(
            e =>
              e.eventType === 'LOST_FOLLOWER' ||
              e.eventType === 'UNFOLLOWED'
          ).length;

          return (
            <div key={dateStr} className="space-y-3 min-w-0">
              {/* Date Header */}
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/[0.08] min-w-0">
                <span className="font-mono text-xs font-semibold text-white tracking-wide truncate">
                  {dateStr}
                </span>
                <div className="flex items-center space-x-2 text-xs font-mono shrink-0 ml-2">
                  {positiveCount > 0 && (
                    <span className="text-[#2A8F53]">
                      +{positiveCount}
                    </span>
                  )}
                  {negativeCount > 0 && (
                    <span className="text-[#D94444]">
                      -{negativeCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Event Rows */}
              <div className="divide-y divide-white/[0.06] min-w-0">
                {dateEvents.map((evt, idx) => {
                  const targetUser = evt.subjectUsername;
                  const isLost = evt.eventType === 'LOST_FOLLOWER';
                  const isNew = evt.eventType === 'NEW_FOLLOWER';
                  const isMutual = evt.eventType === 'BECAME_MUTUAL';

                  return (
                    <div
                      key={evt.id || idx}
                      onClick={() => targetUser && targetUser !== 'workspace' && onSelectProfile(targetUser)}
                      className={`py-2.5 px-2 flex items-center justify-between gap-3 transition min-w-0 ${
                        targetUser && targetUser !== 'workspace'
                          ? 'cursor-pointer hover:bg-[#131418]'
                          : 'cursor-default'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isNew || isMutual
                              ? 'bg-[#2A8F53]'
                              : isLost
                              ? 'bg-[#D94444]'
                              : 'bg-white/40'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-white truncate font-medium">
                            {evt.summary}
                          </p>
                          {targetUser && targetUser !== 'workspace' && (
                            <span className="font-mono text-[11px] text-[#8E909D] truncate block">
                              @{targetUser}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-[#565866]">
                          {new Date(evt.detectedAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
