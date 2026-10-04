import React, { useState, useEffect, useMemo } from 'react';
import {
  AppState,
  loadAppState,
  saveProfileMetadata,
  saveUserSnapshot,
  purgeAllUserData,
} from './lib/storage';
import { Snapshot, RelationshipEvent } from './types';
import { Header, MainNavSection } from './components/Header';
import { HeroView } from './components/HeroView';
import { ImportModal } from './components/ImportModal';
import { ConnectModal } from './components/ConnectModal';
import { AboutModal } from './components/AboutModal';
import { OverviewView } from './components/OverviewView';
import { AccountListView } from './components/AccountListView';
import { TimeMachineView } from './components/TimeMachineView';
import { HistoryEditorialView } from './components/HistoryEditorialView';
import { ProfileDetailPane } from './components/ProfileDetailPane';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoginScreen } from './components/LoginScreen';
import { SettingsModal } from './components/SettingsModal';
import { AuthClient } from './lib/authClient';
import { UserIdentity } from './providers/auth/authTypes';

export type AppSection =
  | 'OVERVIEW'
  | 'MUTUALS'
  | 'FOLLOWERS'
  | 'FOLLOWING'
  | 'DONT_FOLLOW_BACK'
  | 'YOU_DONT_FOLLOW'
  | 'LOST'
  | 'REQUESTS'
  | 'CLOSE_FRIENDS'
  | 'TIMELINE'
  | 'HISTORY';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentSection, setCurrentSection] = useState<AppSection>('OVERVIEW');
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null);

  // Follow Signal user authentication state
  const [currentUser, setCurrentUser] = useState<UserIdentity | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // OAuth notifications & Instagram live connection state
  const [oauthBanner, setOauthBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [connectedAccountUsername] = useState<string | null>(null);

  // Check Follow Signal user session on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authStatus = params.get('auth');
    const authError = params.get('auth_error');

    if (authStatus === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
    } else if (authError) {
      setOauthBanner({
        type: 'error',
        message: decodeURIComponent(authError),
      });
      window.history.replaceState({}, '', window.location.pathname);
    }

    AuthClient.getCurrentUser()
      .then(user => {
        setCurrentUser(user);
        setAuthChecked(true);
      })
      .catch(() => {
        setAuthChecked(true);
      });
  }, []);

  const handleLogout = async () => {
    await AuthClient.logout();
    setCurrentUser(null);
    setIsGuestMode(false);
  };

  const handleSaveProfileNotes = (
    username: string,
    notes: string,
    tags?: string[],
    isStarred?: boolean
  ) => {
    const lower = username.toLowerCase();
    const existing = appState.profiles[lower] || {
      username: lower,
      firstSeenAt: new Date().toISOString(),
    };

    const updatedProfile = {
      ...existing,
      notes,
      tags: tags !== undefined ? tags : existing.tags,
      isStarred: isStarred !== undefined ? isStarred : existing.isStarred,
    };

    const updatedProfiles = {
      ...appState.profiles,
      [lower]: updatedProfile,
    };

    setAppState(prev => ({
      ...prev,
      profiles: updatedProfiles,
    }));

    saveProfileMetadata(lower, {
      notes,
      tags: updatedProfile.tags,
      isStarred: updatedProfile.isStarred,
    });
  };

  const handleToggleStar = (username: string) => {
    const lower = username.toLowerCase();
    const existing = appState.profiles[lower];
    const isCurrentlyStarred = Boolean(existing?.isStarred);
    handleSaveProfileNotes(
      username,
      existing?.notes || '',
      existing?.tags,
      !isCurrentlyStarred
    );
  };

  const handleImportComplete = (
    newSnapshot: Snapshot,
    newEvents: RelationshipEvent[]
  ) => {
    const updatedSnapshots = [...appState.snapshots, newSnapshot];
    const updatedEvents = [...newEvents, ...appState.events];

    const updatedState: AppState = {
      ...appState,
      snapshots: updatedSnapshots,
      events: updatedEvents,
    };

    setAppState(updatedState);
    saveUserSnapshot(newSnapshot, newEvents);
    setIsGuestMode(true);
  };

  const handlePurgeAllData = () => {
    purgeAllUserData();
    setAppState({
      mode: 'USER',
      accountUsername: 'my_instagram',
      snapshots: [],
      events: [],
      profiles: {},
      auditLogs: [],
      preferences: appState.preferences,
    });
    setSelectedUsername(null);
    setCurrentSection('OVERVIEW');
  };

  const hasData = appState.snapshots.length > 0;
  const latestSnapshot = hasData ? appState.snapshots[appState.snapshots.length - 1] : null;
  const previousSnapshot =
    appState.snapshots.length > 1
      ? appState.snapshots[appState.snapshots.length - 2]
      : null;

  // Real Metric Counters from latest snapshot
  const followersCount = latestSnapshot?.followersCount ?? 0;
  const followingCount = latestSnapshot?.followingCount ?? 0;
  const mutualsCount = latestSnapshot?.mutualCount ?? 0;
  const notFollowingBackCount =
    latestSnapshot?.followingNotFollowingBack?.length ??
    Math.max(0, followingCount - mutualsCount);
  const youDontFollowCount =
    latestSnapshot?.followersNotFollowedBack?.length ??
    Math.max(0, followersCount - mutualsCount);
  const closeFriendsCount = latestSnapshot?.closeFriends?.length ?? 0;
  const pendingRequestsCount = latestSnapshot?.pendingRequests?.length ?? 0;

  const lostFollowers = useMemo(() => {
    if (!latestSnapshot || !previousSnapshot) return [];
    const currentFollowersSet = new Set(latestSnapshot.followers || []);
    return (previousSnapshot.followers || []).filter(h => !currentFollowersSet.has(h));
  }, [latestSnapshot, previousSnapshot]);

  const mappedNavSection: MainNavSection = useMemo(() => {
    if (currentSection === 'OVERVIEW') return 'OVERVIEW';
    if (currentSection === 'TIMELINE') return 'TIME_MACHINE';
    if (currentSection === 'HISTORY') return 'HISTORY';
    return 'RELATIONSHIPS';
  }, [currentSection]);

  const handleSelectNavSection = (nav: MainNavSection) => {
    if (nav === 'OVERVIEW') setCurrentSection('OVERVIEW');
    else if (nav === 'TIME_MACHINE') setCurrentSection('TIMELINE');
    else if (nav === 'HISTORY') setCurrentSection('HISTORY');
    else setCurrentSection('DONT_FOLLOW_BACK');
    setSelectedUsername(null);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#0C0D0F] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not logged in with Google, has not chosen guest mode, and has no data loaded:
  if (!currentUser && !isGuestMode && !hasData) {
    return (
      <div className="min-h-screen bg-[#0C0D0F] text-white font-sans flex flex-col justify-center selection:bg-white selection:text-black">
        <LoginScreen
          onContinueAsGuestArchive={() => setIsGuestMode(true)}
          onOpenImport={() => {
            setIsGuestMode(true);
            setIsImportOpen(true);
          }}
          onUserAuthenticated={u => setCurrentUser(u)}
        />
        <ImportModal
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          currentSnapshots={appState.snapshots}
          onImportComplete={handleImportComplete}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0C0D0F] text-white font-sans flex flex-col selection:bg-white selection:text-black min-w-0 overflow-x-hidden">
      {/* Luxury Top Header */}
      <Header
        hasData={hasData}
        activeSnapshotLabel={latestSnapshot?.label}
        currentSection={mappedNavSection}
        onSelectSection={handleSelectNavSection}
        user={currentUser}
        connectedAccountUsername={connectedAccountUsername}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenConnect={() => setIsConnectOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onLogout={handleLogout}
        onResetData={handlePurgeAllData}
      />

      {/* Global Notification Banner */}
      {oauthBanner && (
        <div
          className={`w-full py-2.5 px-4 text-xs font-mono font-medium flex items-center justify-between border-b ${
            oauthBanner.type === 'success'
              ? 'bg-[#2A8F53]/20 border-[#2A8F53] text-white'
              : 'bg-[#D94444]/20 border-[#D94444] text-white'
          }`}
        >
          <div className="max-w-7xl mx-auto flex-1 flex items-center justify-between">
            <span>{oauthBanner.message}</span>
            <button
              onClick={() => setOauthBanner(null)}
              className="ml-4 underline cursor-pointer text-white/80 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* MOBILE CATEGORY SCROLLER BAR (Visible on mobile screens < 768px when data exists) */}
      {hasData && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#0C0D0F] px-3 py-2 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center space-x-1.5 min-w-0">
          <button
            onClick={() => {
              setCurrentSection('OVERVIEW');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 ${
              currentSection === 'OVERVIEW'
                ? 'bg-white text-[#0C0D0F] font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => {
              setCurrentSection('DONT_FOLLOW_BACK');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 flex items-center space-x-1.5 ${
              currentSection === 'DONT_FOLLOW_BACK'
                ? 'bg-[#D94444] text-white font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            <span>Not Back</span>
            <span className="font-mono text-[11px] opacity-80">{notFollowingBackCount}</span>
          </button>
          <button
            onClick={() => {
              setCurrentSection('MUTUALS');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 flex items-center space-x-1.5 ${
              currentSection === 'MUTUALS'
                ? 'bg-[#2A8F53] text-white font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            <span>Mutuals</span>
            <span className="font-mono text-[11px] opacity-80">{mutualsCount}</span>
          </button>
          <button
            onClick={() => {
              setCurrentSection('FOLLOWERS');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 ${
              currentSection === 'FOLLOWERS'
                ? 'bg-white text-[#0C0D0F] font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            Followers ({followersCount})
          </button>
          <button
            onClick={() => {
              setCurrentSection('FOLLOWING');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 ${
              currentSection === 'FOLLOWING'
                ? 'bg-white text-[#0C0D0F] font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            Following ({followingCount})
          </button>
          <button
            onClick={() => {
              setCurrentSection('YOU_DONT_FOLLOW');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 ${
              currentSection === 'YOU_DONT_FOLLOW'
                ? 'bg-white text-[#0C0D0F] font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            Fans ({youDontFollowCount})
          </button>
          <button
            onClick={() => {
              setCurrentSection('TIMELINE');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 ${
              currentSection === 'TIMELINE'
                ? 'bg-white text-[#0C0D0F] font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            Timeline
          </button>
          <button
            onClick={() => {
              setCurrentSection('HISTORY');
              setSelectedUsername(null);
            }}
            className={`px-3 py-1.5 rounded text-xs font-medium transition cursor-pointer shrink-0 ${
              currentSection === 'HISTORY'
                ? 'bg-white text-[#0C0D0F] font-semibold'
                : 'text-[#8E909D] hover:text-white bg-[#131418]'
            }`}
          >
            History
          </button>
        </div>
      )}

      <ErrorBoundary fallbackTitle="View Rendering Recovered">
        <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-w-0">
          {!hasData ? (
            /* HERO SCENE: ARCHIVE INGESTION VAULT */
            <HeroView
              userName={currentUser?.name}
              onOpenImport={() => setIsImportOpen(true)}
              onOpenConnect={() => setIsConnectOpen(true)}
            />
          ) : (
            /* MAIN APP LAYOUT: ADAPTIVE GRID ACROSS DEVICES */
            <div className="py-4 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-start pb-24 md:pb-8 min-w-0">
              
              {/* LEFT COLUMN: DESKTOP & TABLET CATEGORY SIDEBAR */}
              <nav className="hidden md:flex md:col-span-4 lg:col-span-3 font-sans text-xs border border-white/[0.08] bg-[#131418] p-3 rounded-xl shadow-xl flex-col gap-1 sticky top-20 min-w-0">
                <span className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase block px-3 py-1">
                  Cohorts
                </span>

                <button
                  onClick={() => {
                    setCurrentSection('OVERVIEW');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'OVERVIEW'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('DONT_FOLLOW_BACK');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'DONT_FOLLOW_BACK'
                      ? 'bg-[#D94444] text-white font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Don&apos;t follow back</span>
                  <span className="font-mono text-xs tabular-nums text-white">
                    {notFollowingBackCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('MUTUALS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'MUTUALS'
                      ? 'bg-[#2A8F53] text-white font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Mutual bonds</span>
                  <span className="font-mono text-xs tabular-nums text-white">
                    {mutualsCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('FOLLOWERS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'FOLLOWERS'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">All followers</span>
                  <span className="font-mono text-xs tabular-nums text-[#8E909D]">
                    {followersCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('FOLLOWING');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'FOLLOWING'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Following</span>
                  <span className="font-mono text-xs tabular-nums text-[#8E909D]">
                    {followingCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('YOU_DONT_FOLLOW');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'YOU_DONT_FOLLOW'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Fans</span>
                  <span className="font-mono text-xs tabular-nums text-[#8E909D]">
                    {youDontFollowCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('CLOSE_FRIENDS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'CLOSE_FRIENDS'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Close friends</span>
                  <span className="font-mono text-xs tabular-nums text-[#8E909D]">
                    {closeFriendsCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('REQUESTS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'REQUESTS'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Pending requests</span>
                  <span className="font-mono text-xs tabular-nums text-[#8E909D]">
                    {pendingRequestsCount}
                  </span>
                </button>

                <div className="pt-3 border-t border-white/[0.08] w-full mt-2">
                  <span className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase block px-3 pb-1">
                    Temporal
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentSection('TIMELINE');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'TIMELINE'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Timeline</span>
                  <span className="font-mono text-xs tabular-nums text-[#8E909D]">
                    {appState.snapshots.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('HISTORY');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'HISTORY'
                      ? 'bg-white text-[#0C0D0F] font-semibold'
                      : 'text-[#8E909D] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">History</span>
                  <span className="font-mono text-xs tabular-nums text-[#8E909D]">
                    {appState.events.length}
                  </span>
                </button>
              </nav>

              {/* CENTER COLUMN: MAIN WORKSPACE */}
              <div
                className={`col-span-1 md:col-span-8 ${
                  selectedUsername ? 'lg:col-span-5' : 'lg:col-span-9'
                } min-w-0`}
              >
                {currentSection === 'OVERVIEW' && latestSnapshot && (
                  <OverviewView
                    snapshot={latestSnapshot}
                    previousSnapshot={previousSnapshot}
                    events={appState.events}
                    profiles={appState.profiles}
                    onSelectCategory={setCurrentSection}
                    onSelectProfile={setSelectedUsername}
                  />
                )}

                {currentSection === 'MUTUALS' && latestSnapshot && (
                  <AccountListView
                    title="Mutual Bonds"
                    count={mutualsCount}
                    handles={latestSnapshot.mutuals || []}
                    relationshipLabel="Mutual"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'FOLLOWERS' && latestSnapshot && (
                  <AccountListView
                    title="All Followers"
                    count={followersCount}
                    handles={latestSnapshot.followers || []}
                    relationshipLabel="Follows you"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'FOLLOWING' && latestSnapshot && (
                  <AccountListView
                    title="Following Roster"
                    count={followingCount}
                    handles={latestSnapshot.following || []}
                    relationshipLabel="You follow"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'DONT_FOLLOW_BACK' && latestSnapshot && (
                  <AccountListView
                    title="Don't Follow Back"
                    count={notFollowingBackCount}
                    handles={latestSnapshot.followingNotFollowingBack || []}
                    relationshipLabel="Doesn't follow"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'YOU_DONT_FOLLOW' && latestSnapshot && (
                  <AccountListView
                    title="Fans (You Don't Follow Back)"
                    count={youDontFollowCount}
                    handles={latestSnapshot.followersNotFollowedBack || []}
                    relationshipLabel="Fan"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'LOST' && (
                  <AccountListView
                    title="Lost Followers"
                    count={lostFollowers.length}
                    handles={lostFollowers}
                    relationshipLabel="Severed"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'REQUESTS' && latestSnapshot && (
                  <AccountListView
                    title="Pending Requests"
                    count={pendingRequestsCount}
                    handles={latestSnapshot.pendingRequests || []}
                    relationshipLabel="Requested"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'CLOSE_FRIENDS' && latestSnapshot && (
                  <AccountListView
                    title="Close Friends List"
                    count={closeFriendsCount}
                    handles={latestSnapshot.closeFriends || []}
                    relationshipLabel="Close friend"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                    onToggleStar={handleToggleStar}
                  />
                )}

                {currentSection === 'TIMELINE' && (
                  <TimeMachineView
                    snapshots={appState.snapshots}
                    onOpenImport={() => setIsImportOpen(true)}
                    onSelectProfile={setSelectedUsername}
                  />
                )}

                {currentSection === 'HISTORY' && (
                  <HistoryEditorialView
                    events={appState.events}
                    onSelectProfile={setSelectedUsername}
                  />
                )}
              </div>

              {/* RIGHT COLUMN: DESKTOP CONTEXTUAL INSPECTOR (Desktop >= 1024px) */}
              <div className="hidden lg:block lg:col-span-4 sticky top-20">
                {selectedUsername ? (
                  <ProfileDetailPane
                    username={selectedUsername}
                    onClose={() => setSelectedUsername(null)}
                    snapshots={appState.snapshots}
                    events={appState.events}
                    profile={appState.profiles[selectedUsername.toLowerCase()]}
                    onSaveNotes={handleSaveProfileNotes}
                    onToggleStar={handleToggleStar}
                  />
                ) : (
                  <div className="p-8 bg-[#131418] border border-white/[0.08] rounded-xl text-center space-y-2">
                    <p className="text-[10px] font-mono tracking-widest text-[#8E909D] uppercase">
                      Account Dossier
                    </p>
                    <p className="text-xs text-[#565866] leading-relaxed">
                      Select any account in the audit roster to inspect their history and save private notes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </ErrorBoundary>

      {/* MOBILE SLIDE-UP ACCOUNT DOSSIER (Screens < 1024px) */}
      {selectedUsername && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedUsername(null)}
        >
          <div
            className="w-full sm:max-w-md bg-[#131418] border-t sm:border border-white/[0.12] rounded-t-2xl sm:rounded-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up min-w-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto my-3 sm:hidden" />
            <ProfileDetailPane
              username={selectedUsername}
              onClose={() => setSelectedUsername(null)}
              snapshots={appState.snapshots}
              events={appState.events}
              profile={appState.profiles[selectedUsername.toLowerCase()]}
              onSaveNotes={handleSaveProfileNotes}
              onToggleStar={handleToggleStar}
            />
          </div>
        </div>
      )}

      {/* MOBILE NATIVE BOTTOM NAVIGATION BAR (Screens < 768px when data exists) */}
      {hasData && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0C0D0F]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
          <button
            onClick={() => {
              setCurrentSection('OVERVIEW');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded transition cursor-pointer flex-1 ${
              currentSection === 'OVERVIEW' ? 'text-white' : 'text-[#8E909D] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="text-[10px] font-mono tracking-wider mt-1">Overview</span>
          </button>

          <button
            onClick={() => {
              setCurrentSection('DONT_FOLLOW_BACK');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded transition cursor-pointer flex-1 relative ${
              currentSection === 'DONT_FOLLOW_BACK' ? 'text-[#D94444]' : 'text-[#8E909D] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="text-[10px] font-mono tracking-wider mt-1">Not Back</span>
            {notFollowingBackCount > 0 && (
              <span className="absolute top-0 right-3 bg-[#D94444] text-white font-mono text-[9px] font-bold px-1.5 rounded-full">
                {notFollowingBackCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentSection('MUTUALS');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded transition cursor-pointer flex-1 relative ${
              currentSection === 'MUTUALS' ? 'text-[#2A8F53]' : 'text-[#8E909D] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-[10px] font-mono tracking-wider mt-1">Mutuals</span>
            {mutualsCount > 0 && (
              <span className="absolute top-0 right-3 bg-[#2A8F53] text-white font-mono text-[9px] font-bold px-1.5 rounded-full">
                {mutualsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentSection('TIMELINE');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded transition cursor-pointer flex-1 ${
              currentSection === 'TIMELINE' ? 'text-white' : 'text-[#8E909D] hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[10px] font-mono tracking-wider mt-1">Timeline</span>
          </button>

          <button
            onClick={() => setIsMobileMoreOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded transition cursor-pointer flex-1 text-[#8E909D] hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px] font-mono tracking-wider mt-1">Cohorts</span>
          </button>
        </nav>
      )}

      {/* MOBILE MORE COHORTS SHEET */}
      {isMobileMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end justify-center animate-fade-in"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-[#131418] border-t border-white/[0.1] rounded-t-2xl p-5 space-y-4 shadow-2xl animate-slide-up min-w-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="font-mono text-xs uppercase tracking-widest text-[#8E909D]">All Cohorts</span>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="text-xs text-[#8E909D] hover:text-white p-1"
              >
                &times; Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                onClick={() => {
                  setCurrentSection('FOLLOWERS');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded text-left flex justify-between items-center"
              >
                <span className="text-white">Followers</span>
                <span className="font-mono text-[#8E909D]">{followersCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('FOLLOWING');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded text-left flex justify-between items-center"
              >
                <span className="text-white">Following</span>
                <span className="font-mono text-[#8E909D]">{followingCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('YOU_DONT_FOLLOW');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded text-left flex justify-between items-center"
              >
                <span className="text-white">Fans</span>
                <span className="font-mono text-[#8E909D]">{youDontFollowCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('CLOSE_FRIENDS');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded text-left flex justify-between items-center"
              >
                <span className="text-white">Close Friends</span>
                <span className="font-mono text-[#8E909D]">{closeFriendsCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('REQUESTS');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded text-left flex justify-between items-center"
              >
                <span className="text-white">Pending</span>
                <span className="font-mono text-[#8E909D]">{pendingRequestsCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('HISTORY');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-[#0C0D0F] border border-white/[0.08] rounded text-left flex justify-between items-center"
              >
                <span className="text-white">History</span>
                <span className="font-mono text-[#8E909D]">{appState.events.length}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        currentSnapshots={appState.snapshots}
        onImportComplete={handleImportComplete}
      />

      <ConnectModal
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        onOpenImport={() => {
          setIsConnectOpen(false);
          setIsImportOpen(true);
        }}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        onPurgeData={handlePurgeAllData}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onPurgeData={handlePurgeAllData}
        totalSnapshots={appState.snapshots.length}
      />
    </div>
  );
}
