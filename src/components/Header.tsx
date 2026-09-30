import React, { useState, useRef, useEffect } from 'react';
import { UserIdentity } from '../providers/auth/authTypes';

export type MainNavSection = 'OVERVIEW' | 'RELATIONSHIPS' | 'HISTORY' | 'TIME_MACHINE';

interface HeaderProps {
  hasData: boolean;
  activeSnapshotLabel?: string;
  currentSection?: MainNavSection;
  onSelectSection?: (section: MainNavSection) => void;
  user?: UserIdentity | null;
  connectedAccountUsername?: string | null;
  onOpenImport: () => void;
  onOpenConnect?: () => void;
  onOpenAbout: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onResetData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasData,
  activeSnapshotLabel,
  currentSection = 'OVERVIEW',
  onSelectSection,
  user,
  onOpenImport,
  onOpenAbout,
  onOpenSettings,
  onLogout,
  onResetData,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#242630] bg-[#131417]/95 backdrop-blur-md px-3 sm:px-6 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 min-w-0">
        
        {/* Brand Identity */}
        <div className="flex items-center space-x-3 sm:space-x-8 min-w-0 shrink-0">
          <button
            onClick={() => onSelectSection && onSelectSection('OVERVIEW')}
            className="flex items-center space-x-2.5 text-left cursor-pointer group focus:outline-none"
          >
            <div className="w-7 h-7 rounded-md bg-[#C5A869] text-[#131417] flex items-center justify-center font-mono font-bold text-xs tracking-wider shadow-sm">
              FS
            </div>
            <div className="min-w-0">
              <span className="font-mono font-bold text-xs tracking-wider text-[#F5F5F3] uppercase block truncate">
                Follow Signal
              </span>
              <span className="text-[10px] text-[#9596A2] block -mt-0.5 hidden sm:block">
                Instagram Circle Tracker
              </span>
            </div>
          </button>

          {/* Desktop Nav Links (Screen >= 1024px) */}
          {hasData && onSelectSection && (
            <nav className="hidden lg:flex items-center space-x-1 font-sans text-xs">
              <button
                onClick={() => onSelectSection('OVERVIEW')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                  currentSection === 'OVERVIEW'
                    ? 'bg-[#21232A] text-[#F5F5F3]'
                    : 'text-[#9596A2] hover:text-[#F5F5F3] hover:bg-[#1A1B20]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onSelectSection('RELATIONSHIPS')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                  currentSection === 'RELATIONSHIPS'
                    ? 'bg-[#21232A] text-[#F5F5F3]'
                    : 'text-[#9596A2] hover:text-[#F5F5F3] hover:bg-[#1A1B20]'
                }`}
              >
                Accounts
              </button>
              <button
                onClick={() => onSelectSection('TIME_MACHINE')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                  currentSection === 'TIME_MACHINE'
                    ? 'bg-[#21232A] text-[#F5F5F3]'
                    : 'text-[#9596A2] hover:text-[#F5F5F3] hover:bg-[#1A1B20]'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => onSelectSection('HISTORY')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer font-medium ${
                  currentSection === 'HISTORY'
                    ? 'bg-[#21232A] text-[#F5F5F3]'
                    : 'text-[#9596A2] hover:text-[#F5F5F3] hover:bg-[#1A1B20]'
                }`}
              >
                History
              </button>
            </nav>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-sans shrink-0">
          {/* Active Snapshot Tag (Desktop only) */}
          {activeSnapshotLabel && (
            <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-md border border-[#242630] bg-[#1A1B20] text-[#9596A2] font-mono text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A869]" />
              <span className="truncate max-w-[130px]">{activeSnapshotLabel}</span>
            </div>
          )}

          {/* Import Archive Button (Warm Antique Brass) */}
          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 bg-[#C5A869] hover:bg-[#D4B475] text-[#131417] font-semibold rounded-md transition cursor-pointer text-xs active:scale-95 shadow-sm flex items-center space-x-1.5"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Import</span>
          </button>

          {/* About & Guide */}
          <button
            onClick={onOpenAbout}
            className="text-[#9596A2] hover:text-[#F5F5F3] p-1.5 rounded-md hover:bg-[#1A1B20] transition cursor-pointer hidden sm:block"
            title="Export Guide & Privacy"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Settings Trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[#9596A2] hover:text-[#F5F5F3] p-1.5 rounded-md hover:bg-[#1A1B20] transition cursor-pointer"
              title="Settings & Storage"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}

          {/* User Account Menu */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-1.5 p-1 rounded-md border border-[#242630] hover:border-[#333644] bg-[#1A1B20] transition cursor-pointer"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-5 h-5 rounded object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded bg-[#21232A] text-[#F5F5F3] flex items-center justify-center font-bold text-xs">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-[#1A1B20] border border-[#2B2D37] rounded-xl shadow-2xl p-3 space-y-2 z-50 text-left">
                  <div className="border-b border-[#242630] pb-2">
                    <p className="font-semibold text-xs text-[#F5F5F3] truncate">{user.name}</p>
                    <p className="text-[11px] text-[#9596A2] truncate">{user.email}</p>
                  </div>

                  <div className="space-y-1">
                    {onResetData && hasData && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onResetData();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md text-xs text-[#C93B3B] hover:bg-[#C93B3B]/10 transition cursor-pointer"
                      >
                        Reset local data
                      </button>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded-md text-xs text-[#F5F5F3] hover:bg-[#21232A] transition cursor-pointer"
                      >
                        Log out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
