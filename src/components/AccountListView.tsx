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
    const filename = `follow_signal_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Category Header & Filter Strip */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#1C1C1A] pb-5">
        <div>
          <div className="text-[11px] font-mono tracking-widest uppercase text-[#5F5F5B]">
            RELATIONSHIP ROSTER
          </div>
          <h2 className="text-2xl sm:text-3xl font-sans font-bold text-[#F5F5F2] tracking-tight mt-0.5">
            {title}
          </h2>
          <p className="text-xs font-mono text-[#9A9A96] mt-1">
            {filteredHandles.length} {filteredHandles.length === 1 ? 'account' : 'accounts'} {filterQuery && `(filtered from ${count})`}
          </p>
        </div>

        {/* Search input & Export Action */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <input
            type="text"
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
            placeholder="Search handle..."
            className="flex-1 sm:w-60 bg-[#0A0A0A] border border-[#1C1C1A] focus:border-[#FF3048] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F5F5F2] focus:outline-none placeholder-[#5F5F5B] transition"
          />

          <button
            onClick={handleExportCSV}
            disabled={filteredHandles.length === 0}
            className="px-3 py-1.5 bg-[#0D0D0D] hover:bg-[#141414] border border-[#1C1C1A] hover:border-[#262624] text-[#F5F5F2] text-xs font-mono rounded-lg transition cursor-pointer disabled:opacity-40 shrink-0"
            title="Download CSV list"
          >
            Export CSV ↓
          </button>
        </div>
      </div>

      {/* Editorial Index Roster (Not giant cards) */}
      <div className="border border-[#1C1C1A] rounded-xl bg-[#050505] overflow-hidden divide-y divide-[#141414]">
        {filteredHandles.map((handle, idx) => {
          const lower = handle.toLowerCase();
          const isSelected = selectedUsername?.toLowerCase() === lower;
          const prof = profiles[lower];

          const dateDisplay = prof?.firstSeenAt
            ? new Date(prof.firstSeenAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : null;

          const indexNumber = (idx + 1).toString().padStart(2, '0');

          return (
            <div
              key={lower}
              onClick={() => onSelectProfile(lower)}
              className={`p-3.5 sm:px-5 flex items-center justify-between transition cursor-pointer group ${
                isSelected
                  ? 'bg-[#141414] border-l-2 border-[#FF3048]'
                  : 'hover:bg-[#0A0A0A]'
              }`}
            >
              <div className="flex items-center space-x-4 truncate">
                {/* Index Number */}
                <span className="font-mono text-xs text-[#5F5F5B] w-6 shrink-0 group-hover:text-[#9A9A96]">
                  {indexNumber}
                </span>

                {/* Account Identifier & Metadata */}
                <div className="truncate">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-semibold text-[#F5F5F2] group-hover:text-white transition">
                      @{lower}
                    </span>
                    {prof?.isStarred && (
                      <span className="text-[#FF3048] text-xs" title="Starred account">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#5F5F5B] font-sans truncate">
                    {prof?.displayName ? (
                      <span>{prof.displayName}</span>
                    ) : dateDisplay ? (
                      <span className="font-mono text-[10px]">Observed {dateDisplay}</span>
                    ) : (
                      <span>Active in current snapshot</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge & Forensic Trigger */}
              <div className="flex items-center space-x-3 shrink-0">
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                    relationshipLabel.toLowerCase().includes('mutual')
                      ? 'bg-[#0B2416] text-[#2E9E60] border-[#164227]'
                      : relationshipLabel.toLowerCase().includes('severed') ||
                        relationshipLabel.toLowerCase().includes('lost')
                      ? 'bg-[#2A0B0E] text-[#FF3048] border-[#4A141A]'
                      : relationshipLabel.toLowerCase().includes("doesn't")
                      ? 'bg-[#141414] text-[#9A9A96] border-[#262624]'
                      : 'bg-[#0D0D0D] text-[#5F5F5B] border-[#1C1C1A]'
                  }`}
                >
                  {relationshipLabel}
                </span>
                <span className="text-xs font-mono text-[#5F5F5B] group-hover:text-[#F5F5F2] transition">
                  →
                </span>
              </div>
            </div>
          );
        })}

        {filteredHandles.length === 0 && (
          <div className="py-20 text-center text-xs font-mono text-[#5F5F5B] space-y-2">
            <p className="font-semibold text-[#9A9A96]">
              {filterQuery ? 'No accounts match your query' : 'No accounts in this roster'}
            </p>
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="text-[#F5F5F2] underline hover:no-underline cursor-pointer"
              >
                Clear query
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
