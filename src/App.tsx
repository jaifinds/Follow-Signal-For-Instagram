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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#FF3048] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not logged in with Google, has not chosen guest mode, and has no data loaded:
  if (!currentUser && !isGuestMode && !hasData) {
    return (
      <div className="min-h-screen bg-black text-[#F5F5F2] font-sans flex flex-col justify-center selection:bg-[#FF3048] selection:text-white">
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
    <div className="min-h-screen bg-black text-[#F5F5F2] font-sans flex flex-col selection:bg-[#FF3048] selection:text-white">
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
          className={`w-full py-2.5 px-4 text-xs font-mono flex items-center justify-between border-b ${
            oauthBanner.type === 'success'
              ? 'bg-[#0B2416] border-[#164227] text-[#2E9E60]'
              : 'bg-[#2A0B0E] border-[#4A141A] text-[#FF3048]'
          }`}
        >
          <div className="max-w-7xl mx-auto flex-1 flex items-center justify-between">
            <span>{oauthBanner.message}</span>
            <button
              onClick={() => setOauthBanner(null)}
              className="ml-4 underline cursor-pointer"
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
            <div className="py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* LEFT COLUMN: RELATIONSHIP CATEGORIES SIDEBAR */}
              <nav className="lg:col-span-3 font-mono text-xs border-b lg:border-b-0 lg:border-r border-[#1C1C1A] pb-4 lg:pb-0 lg:pr-6 flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-1.5">
                <span className="text-[10px] tracking-wider text-[#5F5F5B] uppercase hidden lg:block pb-2 font-bold">
                  RELATIONSHIPS
                </span>

                <button
                  onClick={() => {
                    setCurrentSection('OVERVIEW');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'OVERVIEW'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span>Overview</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('MUTUALS');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'MUTUALS'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Mutuals</span>
                  <span className="text-[11px] opacity-80">{mutualsCount}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('FOLLOWERS');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'FOLLOWERS'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Followers</span>
                  <span className="text-[11px] opacity-80">{followersCount}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('FOLLOWING');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'FOLLOWING'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Following</span>
                  <span className="text-[11px] opacity-80">{followingCount}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('DONT_FOLLOW_BACK');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'DONT_FOLLOW_BACK'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Don&apos;t follow back</span>
                  <span className="text-[11px] opacity-80">{notFollowingBackCount}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('YOU_DONT_FOLLOW');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'YOU_DONT_FOLLOW'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">You don&apos;t follow</span>
                  <span className="text-[11px] opacity-80">{youDontFollowCount}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('LOST');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'LOST'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Lost</span>
                  <span className="text-[11px] opacity-80">{lostFollowers.length}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('REQUESTS');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'REQUESTS'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Requests</span>
                  <span className="text-[11px] opacity-80">{pendingRequestsCount}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('CLOSE_FRIENDS');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'CLOSE_FRIENDS'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Close friends</span>
                  <span className="text-[11px] opacity-80">{closeFriendsCount}</span>
                </button>

                <div className="hidden lg:block pt-3 border-t border-[#1C1C1A] w-full mt-2">
                  <span className="text-[10px] tracking-wider text-[#5F5F5B] uppercase block pb-2 font-bold">
                    TEMPORAL FORENSICS
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCurrentSection('TIMELINE');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'TIMELINE'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">Time machine</span>
                  <span className="text-[11px] opacity-80">{appState.snapshots.length}</span>
                </button>

                <button
                  onClick={() => {
                    setCurrentSection('HISTORY');
                    setSelectedUsername(null);
                  }}
                  className={`shrink-0 lg:w-full py-2 px-3 text-left rounded-lg flex items-center justify-between whitespace-nowrap transition cursor-pointer ${
                    currentSection === 'HISTORY'
                      ? 'bg-[#141414] text-[#F5F5F2] border border-[#262624] font-semibold'
                      : 'text-[#9A9A96] hover:text-[#F5F5F2] hover:bg-[#0D0D0D]'
                  }`}
                >
                  <span className="mr-2">History</span>
                  <span className="text-[11px] opacity-80">{appState.events.length}</span>
                </button>
              </nav>

              {/* CENTER COLUMN: MAIN DATA WORKSPACE */}
              <div
                className={`lg:col-span-5 ${
                  selectedUsername ? 'hidden md:block' : 'col-span-1'
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

              {/* RIGHT COLUMN: CONTEXTUAL DETAIL PANE */}
              <div className="lg:col-span-4 sticky top-18">
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
                  <div className="hidden lg:block p-8 bg-[#050505] border border-dashed border-[#1C1C1A] rounded-2xl text-center space-y-2">
                    <p className="font-mono text-xs uppercase tracking-wider text-[#5F5F5B] font-bold">
                      FORENSIC INSPECTOR
                    </p>
                    <p className="text-xs text-[#5F5F5B] font-sans">
                      Select any account to inspect relationship provenance and add private notes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </ErrorBoundary>

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
