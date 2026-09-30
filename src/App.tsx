import React, { useState, useEffect, useMemo } from 'react';
import {
  AppState,
  loadAppState,
  loadStateFromIndexedDB,
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
import { createOwnerExportZipBlob, createSecondCheckInZipBlob } from './fixtures/ownerExportZip';
import { parseUploadedExport, buildSnapshotFromParseResult } from './lib/exportParser';
import { compareSnapshots, generateEventsFromComparison } from './lib/snapshotEngine';
import { InstagramClient } from './lib/instagramClient';
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
  const [isLoadingVerified, setIsLoadingVerified] = useState(false);

  // OAuth notifications & Instagram live connection state
  const [oauthBanner, setOauthBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [connectedAccountUsername, setConnectedAccountUsername] = useState<string | null>(null);

  // Check Follow Signal user session & Google OAuth returns on mount
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

  // Keyboard accessibility: Escape to deselect profile or close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedUsername) setSelectedUsername(null);
        else if (isImportOpen) setIsImportOpen(false);
        else if (isConnectOpen) setIsConnectOpen(false);
        else if (isAboutOpen) setIsAboutOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUsername, isImportOpen, isConnectOpen, isAboutOpen]);

  // Check Instagram connection status & handle OAuth redirects on mount
  useEffect(() => {
    // 1. Check server status
    InstagramClient.getStatus()
      .then(status => {
        if (status.connected && status.account) {
          setConnectedAccountUsername(status.account.username);
        }
      })
      .catch(err => {
        console.warn('Instagram server status check:', err);
      });

    // 2. Check URL query parameters for OAuth returns
    const params = new URLSearchParams(window.location.search);
    const igConnected = params.get('instagram_connected');
    const igUsername = params.get('username');
    const igError = params.get('instagram_error');

    if (igConnected === 'true') {
      const user = igUsername || 'connected_account';
      setConnectedAccountUsername(user);
      setOauthBanner({
        type: 'success',
        message: `Connected to Instagram as @${user} via official Meta Graph API.`,
      });
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => setOauthBanner(null), 7000);
    } else if (igError) {
      setOauthBanner({
        type: 'error',
        message: `Instagram connection error: ${decodeURIComponent(igError)}`,
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Hydrate from IndexedDB if in USER mode
  useEffect(() => {
    if (appState.mode === 'USER') {
      loadStateFromIndexedDB().then(dbState => {
        if (dbState.snapshots && dbState.snapshots.length > 0) {
          setAppState(prev => ({
            ...prev,
            snapshots: dbState.snapshots || prev.snapshots,
            events: dbState.events || prev.events,
            profiles: dbState.profiles || prev.profiles,
          }));
        }
      });
    }
  }, [appState.mode]);

  // Handle saving profile notes
  const handleSaveProfileNotes = (
    username: string,
    notes: string,
    tags?: string[],
    isStarred?: boolean
  ) => {
    const lower = username.toLowerCase();
    saveProfileMetadata(lower, { notes, tags, isStarred });
    setAppState(prev => {
      const existing = prev.profiles[lower] || {
        username: lower,
        profileUrl: `https://instagram.com/${lower}`,
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
      };
      return {
        ...prev,
        profiles: {
          ...prev.profiles,
          [lower]: {
            ...existing,
            notes,
            tags: tags || existing.tags,
            isStarred: isStarred !== undefined ? isStarred : existing.isStarred,
            lastSeenAt: new Date().toISOString(),
          },
        },
      };
    });
  };

  // Ingestion of a new snapshot (from ZIP archive or Live API)
  const handleImportComplete = (newSnapshot: Snapshot, newEvents: RelationshipEvent[]) => {
    const auditEntry = {
      id: `audit_${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'ARCHIVE_INGESTION',
      actor: 'Local Archive Reader',
      details: `Successfully ingested "${newSnapshot.label}" with ${newSnapshot.followersCount} followers and ${newSnapshot.followingCount} following.`,
      severity: 'INFO' as const,
    };

    saveUserSnapshot(newSnapshot, newEvents, auditEntry);

    const mergedProfiles = { ...appState.profiles };
    if (newSnapshot.profiles) {
      Object.entries(newSnapshot.profiles).forEach(([normUser, normProf]) => {
        const existing = mergedProfiles[normUser];
        mergedProfiles[normUser] = {
          username: normUser,
          displayName: normProf.displayName || existing?.displayName,
          profileUrl: normProf.profileUrl,
          firstSeenAt: existing?.firstSeenAt || newSnapshot.createdAt,
          lastSeenAt: newSnapshot.createdAt,
          source: normProf.source,
          sourceTimestamp: normProf.sourceTimestamp,
          notes: existing?.notes,
          tags: existing?.tags,
          isStarred: existing?.isStarred,
        };
      });
    }

    setAppState(prev => ({
      ...prev,
      snapshots: [...prev.snapshots, newSnapshot],
      events: [...newEvents, ...prev.events],
      profiles: mergedProfiles,
      auditLogs: [auditEntry, ...prev.auditLogs],
    }));

    setCurrentSection('OVERVIEW');
  };

  // 1-Click Load Verified Regression Archive (163 Followers)
  const handleLoadVerifiedArchive = async () => {
    setIsLoadingVerified(true);
    try {
      const blob = await createOwnerExportZipBlob();
      const parseResult = await parseUploadedExport(blob);
      const prevSnap =
        appState.snapshots.length > 0
          ? appState.snapshots[appState.snapshots.length - 1]
          : null;
      const isBaseline = prevSnap === null;

      const newSnapshot = buildSnapshotFromParseResult(
        parseResult,
        'Verified Baseline Archive',
        'my_instagram',
        'instagram_verified_sample_export.zip',
        isBaseline
      );

      const comparison = prevSnap ? compareSnapshots(prevSnap, newSnapshot) : null;
      const newEvents = comparison
        ? generateEventsFromComparison(prevSnap, newSnapshot, comparison)
        : [];

      handleImportComplete(newSnapshot, newEvents);
    } catch (err) {
      console.error('Failed to load verified archive:', err);
    } finally {
      setIsLoadingVerified(false);
    }
  };

  // 1-Click Simulate Second Check-In (+3 / −2)
  const handleSimulateSecondCheckIn = async () => {
    setIsLoadingVerified(true);
    try {
      const blob = await createSecondCheckInZipBlob();
      const parseResult = await parseUploadedExport(blob);
      const prevSnap =
        appState.snapshots.length > 0
          ? appState.snapshots[appState.snapshots.length - 1]
          : null;
      const isBaseline = prevSnap === null;

      const newSnapshot = buildSnapshotFromParseResult(
        parseResult,
        'Second Check-in (+3/−2)',
        'my_instagram',
        'instagram_checkin_2_diff.zip',
        isBaseline
      );

      const comparison = prevSnap ? compareSnapshots(prevSnap, newSnapshot) : null;
      const newEvents = comparison
        ? generateEventsFromComparison(prevSnap, newSnapshot, comparison)
        : [];

      handleImportComplete(newSnapshot, newEvents);
    } catch (err) {
      console.error('Failed to simulate check-in:', err);
    } finally {
      setIsLoadingVerified(false);
    }
  };

  // Purge all local data
  const handlePurgeAllData = async () => {
    await purgeAllUserData();
    localStorage.clear();
    setAppState({
      mode: 'USER',
      accountUsername: 'my_instagram',
      snapshots: [],
      events: [],
      profiles: {},
      auditLogs: [],
      preferences: {
        theme: 'dark',
        autoCompareSnapshots: true,
        maskUsernamesInAudit: false,
        showConfidenceBadges: true,
      },
    });
    setSelectedUsername(null);
    setCurrentSection('OVERVIEW');
  };

  const hasData = appState.snapshots.length > 0;
  const latestSnapshot = hasData ? appState.snapshots[appState.snapshots.length - 1] : null;
  const previousSnapshot =
    appState.snapshots.length > 1 ? appState.snapshots[appState.snapshots.length - 2] : null;

  // Compute lost followers between snapshots
  const lostFollowers = useMemo(() => {
    if (!latestSnapshot || !previousSnapshot) return [];
    const currentFollowers = new Set(latestSnapshot.followers.map(u => u.toLowerCase()));
    return previousSnapshot.followers.filter(u => !currentFollowers.has(u.toLowerCase()));
  }, [latestSnapshot, previousSnapshot]);

  const mutualsCount = latestSnapshot?.mutualCount || 0;
  const followersCount = latestSnapshot?.followersCount || 0;
  const followingCount = latestSnapshot?.followingCount || 0;
  const notFollowingBackCount =
    latestSnapshot?.followingNotFollowingBack?.length ??
    Math.max(0, followingCount - mutualsCount);
  const youDontFollowCount =
    latestSnapshot?.followersNotFollowedBack?.length ??
    Math.max(0, followersCount - mutualsCount);
  const closeFriendsCount = latestSnapshot?.closeFriends?.length || 0;
  const pendingRequestsCount = latestSnapshot?.pendingRequests?.length || 0;

  // Map sub-section to main nav section for top Header highlight
  const mappedNavSection: MainNavSection = useMemo(() => {
    if (currentSection === 'OVERVIEW') return 'OVERVIEW';
    if (currentSection === 'HISTORY') return 'HISTORY';
    if (currentSection === 'TIMELINE') return 'TIME_MACHINE';
    return 'RELATIONSHIPS';
  }, [currentSection]);

  const handleSelectNavSection = (section: MainNavSection) => {
    setSelectedUsername(null);
    if (section === 'OVERVIEW') setCurrentSection('OVERVIEW');
    else if (section === 'RELATIONSHIPS') setCurrentSection('MUTUALS');
    else if (section === 'HISTORY') setCurrentSection('HISTORY');
    else if (section === 'TIME_MACHINE') setCurrentSection('TIMELINE');
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-[#070A12] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not logged in with Google, has not chosen guest mode, and has no data loaded:
  if (!currentUser && !isGuestMode && !hasData) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white font-sans flex flex-col justify-center selection:bg-[#F43F5E] selection:text-white">
        <LoginScreen
          onContinueAsGuestArchive={() => setIsGuestMode(true)}
          onOpenImport={() => {
            setIsGuestMode(true);
            setIsImportOpen(true);
          }}
          onLoadVerifiedArchive={() => {
            setIsGuestMode(true);
            handleLoadVerifiedArchive();
          }}
          isLoadingVerified={isLoadingVerified}
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
    <div className="min-h-screen bg-[#070A12] text-white font-sans flex flex-col selection:bg-[#F43F5E] selection:text-white">
      {/* Modern Top Header */}
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
          className={`w-full py-3 px-4 text-xs font-mono font-bold flex items-center justify-between border-b-2 ${
            oauthBanner.type === 'success'
              ? 'bg-[#064E3B] border-[#10B981] text-white'
              : 'bg-[#4C0519] border-[#F43F5E] text-white'
          }`}
        >
          <div className="max-w-7xl mx-auto flex-1 flex items-center justify-between">
            <span>{oauthBanner.message}</span>
            <button
              onClick={() => setOauthBanner(null)}
              className="ml-4 underline cursor-pointer hover:text-[#38BDF8]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <ErrorBoundary fallbackTitle="View Rendering Recovered">
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!hasData ? (
            /* SCENE 01: HERO VIEW WITH LIVE INTERACTIVE PREVIEW */
            <HeroView
              userName={currentUser?.name}
              onOpenImport={() => setIsImportOpen(true)}
              onOpenConnect={() => setIsConnectOpen(true)}
              onLoadVerifiedArchive={handleLoadVerifiedArchive}
              isLoadingVerified={isLoadingVerified}
            />
          ) : (
            /* SCENE 02: MAIN APP SPLIT 3-COLUMN LAYOUT */
            <div className="py-6 sm:py-8 grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start pb-28 md:pb-8">
              {/* LEFT COLUMN: RELATIONSHIP CATEGORIES SIDEBAR (Visible on Tablet & Desktop) */}
              <nav className="hidden md:flex md:col-span-4 lg:col-span-3 font-sans text-xs border border-white/[0.08] bg-[#141414] p-3 rounded-2xl shadow-xl flex-col gap-1 sticky top-20 min-w-0">
                <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase block px-3 py-1">
                  Categories
                </span>

                <button
                  onClick={() => {
                    setCurrentSection('OVERVIEW');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'OVERVIEW'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('DONT_FOLLOW_BACK');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'DONT_FOLLOW_BACK'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Don&apos;t follow back</span>
                  <span className="font-mono text-xs tabular-nums text-red-400 font-semibold">
                    {notFollowingBackCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('MUTUALS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'MUTUALS'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Mutual friends</span>
                  <span className="font-mono text-xs tabular-nums text-emerald-400 font-semibold">
                    {mutualsCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('FOLLOWERS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'FOLLOWERS'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">All followers</span>
                  <span className="font-mono text-xs tabular-nums text-white">
                    {followersCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('FOLLOWING');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'FOLLOWING'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Following</span>
                  <span className="font-mono text-xs tabular-nums text-white">
                    {followingCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('YOU_DONT_FOLLOW');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'YOU_DONT_FOLLOW'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Fans (You don&apos;t follow)</span>
                  <span className="font-mono text-xs tabular-nums text-neutral-400">
                    {youDontFollowCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('CLOSE_FRIENDS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'CLOSE_FRIENDS'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Close friends</span>
                  <span className="font-mono text-xs tabular-nums text-neutral-400">
                    {closeFriendsCount}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('LOST');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'LOST'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Lost followers</span>
                  <span className="font-mono text-xs tabular-nums text-red-400">
                    {lostFollowers.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('REQUESTS');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'REQUESTS'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Pending requests</span>
                  <span className="font-mono text-xs tabular-nums text-neutral-400">
                    {pendingRequestsCount}
                  </span>
                </button>

                <div className="pt-3 border-t border-white/[0.08] w-full mt-2">
                  <span className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase block px-3 pb-1">
                    Timeline & History
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentSection('TIMELINE');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'TIMELINE'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">Timeline</span>
                  <span className="font-mono text-xs tabular-nums text-neutral-400">
                    {appState.snapshots.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('HISTORY');
                    setSelectedUsername(null);
                  }}
                  className={`w-full py-2.5 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'HISTORY'
                      ? 'bg-white/[0.08] text-white font-semibold border-l-2 border-white'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="mr-2">History</span>
                  <span className="font-mono text-xs tabular-nums text-neutral-400">
                    {appState.events.length}
                  </span>
                </button>
              </nav>

              {/* CENTER COLUMN: MAIN DATA WORKSPACE */}
              <div
                className={`col-span-1 md:col-span-8 ${
                  selectedUsername ? 'lg:col-span-5' : 'lg:col-span-9'
                }`}
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
                    title="Mutual bonds"
                    count={mutualsCount}
                    handles={latestSnapshot.mutuals || []}
                    relationshipLabel="Mutual"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'FOLLOWERS' && latestSnapshot && (
                  <AccountListView
                    title="Followers"
                    count={followersCount}
                    handles={latestSnapshot.followers || []}
                    relationshipLabel="Follows you"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'FOLLOWING' && latestSnapshot && (
                  <AccountListView
                    title="Following"
                    count={followingCount}
                    handles={latestSnapshot.following || []}
                    relationshipLabel="You follow"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'DONT_FOLLOW_BACK' && latestSnapshot && (
                  <AccountListView
                    title="Don't follow back"
                    count={notFollowingBackCount}
                    handles={latestSnapshot.followingNotFollowingBack || []}
                    relationshipLabel="Doesn't follow"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'YOU_DONT_FOLLOW' && latestSnapshot && (
                  <AccountListView
                    title="You don't follow back"
                    count={youDontFollowCount}
                    handles={latestSnapshot.followersNotFollowedBack || []}
                    relationshipLabel="Fan"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'LOST' && (
                  <AccountListView
                    title="Lost followers"
                    count={lostFollowers.length}
                    handles={lostFollowers}
                    relationshipLabel="Severed"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'REQUESTS' && latestSnapshot && (
                  <AccountListView
                    title="Pending requests"
                    count={pendingRequestsCount}
                    handles={latestSnapshot.pendingRequests || []}
                    relationshipLabel="Requested"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'CLOSE_FRIENDS' && latestSnapshot && (
                  <AccountListView
                    title="Close friends"
                    count={closeFriendsCount}
                    handles={latestSnapshot.closeFriends || []}
                    relationshipLabel="Close friend"
                    selectedUsername={selectedUsername}
                    onSelectProfile={setSelectedUsername}
                    profiles={appState.profiles}
                  />
                )}

                {currentSection === 'TIMELINE' && (
                  <TimeMachineView
                    snapshots={appState.snapshots}
                    onSimulateSecondCheckIn={handleSimulateSecondCheckIn}
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

              {/* RIGHT COLUMN: CONTEXTUAL DETAIL PANE (Desktop >= 1024px) */}
              <div className="hidden lg:block lg:col-span-4 sticky top-20">
                {selectedUsername ? (
                  <ProfileDetailPane
                    username={selectedUsername}
                    onClose={() => setSelectedUsername(null)}
                    snapshots={appState.snapshots}
                    events={appState.events}
                    profile={appState.profiles[selectedUsername.toLowerCase()]}
                    onSaveNotes={handleSaveProfileNotes}
                  />
                ) : (
                  <div className="p-8 bg-[#12141D] border border-white/[0.08] rounded-2xl text-center space-y-2">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                      Account Inspector
                    </p>
                    <p className="text-xs text-slate-500 font-sans leading-relaxed">
                      Select any account in the list to view their follower history, relationship details, and add private notes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </ErrorBoundary>

      {/* Mobile Slide-Up Account Details Sheet (Screens < 1024px) */}
      {selectedUsername && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedUsername(null)}
        >
          <div
            className="w-full sm:max-w-md bg-[#141414] border-t sm:border border-white/[0.12] rounded-t-3xl sm:rounded-2xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up min-w-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3 sm:hidden" />
            <ProfileDetailPane
              username={selectedUsername}
              onClose={() => setSelectedUsername(null)}
              snapshots={appState.snapshots}
              events={appState.events}
              profile={appState.profiles[selectedUsername.toLowerCase()]}
              onSaveNotes={handleSaveProfileNotes}
            />
          </div>
        </div>
      )}

      {/* Mobile Native Bottom Navigation Bar (Screens < 768px when data exists) */}
      {hasData && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-2 flex items-center justify-around shadow-2xl safe-area-bottom">
          <button
            onClick={() => {
              setCurrentSection('OVERVIEW');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 ${
              currentSection === 'OVERVIEW' ? 'text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-base leading-none">📊</span>
            <span className="text-[10px] font-semibold mt-1">Overview</span>
          </button>

          <button
            onClick={() => {
              setCurrentSection('DONT_FOLLOW_BACK');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 relative ${
              currentSection === 'DONT_FOLLOW_BACK' ? 'text-red-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-base leading-none">💔</span>
            <span className="text-[10px] font-semibold mt-1">Unfollowers</span>
            {notFollowingBackCount > 0 && (
              <span className="absolute top-0 right-2 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 rounded-full">
                {notFollowingBackCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentSection('MUTUALS');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 relative ${
              currentSection === 'MUTUALS' ? 'text-emerald-400' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-base leading-none">👥</span>
            <span className="text-[10px] font-semibold mt-1">Mutuals</span>
            {mutualsCount > 0 && (
              <span className="absolute top-0 right-2 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 rounded-full">
                {mutualsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setCurrentSection('TIMELINE');
              setSelectedUsername(null);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 ${
              currentSection === 'TIMELINE' ? 'text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="text-base leading-none">⏳</span>
            <span className="text-[10px] font-semibold mt-1">Timeline</span>
          </button>

          <button
            onClick={() => setIsMobileMoreOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl transition cursor-pointer flex-1 text-neutral-400 hover:text-white"
          >
            <span className="text-base leading-none">☰</span>
            <span className="text-[10px] font-semibold mt-1">More</span>
          </button>
        </nav>
      )}

      {/* Mobile More Sheet */}
      {isMobileMoreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end justify-center animate-fade-in"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div
            className="w-full bg-[#141414] border-t border-white/[0.12] rounded-t-3xl p-5 space-y-4 shadow-2xl animate-slide-up min-w-0"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-2" />
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="font-semibold text-sm text-white">All Categories</span>
              <button
                onClick={() => setIsMobileMoreOpen(false)}
                className="text-xs text-neutral-400 hover:text-white p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                onClick={() => {
                  setCurrentSection('FOLLOWERS');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left flex justify-between items-center"
              >
                <span>Followers</span>
                <span className="font-mono text-neutral-400">{followersCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('FOLLOWING');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left flex justify-between items-center"
              >
                <span>Following</span>
                <span className="font-mono text-neutral-400">{followingCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('YOU_DONT_FOLLOW');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left flex justify-between items-center"
              >
                <span>Fans</span>
                <span className="font-mono text-neutral-400">{youDontFollowCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('CLOSE_FRIENDS');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left flex justify-between items-center"
              >
                <span>Close Friends</span>
                <span className="font-mono text-neutral-400">{closeFriendsCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('LOST');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left flex justify-between items-center"
              >
                <span>Lost</span>
                <span className="font-mono text-red-400">{lostFollowers.length}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('REQUESTS');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left flex justify-between items-center"
              >
                <span>Requests</span>
                <span className="font-mono text-neutral-400">{pendingRequestsCount}</span>
              </button>

              <button
                onClick={() => {
                  setCurrentSection('HISTORY');
                  setSelectedUsername(null);
                  setIsMobileMoreOpen(false);
                }}
                className="col-span-2 p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-left flex justify-between items-center"
              >
                <span>History Log</span>
                <span className="font-mono text-neutral-400">{appState.events.length} records</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-white/[0.08]">
              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="text-xs text-neutral-300 hover:text-white"
              >
                ⚙ Settings & Storage
              </button>
              <button
                onClick={() => {
                  setIsMobileMoreOpen(false);
                  setIsAboutOpen(true);
                }}
                className="text-xs text-neutral-400 hover:text-white"
              >
                About Follow Signal
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
        onSnapshotCreated={snap => {
          handleImportComplete(snap, []);
        }}
        onAccountConnected={user => {
          setConnectedAccountUsername(user);
        }}
        onAccountDisconnected={() => {
          setConnectedAccountUsername(null);
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
