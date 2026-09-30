import React, { useState, useMemo } from 'react';
import { SocialProfile } from '../types';

interface AccountListViewProps {
  title: string;
  count: number;
  handles: string[];
  relationshipLabel: string;
  selectedUsername: string | null;
  onSelectProfile: (username: string) => void;
  profiles: Record<string, SocialProfile>;
}

export const AccountListView: React.FC<AccountListViewProps> = ({
  title,
  count,
  handles,
  relationshipLabel,
  selectedUsername,
  onSelectProfile,
  profiles,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filteredHandles = useMemo(() => {
    if (!filterQuery.trim()) return handles;
    const q = filterQuery.toLowerCase().trim().replace(/^@/, '');
    return handles.filter(h => h.toLowerCase().includes(q));
  }, [handles, filterQuery]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Category Header & Search Input */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-sans font-bold text-[#111111] tracking-tight">
            {title}
          </h2>
          <p className="text-xs font-mono text-[#6E6A63]">
            {filteredHandles.length} {filteredHandles.length === 1 ? 'account' : 'accounts'} {filterQuery && `(of ${count})`}
          </p>
        </div>

        {/* Clean, comfortable search input */}
        <div className="w-full sm:w-64">
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Filter accounts by handle..."
            className="w-full bg-[#FAF9F7] border border-[#D5D0C5] rounded-lg px-3 py-2 text-xs font-mono text-[#111111] focus:outline-none focus:border-[#111111] focus:bg-white placeholder-[#99948B] transition"
          />
        </div>
      </div>

      {/* Modern Contacts-Style Account Rows */}
      <div className="bg-white border border-[#E5E1D8] rounded-xl overflow-hidden shadow-sm divide-y divide-[#F0ECE1]">
        {filteredHandles.map(handle => {
          const lower = handle.toLowerCase();
          const isSelected = selectedUsername?.toLowerCase() === lower;
          const prof = profiles[lower];

          const dateDisplay = prof?.firstSeenAt
            ? new Date(prof.firstSeenAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : null;

          return (
            <div
              key={lower}
              onClick={() => onSelectProfile(lower)}
              className={`p-3.5 sm:px-4 flex items-center justify-between transition cursor-pointer ${
                isSelected
                  ? 'bg-[#F5F2EB] border-l-4 border-[#111111]'
                  : 'hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center space-x-3 truncate">
                {/* Modern Avatar Circle */}
                <div className="w-9 h-9 rounded-full bg-[#EAE6DE] text-[#44403C] flex items-center justify-center font-mono text-xs font-bold shrink-0">
                  {lower.slice(0, 2).toUpperCase()}
                </div>

                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-[#111111]">
                      @{lower}
                    </span>
                    {prof?.isStarred && (
                      <span className="text-[#8C6338] text-xs" title="Starred">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#6E6A63] font-sans truncate">
                    {prof?.displayName ? (
                      <span>{prof.displayName}</span>
                    ) : dateDisplay ? (
                      <span className="font-mono">Observed {dateDisplay}</span>
                    ) : (
                      <span>Active relationship</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge & Arrow */}
              <div className="flex items-center space-x-3 shrink-0">
                <span
                  className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded ${
                    relationshipLabel.toLowerCase().includes('mutual')
                      ? 'bg-[#EBF5EE] text-[#2E7D52]'
                      : relationshipLabel.toLowerCase().includes('severed') ||
                        relationshipLabel.toLowerCase().includes('lost')
                      ? 'bg-[#FBEBEA] text-[#B83A2E] line-through'
                      : relationshipLabel.toLowerCase().includes("doesn't")
                      ? 'bg-[#FBF0EE] text-[#8C6338]'
                      : 'bg-[#F5F2EB] text-[#55514B]'
                  }`}
                >
                  {relationshipLabel}
                </span>
                <span className="text-xs text-[#99948B]">→</span>
              </div>
            </div>
          );
        })}

        {filteredHandles.length === 0 && (
          <div className="py-16 text-center text-xs font-mono text-[#99948B] space-y-2">
            <p className="font-semibold text-[#6E6A63]">
              {filterQuery ? 'No accounts match your search' : 'No accounts in this category'}
            </p>
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="text-[#111111] underline hover:no-underline cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
