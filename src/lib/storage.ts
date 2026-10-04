import { AuditEvent, RelationshipEvent, Snapshot, SocialProfile, UserPreference } from '../types';
import { DEMO_ACCOUNT_HANDLE, DEMO_SNAPSHOTS, DEMO_USER_ID, SYNTHETIC_PROFILES, buildDemoEvents } from './demoData';
import { dbSaveSnapshot, dbSaveEvents, dbSaveProfiles, dbClearAllData, dbGetAllSnapshots, dbGetAllEvents, dbGetAllProfiles } from './db';

const STORAGE_KEYS = {
  CURRENT_MODE: 'chronograph_mode', // 'DEMO' | 'USER'
  USER_SNAPSHOTS: 'chronograph_user_snapshots',
  USER_EVENTS: 'chronograph_user_events',
  USER_PROFILES: 'chronograph_user_profiles',
  AUDIT_LOGS: 'chronograph_audit_logs',
  USER_PREFS: 'chronograph_user_prefs',
  ACCOUNT_USERNAME: 'chronograph_account_username',
};

export interface AppState {
  mode: 'DEMO' | 'USER';
  accountUsername: string;
  snapshots: Snapshot[];
  events: RelationshipEvent[];
  profiles: Record<string, SocialProfile>;
  auditLogs: AuditEvent[];
  preferences: UserPreference;
}

export function getDefaultPreferences(): UserPreference {
  return {
    theme: 'dark',
    autoCompareSnapshots: true,
    maskUsernamesInAudit: false,
    showConfidenceBadges: true,
  };
}

export function loadAppState(): AppState {
  try {
    const savedUsername = localStorage.getItem(STORAGE_KEYS.ACCOUNT_USERNAME) || 'my_instagram';

    // User mode: load from localStorage as fast initial state
    const snapshotsRaw = localStorage.getItem(STORAGE_KEYS.USER_SNAPSHOTS);
    const eventsRaw = localStorage.getItem(STORAGE_KEYS.USER_EVENTS);
    const profilesRaw = localStorage.getItem(STORAGE_KEYS.USER_PROFILES);
    const auditLogsRaw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    const prefsRaw = localStorage.getItem(STORAGE_KEYS.USER_PREFS);

    return {
      mode: 'USER',
      accountUsername: savedUsername,
      snapshots: snapshotsRaw ? JSON.parse(snapshotsRaw) : [],
      events: eventsRaw ? JSON.parse(eventsRaw) : [],
      profiles: profilesRaw ? JSON.parse(profilesRaw) : {},
      auditLogs: auditLogsRaw ? JSON.parse(auditLogsRaw) : [],
      preferences: prefsRaw ? JSON.parse(prefsRaw) : getDefaultPreferences(),
    };
  } catch (err) {
    console.error('Failed to load local app state, resetting to clean user workspace:', err);
    return {
      mode: 'USER',
      accountUsername: 'my_instagram',
      snapshots: [],
      events: [],
      profiles: {},
      auditLogs: [],
      preferences: getDefaultPreferences(),
    };
  }
}

/**
 * Asynchronously loads full state from IndexedDB (Section 22)
 */
export async function loadStateFromIndexedDB(): Promise<Partial<AppState>> {
  try {
    const [snapshots, events, profiles] = await Promise.all([
      dbGetAllSnapshots(),
      dbGetAllEvents(),
      dbGetAllProfiles(),
    ]);

    if (snapshots.length > 0) {
      return {
        snapshots,
        events,
        profiles,
      };
    }
  } catch (err) {
    console.warn('Could not read from IndexedDB, using localStorage cache', err);
  }
  return {};
}

/**
 * Saves snapshot and associated events both to IndexedDB and localStorage
 */
export async function saveUserSnapshot(
  snapshot: Snapshot,
  newEvents: RelationshipEvent[],
  auditEntry?: AuditEvent
) {
  try {
    // 1. Save to IndexedDB
    await dbSaveSnapshot(snapshot);
    if (newEvents.length > 0) {
      await dbSaveEvents(newEvents);
    }

    // 2. Mirror in localStorage for fast synchronous bootstrap
    const existingSnapshots: Snapshot[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USER_SNAPSHOTS) || '[]'
    );
    const filteredSnapshots = existingSnapshots.filter(s => s.id !== snapshot.id);
    filteredSnapshots.push(snapshot);
    localStorage.setItem(STORAGE_KEYS.USER_SNAPSHOTS, JSON.stringify(filteredSnapshots));

    const existingEvents: RelationshipEvent[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USER_EVENTS) || '[]'
    );
    const updatedEvents = [...newEvents, ...existingEvents];
    localStorage.setItem(STORAGE_KEYS.USER_EVENTS, JSON.stringify(updatedEvents));

    if (auditEntry) {
      const existingLogs: AuditEvent[] = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]'
      );
      localStorage.setItem(
        STORAGE_KEYS.AUDIT_LOGS,
        JSON.stringify([auditEntry, ...existingLogs])
      );
    }
  } catch (e) {
    console.error('Failed to save snapshot to storage:', e);
  }
}

export async function saveProfileMetadata(username: string, updates: Partial<SocialProfile>) {
  try {
    const lower = username.toLowerCase();
    const existing: Record<string, SocialProfile> = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.USER_PROFILES) || '{}'
    );
    const current = existing[lower] || {
      username: lower,
      profileUrl: `https://instagram.com/${lower}`,
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
    };
    existing[lower] = { ...current, ...updates, lastSeenAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.USER_PROFILES, JSON.stringify(existing));

    await dbSaveProfiles({ [lower]: existing[lower] });
  } catch (e) {
    console.error('Failed to save profile update:', e);
  }
}

export function setAppMode(mode: 'DEMO' | 'USER') {
  localStorage.setItem(STORAGE_KEYS.CURRENT_MODE, mode);
}

export function setAccountUsername(username: string) {
  localStorage.setItem(STORAGE_KEYS.ACCOUNT_USERNAME, username);
}

/**
 * Irreversible complete wipe of both localStorage and IndexedDB (Section 23)
 */
export async function purgeAllUserData() {
  await dbClearAllData();
  localStorage.removeItem(STORAGE_KEYS.USER_SNAPSHOTS);
  localStorage.removeItem(STORAGE_KEYS.USER_EVENTS);
  localStorage.removeItem(STORAGE_KEYS.USER_PROFILES);
  localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
  localStorage.removeItem(STORAGE_KEYS.ACCOUNT_USERNAME);
}

export function exportFullJsonArchive(state: AppState): string {
  const exportData = {
    app: 'Chronograph Social Graph Intelligence',
    version: '2.0.0',
    exportedAt: new Date().toISOString(),
    accountUsername: state.accountUsername,
    mode: state.mode,
    snapshotsCount: state.snapshots.length,
    eventsCount: state.events.length,
    profilesCount: Object.keys(state.profiles).length,
    data: {
      snapshots: state.snapshots,
      events: state.events,
      profiles: state.profiles,
      auditLogs: state.auditLogs,
    },
  };
  return JSON.stringify(exportData, null, 2);
}
