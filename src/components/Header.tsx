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
  connectedAccountUsername,
  onOpenImport,
  onOpenConnect,
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
    <header className="sticky top-0 z-40 w-full border-b border-[#1C1C1A] bg-black/90 backdrop-blur-md px-4 sm:px-8 py-3.5 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Left Section */}
        <div className="flex items-center space-x-7">
          <button
            onClick={() => onSelectSection && onSelectSection('OVERVIEW')}
            className="flex items-center space-x-2.5 text-left cursor-pointer group"
          >
            <span className="w-2 h-2 rounded-full bg-[#FF3048] shadow-[0_0_8px_rgba(255,48,72,0.6)] group-hover:scale-110 transition" />
            <span className="font-sans font-bold text-sm tracking-tight text-[#F5F5F2] uppercase">
              FOLLOW SIGNAL
            </span>
          </button>

          {/* Primary Top Navigation Tabs (When Data Exists) */}
          {hasData && onSelectSection && (
            <nav className="hidden md:flex items-center space-x-1 font-sans text-xs">
              <button
                onClick={() => onSelectSection('OVERVIEW')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                  currentSection === 'OVERVIEW'
                    ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624]'
                    : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onSelectSection('RELATIONSHIPS')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                  currentSection === 'RELATIONSHIPS'
                    ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624]'
                    : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                }`}
              >
                Relationships
              </button>
              <button
                onClick={() => onSelectSection('HISTORY')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-medium ${
                  currentSection === 'HISTORY'
                    ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624]'
                    : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                }`}
              >
                History
              </button>
              <button
                onClick={() => onSelectSection('TIME_MACHINE')}
                className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer font-medium flex items-center space-x-1.5 ${
                  currentSection === 'TIME_MACHINE'
                    ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624]'
                    : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                }`}
              >
                <span>Time Machine</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF3048]" />
              </button>
            </nav>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5 text-xs font-sans">
          {/* Instagram Account Connection Pill */}
          <button
            onClick={onOpenConnect}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-[#1C1C1A] bg-[#0A0A0A] hover:bg-[#141414] hover:border-[#262624] text-[#F5F5F2] transition cursor-pointer font-mono text-[11px]"
            title="Official Meta Instagram Connection"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connectedAccountUsername ? 'bg-[#2E9E60] shadow-[0_0_6px_rgba(46,158,96,0.6)]' : 'bg-[#5F5F5B]'
              }`}
            />
            <span className="truncate max-w-[120px] sm:max-w-[180px]">
              {connectedAccountUsername
                ? `@${connectedAccountUsername}`
                : 'Connect Instagram'}
            </span>
          </button>

          {/* Import Button */}
          <button
            onClick={onOpenImport}
            className="px-3.5 py-1.5 bg-[#F5F5F2] hover:bg-white text-black font-semibold rounded-lg transition cursor-pointer text-xs"
          >
            Import
          </button>

          {/* Settings Trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#141414] px-2.5 py-1.5 rounded-lg border border-transparent hover:border-[#1C1C1A] transition cursor-pointer hidden sm:inline"
              title="Settings"
            >
              Settings
            </button>
          )}

          {/* About Trigger */}
          <button
            onClick={onOpenAbout}
            className="text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#141414] px-2.5 py-1.5 rounded-lg border border-transparent hover:border-[#1C1C1A] transition cursor-pointer hidden sm:inline"
          >
            About
          </button>

          {/* User Account / Google Identity Menu */}
          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 p-1 rounded-lg hover:bg-[#141414] transition cursor-pointer"
              >
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-[#262624] object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#141414] border border-[#262624] text-[#F5F5F2] flex items-center justify-center font-bold text-xs font-mono">
                    {user.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <span className="font-medium text-[#F5F5F2] hidden md:inline">
                  {user.name.split(' ')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0A0A0A] border border-[#1C1C1A] rounded-xl shadow-2xl p-3.5 space-y-3 z-50 text-left animate-fade-in">
                  <div className="border-b border-[#1C1C1A] pb-2.5">
                    <p className="font-semibold text-xs text-[#F5F5F2]">{user.name}</p>
                    <p className="text-[11px] text-[#9A9A96] truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-mono uppercase bg-[#141414] px-1.5 py-0.5 rounded text-[#9A9A96] border border-[#1C1C1A]">
                      Follow Signal Account
                    </span>
                  </div>

                  {connectedAccountUsername && (
                    <div className="border-b border-[#1C1C1A] pb-2.5 text-[11px]">
                      <span className="text-[#5F5F5B] block text-[10px] uppercase font-mono">
                        Connected Instagram
                      </span>
                      <span className="font-mono font-bold text-[#F5F5F2]">
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
                        className="w-full text-left px-2 py-1.5 rounded text-[11px] text-[#FF3048] hover:bg-[#2A0B0E] transition cursor-pointer"
                      >
                        Wipe local workspace
                      </button>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-2 py-1.5 rounded text-xs text-[#F5F5F2] hover:bg-[#141414] transition cursor-pointer font-medium"
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
