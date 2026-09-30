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
  // Group events by date
  const groupedByDate: { [dateStr: string]: RelationshipEvent[] } = {};
  for (const evt of events) {
    const d = new Date(evt.effectiveAt || evt.detectedAt);
    const dateKey = d
      .toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();

    if (!groupedByDate[dateKey]) {
      groupedByDate[dateKey] = [];
    }
    groupedByDate[dateKey].push(evt);
  }

  const dateKeys = Object.keys(groupedByDate);

  return (
    <div className="space-y-8 animate-fade-in select-none text-[#F5F5F2]">
      {/* Title & Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#1C1C1A] pb-6">
        <div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#5F5F5B]">
            CHRONOLOGICAL LEDGER
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-[#F5F5F2] tracking-tight mt-1">
            Relationship History
          </h2>
          <p className="text-xs font-sans text-[#9A9A96] mt-1">
            Audit trail of additions, severances, and state changes recorded between check-ins.
          </p>
        </div>

        <span className="text-xs font-mono text-[#5F5F5B]">
          {events.length} {events.length === 1 ? 'recorded event' : 'recorded events'}
        </span>
      </div>

      {/* Date Groups */}
      <div className="space-y-6">
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
            <div
              key={dateStr}
              className="bg-[#050505] border border-[#1C1C1A] rounded-xl overflow-hidden divide-y divide-[#141414]"
            >
              {/* Date Header */}
              <div className="p-4 sm:px-6 bg-[#080808] flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-[#F5F5F2] tracking-wider">
                  {dateStr}
                </span>
                <div className="flex items-center space-x-3 text-[11px]">
                  {positiveCount > 0 && (
                    <span className="text-[#2E9E60]">+{positiveCount} formed</span>
                  )}
                  {negativeCount > 0 && (
                    <span className="text-[#FF3048]">-{negativeCount} severed</span>
                  )}
                </div>
              </div>

              {/* Individual Event Rows */}
              {dateEvents.map((evt, idx) => {
                const targetUser = evt.subjectUsername;
                const isLost = evt.eventType === 'LOST_FOLLOWER';
                const isNew = evt.eventType === 'NEW_FOLLOWER';
                const isMutual = evt.eventType === 'BECAME_MUTUAL';

                return (
                  <div
                    key={evt.id || idx}
                    onClick={() => targetUser && onSelectProfile(targetUser)}
                    className="p-3.5 sm:px-6 flex items-center justify-between hover:bg-[#0A0A0A] transition cursor-pointer group"
                  >
                    <div className="flex items-center space-x-3.5 truncate">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                          isLost
                            ? 'bg-[#2A0B0E] text-[#FF3048] border border-[#4A141A]'
                            : isNew
                            ? 'bg-[#0B2416] text-[#2E9E60] border border-[#164227]'
                            : isMutual
                            ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624]'
                            : 'bg-[#0D0D0D] text-[#5F5F5B]'
                        }`}
                      >
                        {isLost ? '−' : isNew ? '+' : isMutual ? '↔' : '○'}
                      </span>

                      <div className="truncate">
                        <div className="flex items-center space-x-2">
                          {targetUser && (
                            <span className="font-mono text-xs font-semibold text-[#F5F5F2] group-hover:text-white">
                              @{targetUser}
                            </span>
                          )}
                          <span className="text-xs text-[#9A9A96] font-sans">
                            {evt.summary}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-[10px] font-mono text-[#5F5F5B] uppercase">
                        {evt.eventType}
                      </span>
                      {targetUser && (
                        <span className="text-xs font-mono text-[#5F5F5B] group-hover:text-[#F5F5F2] transition">
                          →
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {dateKeys.length === 0 && (
          <div className="py-20 text-center font-mono text-xs text-[#5F5F5B] space-y-2">
            <p className="font-semibold text-[#9A9A96]">No historical events recorded yet.</p>
            <p>Import a second snapshot or simulate a check-in to generate audit trail ledger events.</p>
          </div>
        )}
      </div>
    </div>
  );
};
