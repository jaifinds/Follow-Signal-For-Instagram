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
  onToggleStar?: (username: string) => void;
}

export const AccountListView: React.FC<AccountListViewProps> = ({
  title,
  count,
  handles,
  relationshipLabel,
  selectedUsername,
  onSelectProfile,
  profiles,
  onToggleStar,
}) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [subFilter, setSubFilter] = useState<'ALL' | 'STARRED' | 'WITH_NOTES'>('ALL');
  const [sortBy, setSortBy] = useState<'DEFAULT' | 'ALPHA'>('DEFAULT');

  const filteredHandles = useMemo(() => {
    let result = [...handles];

    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase().trim().replace(/^@/, '');
      result = result.filter(h => h.toLowerCase().includes(q));
    }

    if (subFilter === 'STARRED') {
      result = result.filter(h => profiles[h.toLowerCase()]?.isStarred);
    } else if (subFilter === 'WITH_NOTES') {
      result = result.filter(h => Boolean(profiles[h.toLowerCase()]?.notes?.trim()));
    }

    if (sortBy === 'ALPHA') {
      result.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    }

    return result;
  }, [handles, filterQuery, subFilter, sortBy, profiles]);

  const handleExportCSV = () => {
    const rows = [
      ['Index', 'Username', 'Display Name', 'Relationship', 'Profile URL', 'First Observed', 'Starred', 'Notes'],
      ...filteredHandles.map((h, i) => {
        const lower = h.toLowerCase();
        const p = profiles[lower];
        return [
          (i + 1).toString().padStart(2, '0'),
          `@${lower}`,
          `"${(p?.displayName || '').replace(/"/g, '""')}"`,
          `"${relationshipLabel}"`,
          `https://instagram.com/${lower}`,
          p?.firstSeenAt ? new Date(p.firstSeenAt).toISOString().split('T')[0] : '',
          p?.isStarred ? 'Yes' : 'No',
          `"${(p?.notes || '').replace(/"/g, '""')}"`,
        ];
      }),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const filename = `instagram_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in select-none w-full min-w-0">
      
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 sm:pb-5 border-b border-[#242630] min-w-0">
        <div className="min-w-0">
          <div className="text-[11px] font-mono tracking-wider text-[#C5A869] uppercase">
            Roster
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-[#F5F5F3] tracking-tight mt-0.5 truncate">
            {title}
          </h2>
          <div className="flex items-center space-x-2 text-xs text-[#9596A2] mt-0.5 font-mono">
            <span className="tabular-nums font-semibold text-[#F5F5F3]">{filteredHandles.length}</span>
            <span>of</span>
            <span className="tabular-nums">{count} accounts</span>
            {(filterQuery || subFilter !== 'ALL') && <span>(filtered)</span>}
          </div>
        </div>

        {/* Search & Export Bar */}
        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          <div className="relative flex-1 sm:w-56 min-w-0">
            <svg
              className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#9596A2]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Search username..."
              className="w-full bg-[#1A1B20] border border-[#242630] focus:border-[#C5A869] rounded-lg pl-8 pr-7 py-1.5 text-xs text-[#F5F5F3] focus:outline-none placeholder-[#636573] transition font-mono min-w-0"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute right-2 top-1.5 text-xs text-[#9596A2] hover:text-[#F5F5F3] p-0.5"
              >
                &times;
              </button>
            )}
          </div>

          <button
            onClick={handleExportCSV}
            disabled={filteredHandles.length === 0}
            className="px-3 py-1.5 bg-[#21232A] hover:bg-[#292B33] border border-[#2B2D37] text-[#D4D5DC] text-xs font-medium rounded-lg transition cursor-pointer disabled:opacity-40 shrink-0 flex items-center space-x-1"
            title="Download CSV"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Sort Control */}
      <div className="flex items-center justify-between gap-2 text-xs min-w-0">
        <div className="flex items-center space-x-1 p-0.5 bg-[#1A1B20] border border-[#242630] rounded-lg overflow-x-auto max-w-full">
          <button
            onClick={() => setSubFilter('ALL')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap text-xs ${
              subFilter === 'ALL'
                ? 'bg-[#21232A] text-[#F5F5F3]'
                : 'text-[#9596A2] hover:text-[#F5F5F3]'
            }`}
          >
            All ({handles.length})
          </button>
          <button
            onClick={() => setSubFilter('STARRED')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap text-xs ${
              subFilter === 'STARRED'
                ? 'bg-[#21232A] text-[#C5A869]'
                : 'text-[#9596A2] hover:text-[#F5F5F3]'
            }`}
          >
            Starred
          </button>
          <button
            onClick={() => setSubFilter('WITH_NOTES')}
            className={`px-2.5 py-1 rounded-md transition cursor-pointer font-medium whitespace-nowrap text-xs ${
              subFilter === 'WITH_NOTES'
                ? 'bg-[#21232A] text-[#F5F5F3]'
                : 'text-[#9596A2] hover:text-[#F5F5F3]'
            }`}
          >
            With Notes
          </button>
        </div>

        <button
          onClick={() => setSortBy(sortBy === 'DEFAULT' ? 'ALPHA' : 'DEFAULT')}
          className="px-2.5 py-1 rounded bg-[#1A1B20] border border-[#242630] hover:border-[#2B2D37] text-[#9596A2] hover:text-[#F5F5F3] text-xs transition cursor-pointer shrink-0 font-mono"
        >
          {sortBy === 'ALPHA' ? 'A → Z' : 'Natural'}
        </button>
      </div>

      {/* Account List Rows (Mobile-Optimized: No Cropping, Fluid Text, min-w-0) */}
      <div className="divide-y divide-[#242630] border-t border-b border-[#242630] min-w-0">
        {filteredHandles.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#9596A2] space-y-1">
            <p className="text-[#F5F5F3] font-medium">No accounts found</p>
            <p>Try clearing your search query or switching filter tabs.</p>
          </div>
        ) : (
          filteredHandles.map((handle) => {
            const lower = handle.toLowerCase();
            const isSelected = selectedUsername?.toLowerCase() === lower;
            const prof = profiles[lower];

            const isMutual = relationshipLabel.toLowerCase().includes('mutual');
            const isLost = relationshipLabel.toLowerCase().includes('severed') || relationshipLabel.toLowerCase().includes('lost');
            const isNotBack = relationshipLabel.toLowerCase().includes("doesn't") || relationshipLabel.toLowerCase().includes('not');

            return (
              <div
                key={lower}
                onClick={() => onSelectProfile(lower)}
                className={`py-2.5 px-2 sm:px-3 flex items-center justify-between gap-2 transition cursor-pointer group active:bg-[#21232A] min-w-0 ${
                  isSelected
                    ? 'bg-[#21232A] border-l-2 border-[#C5A869]'
                    : 'hover:bg-[#1A1B20]'
                }`}
              >
                {/* Left Side: Avatar Initials + Handle + Notes indicator */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs font-mono shrink-0 border ${
                      isMutual
                        ? 'border-[#2E7D47]/40 bg-[#2E7D47]/10 text-[#2E7D47]'
                        : isLost || isNotBack
                        ? 'border-[#C93B3B]/40 bg-[#C93B3B]/10 text-[#C93B3B]'
                        : 'border-[#2B2D37] bg-[#21232A] text-[#9596A2]'
                    }`}
                  >
                    {lower.slice(0, 1).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="font-mono text-xs font-semibold text-[#F5F5F3] truncate group-hover:text-[#C5A869] transition">
                        @{lower}
                      </span>
                      {prof?.isStarred && (
                        <span className="text-[#C5A869] text-xs shrink-0" title="Starred">★</span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] text-[#9596A2] min-w-0 truncate">
                      {prof?.displayName ? (
                        <span className="truncate">{prof.displayName}</span>
                      ) : (
                        <span className="text-[#636573] truncate">Instagram User</span>
                      )}
                      {prof?.notes && (
                        <span className="text-[10px] text-[#C5A869] shrink-0 font-mono">
                          · note
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Status Label & Chevron */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span
                    className={`text-[11px] font-mono font-medium hidden sm:inline ${
                      isMutual
                        ? 'text-[#2E7D47]'
                        : isLost || isNotBack
                        ? 'text-[#C93B3B]'
                        : 'text-[#9596A2]'
                    }`}
                  >
                    {relationshipLabel}
                  </span>

                  {onToggleStar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar(lower);
                      }}
                      className="p-1 text-[#636573] hover:text-[#C5A869] transition cursor-pointer"
                      title={prof?.isStarred ? 'Unstar' : 'Star'}
                    >
                      <span className={prof?.isStarred ? 'text-[#C5A869]' : 'text-[#636573]'}>
                        ★
                      </span>
                    </button>
                  )}

                  <span className="text-[#636573] group-hover:text-[#F5F5F3] transition text-xs">
                    &rarr;
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
