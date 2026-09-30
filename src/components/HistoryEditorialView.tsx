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
    const d = new Date(evt.effectiveAt);
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm space-y-1">
        <span className="text-[11px] font-mono tracking-wider text-[#6E6A63] uppercase">
          EVENT TIMELINE LEDGER
        </span>
        <h2 className="text-2xl font-sans font-bold text-[#111111] tracking-tight">
          Relationship history.
        </h2>
        <p className="text-xs font-sans text-[#6E6A63]">
          Chronological additions, severances, and state changes recorded between check-ins.
        </p>
      </div>

      {/* Date-grouped Event Cards */}
      <div className="space-y-4">
        {dateKeys.map(dateStr => {
          const dateEvents = groupedByDate[dateStr];

          // Compute summary stats for the date
          const positiveCount = dateEvents.filter(
            e =>
              e.eventType === 'NEW_FOLLOWER' ||
              e.eventType === 'FOLLOWED_YOU' ||
              e.eventType === 'BECAME_MUTUAL'
          ).length;

          const negativeCount = dateEvents.filter(
            e =>
              e.eventType === 'LOST_FOLLOWER' ||
              e.eventType === 'NO_LONGER_MUTUAL'
          ).length;

          return (
            <div
              key={dateStr}
              className="bg-white border border-[#E5E1D8] rounded-xl p-5 shadow-sm space-y-3"
            >
              {/* Date Header Strip */}
              <div className="flex items-center justify-between border-b border-[#F0ECE1] pb-2.5">
                <span className="font-mono text-xs font-bold text-[#111111] tracking-wider">
                  {dateStr}
                </span>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  {positiveCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#EBF5EE] text-[#2E7D52] font-semibold">
                      +{positiveCount} new
                    </span>
                  )}
                  {negativeCount > 0 && (
                    <span className="px-2 py-0.5 rounded bg-[#FBEBEA] text-[#B83A2E] font-semibold">
                      −{negativeCount} lost
                    </span>
                  )}
                </div>
              </div>

              {/* Event rows */}
              <div className="divide-y divide-[#F0ECE1]">
                {dateEvents.map(evt => {
                  const isPositive =
                    evt.eventType === 'NEW_FOLLOWER' ||
                    evt.eventType === 'FOLLOWED_YOU' ||
                    evt.eventType === 'BECAME_MUTUAL';
                  const isNegative =
                    evt.eventType === 'LOST_FOLLOWER' ||
                    evt.eventType === 'NO_LONGER_MUTUAL';

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectProfile(evt.subjectUsername)}
                      className="py-3 px-2 flex items-center justify-between hover:bg-[#FAF8F5] rounded-md transition cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isPositive
                              ? 'bg-[#EBF5EE] text-[#2E7D52]'
                              : isNegative
                              ? 'bg-[#FBEBEA] text-[#B83A2E]'
                              : 'bg-[#F0ECE1] text-[#6E6A63]'
                          }`}
                        >
                          {isPositive ? '+' : isNegative ? '−' : '·'}
                        </span>
                        <div>
                          <span className="font-mono text-xs font-bold text-[#111111]">
                            @{evt.subjectUsername}
                          </span>
                          <span className="text-xs text-[#6E6A63] font-sans ml-2">
                            {evt.summary}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-mono text-[#6E6A63] hover:text-[#111111]">
                        Inspect →
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {dateKeys.length === 0 && (
          <div className="bg-white border border-[#E5E1D8] rounded-xl p-12 text-center text-xs font-mono text-[#99948B]">
            No historical diff events recorded yet. Future check-ins will log all changes here.
          </div>
        )}
      </div>
    </div>
  );
};
