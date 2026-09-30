// Types for Chronograph — Instagram Relationship Intelligence Platform

export type RelationshipState =
  | 'MUTUAL'
  | 'THEY_FOLLOW_YOU'
  | 'YOU_FOLLOW_THEM'
  | 'NONE';

export type RelationshipEventType =
  | 'FOLLOWED'
  | 'UNFOLLOWED'
  | 'FOLLOW_BACK'
  | 'LOST_FOLLOWER'
  | 'BECAME_MUTUAL'
  | 'NO_LONGER_MUTUAL'
  | 'NEW_FOLLOWER'
  | 'FOLLOWED_YOU'
  | 'YOU_FOLLOWED'
  | 'STOPPED_FOLLOWING'
  | 'REQUEST_SENT'
  | 'REQUEST_PENDING'
  | 'PROFILE_OBSERVED'
  | 'PROFILE_CHANGED'
  | 'PROFILE_UNAVAILABLE'
  | 'USERNAME_CHANGED'
  | 'SNAPSHOT_IMPORTED';

export interface NormalizedProfile {
  username: string; // normalized lowercase trimmed
  displayName?: string; // preserved Unicode display name
  profileUrl: string; // safe Instagram profile URL
  source: string; // origin file e.g. 'followers_1.json'
  sourceTimestamp?: number; // Unix timestamp in seconds
  fbid?: string; // Facebook/Meta ID if provided
}

export interface SocialProfile {
  username: string;
  displayName?: string;
  profileUrl: string;
  avatarUrl?: string;
  isVerified?: boolean;
  isPrivate?: boolean;
  notes?: string;
  isStarred?: boolean;
  isIgnored?: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  source?: string;
  sourceTimestamp?: number;
  tags?: string[];
}

export interface SnapshotMember {
  username: string;
  displayName?: string;
  href?: string;
  timestamp?: number;
  relationshipType: 'FOLLOWER' | 'FOLLOWING' | 'CLOSE_FRIEND' | 'REQUEST' | 'UNFOLLOWED_RECENTLY';
}

export interface ImportReport {
  archiveName: string;
  filesDetected: number;
  detectedFilesList: string[];
  followers: number;
  following: number;
  mutual: number;
  followingWithoutFollowBack: number;
  followersNotFollowedBack: number;
  closeFriends: number;
  pendingRequests: number;
  recentRequests: number;
  recentlyUnfollowed: number;
  blockedProfiles?: number;
  warnings: string[];
  statusMessage: string;
  isBaseline: boolean;
  changesDetectedCount?: number;
}

export interface SnapshotMetrics {
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  followingNotFollowingBackCount: number;
  followersNotFollowedBackCount: number;
  closeFriendsCount: number;
  pendingRequestsCount: number;
  recentRequestsCount: number;
  recentlyUnfollowedCount: number;
  blockedProfilesCount?: number;
}

export interface Snapshot {
  id: string;
  importId?: string;
  userId: string;
  label: string;
  createdAt: string; // ISO string when snapshot was registered in system
  effectiveAt: string; // ISO string representing when export was generated
  sourceDate?: string; // ISO date extracted from export records
  source: 'EXPORT_JSON' | 'EXPORT_HTML' | 'EXPORT_ZIP' | 'OFFICIAL_OAUTH' | 'SYNTHETIC_DEMO' | 'PUBLIC_PROBE';
  followersCount: number;
  followingCount: number;
  mutualCount: number;
  followers: string[]; // List of lowercased usernames
  following: string[]; // List of lowercased usernames
  mutuals?: string[]; // F ∩ G
  followingNotFollowingBack?: string[]; // G - F
  followersNotFollowedBack?: string[]; // F - G
  closeFriends?: string[];
  pendingRequests?: string[];
  recentRequests?: string[];
  recentlyUnfollowed?: string[];
  blockedProfiles?: string[];
  profiles?: Record<string, NormalizedProfile>;
  metrics?: SnapshotMetrics;
  importReport?: ImportReport;
  metadata?: {
    formatDetected?: string;
    fileName?: string;
    parsedRecords?: number;
    skippedRecords?: number;
    accountUsername?: string;
    version?: string;
  };
}

export interface RelationshipEvent {
  id: string;
  userId: string;
  subjectUsername: string;
  eventType: RelationshipEventType;
  detectedAt: string; // ISO timestamp when snapshot was compared
  effectiveAt: string; // Timestamp from export or observation
  sourceSnapshotId: string;
  previousSnapshotId?: string;
  previousState: RelationshipState;
  newState: RelationshipState;
  confidence: 'CONFIRMED' | 'INFERRED_SNAPSHOT_DIFF';
  summary: string;
  details?: string;
}

export interface SnapshotComparison {
  priorSnapshotId?: string;
  currentSnapshotId: string;
  comparedAt: string;
  newFollowers: string[];
  lostFollowers: string[];
  newFollowing: string[];
  unfollowed: string[];
  becameMutual: string[];
  noLongerMutual: string[];
  notFollowingBack: string[]; // You follow, but they do NOT follow you
  youDontFollowBack: string[]; // They follow, but you do NOT follow them
  mutuals: string[];
}

export interface ImportJob {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'PENDING' | 'VALIDATING' | 'READING' | 'DISCOVERING' | 'PARSING' | 'NORMALIZING' | 'COMPARING' | 'COMPLETED' | 'FAILED';
  fileName: string;
  fileSize: number;
  formatDetected?: string;
  parsedRecords: number;
  skippedRecords: number;
  errors: string[];
  warnings: string[];
  snapshotId?: string;
  importReport?: ImportReport;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export interface UserPreference {
  theme: 'dark' | 'light';
  autoCompareSnapshots: boolean;
  maskUsernamesInAudit: boolean;
  showConfidenceBadges: boolean;
}
