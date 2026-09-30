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
  onOpenConnect: () => void;
  onOpenAbout: () => void;
  onLogout?: () => void;
  onResetData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  hasData,
  activeSnapshotLabel,
  currentSection = 'OVERVIEW',
  onSelectSection,
  user,
  connectedAccountUsername,
  onOpenImport,
  onOpenConnect,
  onOpenAbout,
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
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E1D8] bg-[#FAF8F5]/90 backdrop-blur-md px-4 sm:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Left Section */}
        <div className="flex items-center space-x-6">
          <button
            onClick={() => onSelectSection && onSelectSection('OVERVIEW')}
            className="flex items-center space-x-2 text-left cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-[#111111]" />
            <span className="font-sans font-extrabold text-sm tracking-tight text-[#111111]">
              FOLLOW SIGNAL
            </span>
          </button>

          {/* Primary Top Navigation Tabs (When Data Exists) */}
          {hasData && onSelectSection && (
            <nav className="hidden md:flex items-center space-x-1 font-sans text-xs font-medium">
              <button
                onClick={() => onSelectSection('OVERVIEW')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  currentSection === 'OVERVIEW'
                    ? 'bg-[#111111] text-white'
                    : 'text-[#6E6A63] hover:text-[#111111] hover:bg-[#EFECE6]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onSelectSection('RELATIONSHIPS')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  currentSection === 'RELATIONSHIPS'
                    ? 'bg-[#111111] text-white'
                    : 'text-[#6E6A63] hover:text-[#111111] hover:bg-[#EFECE6]'
                }`}
              >
                Relationships
              </button>
              <button
                onClick={() => onSelectSection('HISTORY')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  currentSection === 'HISTORY'
                    ? 'bg-[#111111] text-white'
                    : 'text-[#6E6A63] hover:text-[#111111] hover:bg-[#EFECE6]'
                }`}
              >
                History
              </button>
              <button
                onClick={() => onSelectSection('TIME_MACHINE')}
                className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
                  currentSection === 'TIME_MACHINE'
                    ? 'bg-[#111111] text-white'
                    : 'text-[#6E6A63] hover:text-[#111111] hover:bg-[#EFECE6]'
                }`}
              >
                Time Machine
              </button>
            </nav>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 text-xs font-sans">
          {/* Instagram Account Connection Pill */}
          <button
            onClick={onOpenConnect}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-[#D5D0C5] bg-white hover:bg-[#F3EFE8] text-[#111111] transition cursor-pointer font-mono text-[11px]"
            title="Official Instagram Connection"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectedAccountUsername ? 'bg-[#2E7D52]' : 'bg-[#99948B]'
              }`}
            />
            <span>
              {connectedAccountUsername
                ? `@${connectedAccountUsername}`
                : 'Connect Instagram'}
            </span>
          </button>

          <button
            onClick={onOpenImport}
            className="px-3 py-1.5 bg-[#111111] hover:bg-[#2A2A2A] text-white font-medium rounded-lg transition cursor-pointer"
          >
            Import
          </button>

          <button
            onClick={onOpenAbout}
            className="text-[#6E6A63] hover:text-[#111111] px-2 py-1 transition cursor-pointer hidden sm:inline"
          >
            About
          </button>

          {/* User Account / Google Identity Menu */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 pl-2 py-1 rounded-full hover:bg-[#EFECE6] transition cursor-pointer"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-[#D5D0C5] object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs font-mono">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-[#111111] hidden md:inline">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E5E1D8] rounded-xl shadow-lg p-3 space-y-3 z-50 text-left">
                  <div className="border-b border-[#F0ECE1] pb-2">
                    <p className="font-semibold text-xs text-[#111111]">{user.name}</p>
                    <p className="text-[11px] text-[#6E6A63] truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-mono uppercase bg-[#EFECE6] px-1.5 py-0.5 rounded text-[#55514B]">
                      Follow Signal Account
                    </span>
                  </div>

                  {connectedAccountUsername && (
                    <div className="border-b border-[#F0ECE1] pb-2 text-[11px]">
                      <span className="text-[#99948B] block text-[10px] uppercase font-mono">
                        Connected Instagram
                      </span>
                      <span className="font-mono font-bold text-[#111111]">
                        @{connectedAccountUsername}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1 pt-1">
                    {onResetData && hasData && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onResetData();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-[11px] text-[#B83A2E] hover:bg-[#FBEBEA] transition cursor-pointer"
                      >
                        Purge local data
                      </button>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-[#111111] hover:bg-[#FAF8F5] transition cursor-pointer font-medium"
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
