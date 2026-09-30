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
          <div className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">
            Activity History
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1 truncate">
            Follower History Log
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Recorded follower changes, mutual connections, and snapshots.
          </p>
        </div>

        <span className="text-xs text-neutral-300 bg-white/[0.04] px-3.5 py-1.5 rounded-lg border border-white/[0.08] font-mono shrink-0">
          {events.length} {events.length === 1 ? 'event' : 'events'} recorded
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
            <div key={dateStr} className="space-y-2.5 min-w-0">
              {/* Date Header */}
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-white/[0.08] min-w-0">
                <span className="font-semibold text-white tracking-wide truncate">
                  {dateStr}
                </span>
                <div className="flex items-center space-x-2 text-xs text-neutral-400 shrink-0 ml-2">
                  {positiveCount > 0 && (
                    <span className="text-emerald-400 font-mono">
                      +{positiveCount}
                    </span>
                  )}
                  {negativeCount > 0 && (
                    <span className="text-red-400 font-mono">
                      -{negativeCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Event Rows */}
              <div className="divide-y divide-white/[0.04] min-w-0">
                {dateEvents.map((evt, idx) => {
                  const targetUser = evt.subjectUsername;
                  const isLost = evt.eventType === 'LOST_FOLLOWER';
                  const isNew = evt.eventType === 'NEW_FOLLOWER';
                  const isMutual = evt.eventType === 'BECAME_MUTUAL';

                  return (
                    <div
                      key={evt.id || idx}
                      onClick={() => targetUser && onSelectProfile(targetUser)}
                      className="py-2.5 px-2 flex items-center justify-between hover:bg-white/[0.03] transition cursor-pointer group rounded-lg min-w-0"
                    >
                      <div className="flex items-center space-x-2.5 truncate min-w-0 flex-1">
                        <span
                          className={`font-mono text-xs w-4 text-center font-bold shrink-0 ${
                            isLost
                              ? 'text-red-400'
                              : isNew
                              ? 'text-emerald-400'
                              : isMutual
                              ? 'text-white'
                              : 'text-neutral-500'
                          }`}
                        >
                          {isLost ? '−' : isNew ? '+' : isMutual ? '↔' : '·'}
                        </span>

                        <div className="truncate min-w-0 flex-1">
                          <div className="flex items-center space-x-2 text-xs truncate">
                            {targetUser && (
                              <span className="font-mono font-medium text-white group-hover:text-neutral-300 transition shrink-0">
                                @{targetUser}
                              </span>
                            )}
                            <span className="text-neutral-300 font-sans truncate">
                              {evt.summary}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 ml-2">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase hidden sm:inline">
                          {evt.eventType}
                        </span>
                        {targetUser && (
                          <span className="text-xs font-mono text-neutral-500 group-hover:text-white transition">
                            &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {dateKeys.length === 0 && (
          <div className="py-14 text-center text-xs text-neutral-400 space-y-1">
            <p className="font-medium text-white">No history recorded yet.</p>
            <p>Import a future snapshot to record activity changes.</p>
          </div>
        )}
      </div>
    </div>
  );
};
