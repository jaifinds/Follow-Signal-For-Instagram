import JSZip from 'jszip';
import { NormalizedProfile, Snapshot, ImportReport } from '../types';

export interface ParseResult {
  followers: string[];
  following: string[];
  mutuals: string[];
  followingNotFollowingBack: string[];
  followersNotFollowedBack: string[];
  closeFriends: string[];
  pendingRequests: string[];
  recentRequests: string[];
  recentlyUnfollowed: string[];
  blockedProfiles: string[];
  profiles: Record<string, NormalizedProfile>;
  sourceFormat: 'ZIP' | 'JSON' | 'HTML' | 'CSV';
  schemaDetected: string;
  parsedRecords: number;
  skippedRecords: number;
  errors: string[];
  warnings: string[];
  effectiveDate?: string;
  accountUsername?: string;
  importReport?: ImportReport;
}

/**
 * Normalizes username by trimming, removing leading '@', lowercasing,
 * and extracting handle from URLs if a full URL was provided.
 * Properly removes Meta mobile '_u/' prefix and ignores platform system routes.
 */
export function normalizeUsername(input: string | null | undefined): string {
  if (!input) return '';
  let cleaned = String(input).trim();

  // If full Instagram URL, extract path segment
  if (cleaned.includes('instagram.com/')) {
    try {
      const url = new URL(cleaned.startsWith('http') ? cleaned : `https://${cleaned}`);
      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length > 0) {
        if (segments[0] === '_u' && segments.length > 1) {
          cleaned = segments[1];
        } else {
          cleaned = segments[0];
        }
      }
    } catch {
      const match = cleaned.match(/instagram\.com\/(?:_u\/)?([a-zA-Z0-9._]+)/);
      if (match && match[1]) {
        cleaned = match[1];
      }
    }
  }

  // Remove leading @ and unwanted punctuation
  cleaned = cleaned.replace(/^@+/, '').trim().toLowerCase();
  // Valid IG handles: letters, numbers, periods, underscores
  cleaned = cleaned.replace(/[^a-z0-9._]/g, '');

  const systemKeywords = new Set([
    'explore',
    'reels',
    'stories',
    'direct',
    'accounts',
    'about',
    'legal',
    'privacy',
    'terms',
    'settings',
    '_u',
  ]);
  if (systemKeywords.has(cleaned)) {
    return '';
  }

  return cleaned;
}

/**
 * Validates and safely constructs an Instagram profile URL
 */
export function buildProfileUrl(username: string, rawHref?: string): string {
  const norm = normalizeUsername(username);
  if (rawHref && typeof rawHref === 'string' && rawHref.startsWith('http')) {
    try {
      const parsed = new URL(rawHref);
      if (parsed.hostname.includes('instagram.com')) {
        return rawHref;
      }
    } catch {
      // fallback
    }
  }
  return norm ? `https://www.instagram.com/${norm}/` : 'https://www.instagram.com/';
}

/**
 * Specialized parsing adapter for individual relationship records.
 * Supports:
 * - Meta standard: { title: "", string_list_data: [{ href, value, timestamp }] }
 * - Title-first: { title: "username", string_list_data: [{ href, timestamp }] }
 * - Label-values: [ { label: "URL", value: "..." }, { label: "Name", value: "..." }, { label: "Username", value: "..." } ]
 * - Direct object: { value: "username", href: "..." } or { username: "username", displayName: "..." }
 * - Plain string handle
 */
export function parseGenericRelationshipRecord(
  rawItem: any,
  sourceFile: string
): NormalizedProfile | null {
  if (!rawItem) return null;

  // Case 1: Raw string
  if (typeof rawItem === 'string') {
    const norm = normalizeUsername(rawItem);
    if (!norm) return null;
    return {
      username: norm,
      profileUrl: buildProfileUrl(norm),
      source: sourceFile,
    };
  }

  // Case 2: Array of label_values: [ { label: 'URL', value: '...' }, { label: 'Username', value: '...' } ]
  if (Array.isArray(rawItem)) {
    let username = '';
    let displayName = '';
    let profileUrl = '';
    let timestamp: number | undefined;

    for (const entry of rawItem) {
      if (!entry || typeof entry !== 'object') continue;
      const label = String(entry.label || '').toLowerCase();
      const val = String(entry.value || '');
      if (label === 'username') {
        username = val;
      } else if (label === 'name') {
        displayName = val;
      } else if (label === 'url') {
        profileUrl = val;
      } else if (label.includes('time') || label.includes('date')) {
        const ts = Number(entry.value);
        if (!isNaN(ts) && ts > 0) timestamp = ts;
      }
    }

    const norm = normalizeUsername(username || profileUrl);
    if (!norm) return null;

    return {
      username: norm,
      displayName: displayName || undefined,
      profileUrl: buildProfileUrl(norm, profileUrl),
      source: sourceFile,
      sourceTimestamp: timestamp,
    };
  }

  if (typeof rawItem !== 'object') return null;

  // Case 3: Label values property on object
  if (Array.isArray(rawItem.label_values)) {
    return parseGenericRelationshipRecord(rawItem.label_values, sourceFile);
  }

  // Case 4: Meta standard with string_list_data
  let username = '';
  let displayName = '';
  let href = '';
  let timestamp: number | undefined;
  let fbid: string | undefined;

  if (rawItem.title && typeof rawItem.title === 'string') {
    displayName = rawItem.title;
    username = rawItem.title;
  }

  if (Array.isArray(rawItem.string_list_data) && rawItem.string_list_data.length > 0) {
    const firstSub = rawItem.string_list_data[0];
    if (firstSub && typeof firstSub === 'object') {
      if (firstSub.value) username = firstSub.value;
      if (firstSub.href) href = firstSub.href;
      if (typeof firstSub.timestamp === 'number' && firstSub.timestamp > 0) {
        timestamp = firstSub.timestamp;
      }
      if (firstSub.fbid) fbid = String(firstSub.fbid);
    }
  }

  // Fallbacks on root object
  if (!username) {
    username = rawItem.value || rawItem.username || rawItem.name || href || '';
  }
  if (!href && rawItem.href) {
    href = rawItem.href;
  }
  if (!timestamp && typeof rawItem.timestamp === 'number') {
    timestamp = rawItem.timestamp;
  }
  if (!displayName && rawItem.name) {
    displayName = rawItem.name;
  }

  const norm = normalizeUsername(username || href);
  if (!norm) return null;

  return {
    username: norm,
    displayName: displayName && displayName !== norm ? displayName : undefined,
    profileUrl: buildProfileUrl(norm, href),
    source: sourceFile,
    sourceTimestamp: timestamp,
    fbid,
  };
}

/**
 * Specialized Adapters Architecture (Section 3)
 */
export const FollowersParser = {
  name: 'FollowersParser',
  parse(data: any, sourceFile: string): NormalizedProfile[] {
    const list: NormalizedProfile[] = [];
    if (!data) return list;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.relationships_followers)
      ? data.relationships_followers
      : Array.isArray(data.followers)
      ? data.followers
      : [data];

    for (const item of items) {
      const parsed = parseGenericRelationshipRecord(item, sourceFile);
      if (parsed) list.push(parsed);
    }
    return list;
  },
};

export const FollowingParser = {
  name: 'FollowingParser',
  parse(data: any, sourceFile: string): NormalizedProfile[] {
    const list: NormalizedProfile[] = [];
    if (!data) return list;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.relationships_following)
      ? data.relationships_following
      : Array.isArray(data.following)
      ? data.following
      : [data];

    for (const item of items) {
      const parsed = parseGenericRelationshipRecord(item, sourceFile);
      if (parsed) list.push(parsed);
    }
    return list;
  },
};

export const CloseFriendsParser = {
  name: 'CloseFriendsParser',
  parse(data: any, sourceFile: string): NormalizedProfile[] {
    const list: NormalizedProfile[] = [];
    if (!data) return list;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.relationships_close_friends)
      ? data.relationships_close_friends
      : Array.isArray(data.close_friends)
      ? data.close_friends
      : [data];

    for (const item of items) {
      const parsed = parseGenericRelationshipRecord(item, sourceFile);
      if (parsed) list.push(parsed);
    }
    return list;
  },
};

export const PendingRequestsParser = {
  name: 'PendingRequestsParser',
  parse(data: any, sourceFile: string): NormalizedProfile[] {
    const list: NormalizedProfile[] = [];
    if (!data) return list;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.relationships_follow_requests_sent)
      ? data.relationships_follow_requests_sent
      : Array.isArray(data.pending_requests)
      ? data.pending_requests
      : [data];

    for (const item of items) {
      const parsed = parseGenericRelationshipRecord(item, sourceFile);
      if (parsed) list.push(parsed);
    }
    return list;
  },
};

export const RecentRequestsParser = {
  name: 'RecentRequestsParser',
  parse(data: any, sourceFile: string): NormalizedProfile[] {
    const list: NormalizedProfile[] = [];
    if (!data) return list;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.relationships_permanent_follow_requests)
      ? data.relationships_permanent_follow_requests
      : Array.isArray(data.recent_follow_requests)
      ? data.recent_follow_requests
      : [data];

    for (const item of items) {
      const parsed = parseGenericRelationshipRecord(item, sourceFile);
      if (parsed) list.push(parsed);
    }
    return list;
  },
};

export const RecentlyUnfollowedParser = {
  name: 'RecentlyUnfollowedParser',
  parse(data: any, sourceFile: string): NormalizedProfile[] {
    const list: NormalizedProfile[] = [];
    if (!data) return list;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.relationships_unfollowed_users)
      ? data.relationships_unfollowed_users
      : Array.isArray(data.recently_unfollowed_profiles)
      ? data.recently_unfollowed_profiles
      : [data];

    for (const item of items) {
      const parsed = parseGenericRelationshipRecord(item, sourceFile);
      if (parsed) list.push(parsed);
    }
    return list;
  },
};

export const BlockedProfilesParser = {
  name: 'BlockedProfilesParser',
  parse(data: any, sourceFile: string): NormalizedProfile[] {
    const list: NormalizedProfile[] = [];
    if (!data) return list;

    const items = Array.isArray(data)
      ? data
      : Array.isArray(data.relationships_blocked_users)
      ? data.relationships_blocked_users
      : Array.isArray(data.blocked_users)
      ? data.blocked_users
      : Array.isArray(data.blocked_profiles)
      ? data.blocked_profiles
      : [data];

    for (const item of items) {
      const parsed = parseGenericRelationshipRecord(item, sourceFile);
      if (parsed) list.push(parsed);
    }
    return list;
  },
};

/**
 * Extracts normalized profiles from Meta Instagram HTML export
 */
export function extractProfilesFromMetaHtml(htmlContent: string, sourceFile: string): NormalizedProfile[] {
  const map = new Map<string, NormalizedProfile>();

  // Match <a href="https://www.instagram.com/username"> or target="_blank"
  const linkRegex = /href=["']https?:\/\/(?:www\.)?instagram\.com\/(?:_u\/)?([a-zA-Z0-9._]+)\/?["'][^>]*>(.*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const rawUser = match[1];
    const rawText = match[2]?.replace(/<[^>]*>/g, '').trim();
    const norm = normalizeUsername(rawUser);
    if (norm) {
      map.set(norm, {
        username: norm,
        displayName: rawText && rawText !== norm ? rawText : undefined,
        profileUrl: buildProfileUrl(norm),
        source: sourceFile,
      });
    }
  }

  // Also parse text tags: >@?username<
  const tagRegex = />@?([a-zA-Z0-9._]{3,30})<\/(?:a|span|div|td)>/gi;
  while ((match = tagRegex.exec(htmlContent)) !== null) {
    const rawUser = match[1];
    const norm = normalizeUsername(rawUser);
    if (norm && !map.has(norm)) {
      map.set(norm, {
        username: norm,
        profileUrl: buildProfileUrl(norm),
        source: sourceFile,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Extracts normalized profiles from CSV or plaintext list
 */
export function extractProfilesFromCsv(csvContent: string, sourceFile: string): NormalizedProfile[] {
  const map = new Map<string, NormalizedProfile>();
  const lines = csvContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const parts = line.split(/[,;\t]/);
    const candidate = parts[0]?.trim();
    const displayName = parts[1]?.trim();
    if (candidate) {
      const norm = normalizeUsername(candidate);
      if (norm) {
        map.set(norm, {
          username: norm,
          displayName: displayName || undefined,
          profileUrl: buildProfileUrl(norm),
          source: sourceFile,
        });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Merges two profile records preserving the richest metadata
 */
export function mergeProfile(existing: NormalizedProfile | undefined, incoming: NormalizedProfile): NormalizedProfile {
  if (!existing) return incoming;
  return {
    username: existing.username,
    displayName: incoming.displayName || existing.displayName,
    profileUrl: incoming.profileUrl || existing.profileUrl,
    source: existing.source || incoming.source,
    sourceTimestamp: incoming.sourceTimestamp || existing.sourceTimestamp,
    fbid: incoming.fbid || existing.fbid,
  };
}

/**
 * Master InstagramExportParser Pipeline (Sections 1 - 6, 17, 18, 24, 25)
 * Safely parses ZIP archives, multi-part JSON, HTML, and CSV.
 */
export class InstagramExportParser {
  private static readonly MAX_FILE_SIZE = 80 * 1024 * 1024; // 80 MB
  private static readonly MAX_DECOMPRESSED_SIZE = 250 * 1024 * 1024; // 250 MB (Zip-bomb defense)
  private static readonly MAX_FILE_COUNT = 10000;

  public static async parse(
    file: File | Blob,
    fileName: string,
    onProgress?: (step: string, percent: number) => void
  ): Promise<ParseResult> {
    const lowerFileName = fileName.toLowerCase();
    const errors: string[] = [];
    const warnings: string[] = [];

    const followersMap = new Map<string, NormalizedProfile>();
    const followingMap = new Map<string, NormalizedProfile>();
    const closeFriendsMap = new Map<string, NormalizedProfile>();
    const pendingRequestsMap = new Map<string, NormalizedProfile>();
    const recentRequestsMap = new Map<string, NormalizedProfile>();
    const recentlyUnfollowedMap = new Map<string, NormalizedProfile>();
    const blockedProfilesMap = new Map<string, NormalizedProfile>();
    const allProfilesMap = new Map<string, NormalizedProfile>();

    let sourceFormat: 'ZIP' | 'JSON' | 'HTML' | 'CSV' = 'JSON';
    let schemaDetected = 'Meta Instagram Export';
    let effectiveDate: string | undefined;
    const timestamps: number[] = [];

    // Stage 1: Validation
    onProgress?.('Validating archive file size and MIME constraints...', 10);

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowable upload limit of 80MB.`
      );
    }

    if (lowerFileName.endsWith('.zip')) {
      sourceFormat = 'ZIP';
      onProgress?.('Opening and decompressing archive safely in client sandbox...', 25);

      const zip = new JSZip();
      let loadedZip: JSZip;
      try {
        loadedZip = await zip.loadAsync(file);
      } catch (err: any) {
        throw new Error(`Failed to decompress ZIP archive: ${err.message || 'Corrupted archive'}`);
      }

      // Stage 2: File Discovery
      onProgress?.('Discovering and categorizing relationship files...', 40);

      const allEntries = Object.keys(loadedZip.files);
      if (allEntries.length > this.MAX_FILE_COUNT) {
        throw new Error(`Archive exceeds maximum entry limit of ${this.MAX_FILE_COUNT} files.`);
      }

      // Filter valid entries (path traversal & system file defense)
      const validPaths = allEntries.filter(path => {
        if (loadedZip.files[path].dir) return false;
        if (path.includes('../') || path.startsWith('/') || path.includes('\\..\\')) {
          warnings.push(`Path traversal attempt blocked: "${path}"`);
          return false;
        }
        if (path.includes('__MACOSX') || path.endsWith('.DS_Store')) return false;
        return true;
      });

      // Track decompressed size
      let totalDecompressedBytes = 0;

      // Group categorized files
      const followerFiles: string[] = [];
      const followingFiles: string[] = [];
      const closeFriendsFiles: string[] = [];
      const pendingRequestsFiles: string[] = [];
      const recentRequestsFiles: string[] = [];
      const recentlyUnfollowedFiles: string[] = [];
      const blockedFiles: string[] = [];

      for (const path of validPaths) {
        const segments = path.split('/');
        const baseName = (segments[segments.length - 1] || '').toLowerCase();

        // Close friends
        if (baseName.includes('close_friend') || baseName.includes('closefriend')) {
          closeFriendsFiles.push(path);
        }
        // Pending requests sent
        else if (baseName.includes('pending_follow_request') || baseName.includes('pending_request')) {
          pendingRequestsFiles.push(path);
        }
        // Recent requests
        else if (baseName.includes('recent_follow_request') || baseName.includes('permanent_follow_request')) {
          recentRequestsFiles.push(path);
        }
        // Recently unfollowed profiles (Section 13)
        else if (baseName.includes('recently_unfollowed') || baseName.includes('unfollowed_profiles')) {
          recentlyUnfollowedFiles.push(path);
        }
        // Blocked profiles
        else if (baseName.includes('blocked')) {
          blockedFiles.push(path);
        }
        // Followers: followers_1.json, followers_2.json, followers.json, followers.html
        else if (baseName.includes('follower')) {
          followerFiles.push(path);
        }
        // Following: following.json, following_1.json, following.html
        else if (baseName.includes('following')) {
          followingFiles.push(path);
        }
      }

      // Helper to safely read and parse text from zip with size limit
      const readTextSafe = async (path: string): Promise<string> => {
        const entry = loadedZip.files[path];
        const text = await entry.async('text');
        totalDecompressedBytes += text.length;
        if (totalDecompressedBytes > this.MAX_DECOMPRESSED_SIZE) {
          throw new Error('Decompressed payload exceeded safety quota (250MB). Zip-bomb protection triggered.');
        }
        return text;
      };

      // Helper to parse JSON with record-level tolerance
      const parseJsonSafe = (text: string, path: string): any => {
        try {
          return JSON.parse(text);
        } catch (e: any) {
          warnings.push(`Could not parse JSON file "${path}": ${e.message}`);
          return null;
        }
      };

      // Stage 3: Parsing Relationships
      onProgress?.('Executing specialized parsers on discovered datasets...', 55);

      // 1. Follower Files (handles multi-part: followers_1.json, followers_2.json, etc.)
      for (const path of followerFiles) {
        try {
          const text = await readTextSafe(path);
          const lower = path.toLowerCase();
          let records: NormalizedProfile[] = [];

          if (lower.endsWith('.json')) {
            const data = parseJsonSafe(text, path);
            records = FollowersParser.parse(data, path);
          } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
            records = extractProfilesFromMetaHtml(text, path);
          } else if (lower.endsWith('.csv')) {
            records = extractProfilesFromCsv(text, path);
          }

          records.forEach(r => {
            followersMap.set(r.username, mergeProfile(followersMap.get(r.username), r));
            allProfilesMap.set(r.username, mergeProfile(allProfilesMap.get(r.username), r));
            if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
          });
        } catch (err: any) {
          errors.push(`Notice: Error reading follower file "${path}": ${err.message}`);
        }
      }

      // 2. Following Files
      for (const path of followingFiles) {
        try {
          const text = await readTextSafe(path);
          const lower = path.toLowerCase();
          let records: NormalizedProfile[] = [];

          if (lower.endsWith('.json')) {
            const data = parseJsonSafe(text, path);
            records = FollowingParser.parse(data, path);
          } else if (lower.endsWith('.html') || lower.endsWith('.htm')) {
            records = extractProfilesFromMetaHtml(text, path);
          } else if (lower.endsWith('.csv')) {
            records = extractProfilesFromCsv(text, path);
          }

          records.forEach(r => {
            followingMap.set(r.username, mergeProfile(followingMap.get(r.username), r));
            allProfilesMap.set(r.username, mergeProfile(allProfilesMap.get(r.username), r));
            if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
          });
        } catch (err: any) {
          errors.push(`Notice: Error reading following file "${path}": ${err.message}`);
        }
      }

      // 3. Close Friends
      for (const path of closeFriendsFiles) {
        try {
          const text = await readTextSafe(path);
          const data = parseJsonSafe(text, path);
          const records = CloseFriendsParser.parse(data, path);
          records.forEach(r => {
            closeFriendsMap.set(r.username, mergeProfile(closeFriendsMap.get(r.username), r));
            allProfilesMap.set(r.username, mergeProfile(allProfilesMap.get(r.username), r));
            if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
          });
        } catch (err: any) {
          warnings.push(`Notice: Could not parse close friends file "${path}": ${err.message}`);
        }
      }

      // 4. Pending Requests
      for (const path of pendingRequestsFiles) {
        try {
          const text = await readTextSafe(path);
          const data = parseJsonSafe(text, path);
          const records = PendingRequestsParser.parse(data, path);
          records.forEach(r => {
            pendingRequestsMap.set(r.username, mergeProfile(pendingRequestsMap.get(r.username), r));
            allProfilesMap.set(r.username, mergeProfile(allProfilesMap.get(r.username), r));
            if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
          });
        } catch (err: any) {
          warnings.push(`Notice: Could not parse pending requests file "${path}": ${err.message}`);
        }
      }

      // 5. Recent Requests
      for (const path of recentRequestsFiles) {
        try {
          const text = await readTextSafe(path);
          const data = parseJsonSafe(text, path);
          const records = RecentRequestsParser.parse(data, path);
          records.forEach(r => {
            recentRequestsMap.set(r.username, mergeProfile(recentRequestsMap.get(r.username), r));
            allProfilesMap.set(r.username, mergeProfile(allProfilesMap.get(r.username), r));
            if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
          });
        } catch (err: any) {
          warnings.push(`Notice: Could not parse recent requests file "${path}": ${err.message}`);
        }
      }

      // 6. Recently Unfollowed Dataset (Section 13)
      for (const path of recentlyUnfollowedFiles) {
        try {
          const text = await readTextSafe(path);
          const data = parseJsonSafe(text, path);
          const records = RecentlyUnfollowedParser.parse(data, path);
          records.forEach(r => {
            recentlyUnfollowedMap.set(r.username, mergeProfile(recentlyUnfollowedMap.get(r.username), r));
            allProfilesMap.set(r.username, mergeProfile(allProfilesMap.get(r.username), r));
            if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
          });
        } catch (err: any) {
          warnings.push(`Notice: Could not parse recently unfollowed file "${path}": ${err.message}`);
        }
      }

      // 7. Blocked Profiles Dataset (if included by user in export)
      for (const path of blockedFiles) {
        try {
          const text = await readTextSafe(path);
          const data = parseJsonSafe(text, path);
          const records = BlockedProfilesParser.parse(data, path);
          records.forEach(r => {
            blockedProfilesMap.set(r.username, mergeProfile(blockedProfilesMap.get(r.username), r));
            allProfilesMap.set(r.username, mergeProfile(allProfilesMap.get(r.username), r));
            if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
          });
        } catch (err: any) {
          warnings.push(`Notice: Could not parse blocked profiles file "${path}": ${err.message}`);
        }
      }

      const totalFilesDiscovered =
        followerFiles.length +
        followingFiles.length +
        closeFriendsFiles.length +
        pendingRequestsFiles.length +
        recentRequestsFiles.length +
        recentlyUnfollowedFiles.length +
        blockedFiles.length;

      schemaDetected = `Meta Instagram ZIP Archive (${totalFilesDiscovered} relationship file(s) matched)`;

      if (followersMap.size === 0 && followingMap.size === 0) {
        const sample = validPaths.slice(0, 10).join(', ');
        throw new Error(
          `Could not locate followers or following records inside this ZIP archive. Expected paths such as "followers_and_following/followers_1.json" or "following.json". Files found in archive: [${sample}${validPaths.length > 10 ? '...' : ''}].`
        );
      }
    } else if (lowerFileName.endsWith('.json')) {
      sourceFormat = 'JSON';
      onProgress?.('Parsing JSON export file...', 35);
      const text = await file.text();
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch (e: any) {
        throw new Error(`Invalid JSON file format: ${e.message}`);
      }

      onProgress?.('Extracting relationship schemas...', 60);

      // Check if combined format or specific file
      if (parsed.followers && parsed.following) {
        const followers = FollowersParser.parse(parsed.followers, fileName);
        const following = FollowingParser.parse(parsed.following, fileName);
        followers.forEach(r => {
          followersMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
          if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
        });
        following.forEach(r => {
          followingMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
          if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
        });
        schemaDetected = 'Chronograph Combined JSON Format';
      } else if (lowerFileName.includes('following')) {
        const following = FollowingParser.parse(parsed, fileName);
        following.forEach(r => {
          followingMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
          if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
        });
        schemaDetected = 'Instagram Following Export JSON';
      } else if (lowerFileName.includes('close_friend')) {
        const cf = CloseFriendsParser.parse(parsed, fileName);
        cf.forEach(r => {
          closeFriendsMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
          if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
        });
        schemaDetected = 'Instagram Close Friends JSON';
      } else {
        const followers = FollowersParser.parse(parsed, fileName);
        followers.forEach(r => {
          followersMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
          if (r.sourceTimestamp) timestamps.push(r.sourceTimestamp);
        });
        schemaDetected = 'Instagram Followers Export JSON';
      }
    } else if (lowerFileName.endsWith('.html') || lowerFileName.endsWith('.htm')) {
      sourceFormat = 'HTML';
      onProgress?.('Extracting profiles from HTML DOM structure...', 40);
      const text = await file.text();
      const records = extractProfilesFromMetaHtml(text, fileName);

      if (lowerFileName.includes('following')) {
        records.forEach(r => {
          followingMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
        });
        schemaDetected = 'Instagram Following Export HTML';
      } else {
        records.forEach(r => {
          followersMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
        });
        schemaDetected = 'Instagram Followers Export HTML';
      }
    } else if (lowerFileName.endsWith('.csv') || lowerFileName.endsWith('.txt')) {
      sourceFormat = 'CSV';
      onProgress?.('Parsing CSV record rows...', 40);
      const text = await file.text();
      const records = extractProfilesFromCsv(text, fileName);

      if (lowerFileName.includes('following')) {
        records.forEach(r => {
          followingMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
        });
      } else {
        records.forEach(r => {
          followersMap.set(r.username, r);
          allProfilesMap.set(r.username, r);
        });
      }
      schemaDetected = 'Plaintext / CSV Username Export';
    } else {
      throw new Error(
        'Unsupported file format. Please upload an official Instagram .zip archive, .json, .html, or .csv export.'
      );
    }

    // Stage 4: Mathematical Normalization & Set Calculations (Section 8)
    onProgress?.('Computing mathematical set intersections and differences...', 80);

    const followers = Array.from(followersMap.keys()).sort();
    const following = Array.from(followingMap.keys()).sort();

    const followersSet = new Set(followers);
    const followingSet = new Set(following);

    // Mutuals = F ∩ G
    const mutuals = following.filter(u => followersSet.has(u)).sort();
    const mutualsSet = new Set(mutuals);

    // Following without follow-back = G - F
    const followingNotFollowingBack = following.filter(u => !followersSet.has(u)).sort();

    // Followers not followed back = F - G
    const followersNotFollowedBack = followers.filter(u => !followingSet.has(u)).sort();

    const closeFriends = Array.from(closeFriendsMap.keys()).sort();
    const pendingRequests = Array.from(pendingRequestsMap.keys()).sort();
    const recentRequests = Array.from(recentRequestsMap.keys()).sort();
    const recentlyUnfollowed = Array.from(recentlyUnfollowedMap.keys()).sort();
    const blockedProfiles = Array.from(blockedProfilesMap.keys()).sort();

    if (timestamps.length > 0) {
      const maxTs = Math.max(...timestamps);
      if (maxTs > 0) {
        effectiveDate = new Date(maxTs * 1000).toISOString();
      }
    }

    const totalParsed =
      followers.length +
      following.length +
      closeFriends.length +
      pendingRequests.length +
      recentRequests.length +
      recentlyUnfollowed.length +
      blockedProfiles.length;

    const profilesRecord: Record<string, NormalizedProfile> = {};
    allProfilesMap.forEach((prof, key) => {
      profilesRecord[key] = prof;
    });

    onProgress?.('Finalizing snapshot and import report...', 95);

    return {
      followers,
      following,
      mutuals,
      followingNotFollowingBack,
      followersNotFollowedBack,
      closeFriends,
      pendingRequests,
      recentRequests,
      recentlyUnfollowed,
      blockedProfiles,
      profiles: profilesRecord,
      sourceFormat,
      schemaDetected,
      parsedRecords: totalParsed,
      skippedRecords: 0,
      errors,
      warnings,
      effectiveDate: effectiveDate || new Date().toISOString(),
    };
  }
}

/**
 * Builds an immutable Snapshot domain object from parse results
 */
export function buildSnapshotFromParseResult(
  result: ParseResult,
  label: string,
  userId: string,
  fileName: string,
  isBaseline: boolean = true,
  changesCount: number = 0
): Snapshot {
  const report: ImportReport = {
    archiveName: fileName,
    filesDetected:
      (result.followers.length > 0 ? 1 : 0) +
      (result.following.length > 0 ? 1 : 0) +
      (result.closeFriends.length > 0 ? 1 : 0) +
      (result.pendingRequests.length > 0 ? 1 : 0) +
      (result.recentRequests.length > 0 ? 1 : 0) +
      (result.recentlyUnfollowed.length > 0 ? 1 : 0) +
      ((result.blockedProfiles && result.blockedProfiles.length > 0) ? 1 : 0),
    detectedFilesList: [
      result.followers.length > 0 ? `Followers (${result.followers.length})` : '',
      result.following.length > 0 ? `Following (${result.following.length})` : '',
      result.closeFriends.length > 0 ? `Close Friends (${result.closeFriends.length})` : '',
      result.pendingRequests.length > 0 ? `Pending Requests (${result.pendingRequests.length})` : '',
      result.recentRequests.length > 0 ? `Recent Requests (${result.recentRequests.length})` : '',
      result.recentlyUnfollowed.length > 0 ? `Recently Unfollowed (${result.recentlyUnfollowed.length})` : '',
      (result.blockedProfiles && result.blockedProfiles.length > 0) ? `Blocked Profiles (${result.blockedProfiles.length})` : '',
    ].filter(Boolean),
    followers: result.followers.length,
    following: result.following.length,
    mutual: result.mutuals.length,
    followingWithoutFollowBack: result.followingNotFollowingBack.length,
    followersNotFollowedBack: result.followersNotFollowedBack.length,
    closeFriends: result.closeFriends.length,
    pendingRequests: result.pendingRequests.length,
    recentRequests: result.recentRequests.length,
    recentlyUnfollowed: result.recentlyUnfollowed.length,
    blockedProfiles: result.blockedProfiles?.length || 0,
    warnings: result.warnings,
    statusMessage: isBaseline
      ? 'This is your baseline. Future imports can reveal changes.'
      : `${changesCount} relationship changes detected.`,
    isBaseline,
    changesDetectedCount: isBaseline ? 0 : changesCount,
  };

  return {
    id: `snap_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    label:
      label ||
      `Import ${new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`,
    createdAt: new Date().toISOString(),
    effectiveAt: result.effectiveDate || new Date().toISOString(),
    sourceDate: result.effectiveDate,
    source:
      result.sourceFormat === 'ZIP'
        ? 'EXPORT_ZIP'
        : result.sourceFormat === 'HTML'
        ? 'EXPORT_HTML'
        : 'EXPORT_JSON',
    followersCount: result.followers.length,
    followingCount: result.following.length,
    mutualCount: result.mutuals.length,
    followers: result.followers,
    following: result.following,
    mutuals: result.mutuals,
    followingNotFollowingBack: result.followingNotFollowingBack,
    followersNotFollowedBack: result.followersNotFollowedBack,
    closeFriends: result.closeFriends,
    pendingRequests: result.pendingRequests,
    recentRequests: result.recentRequests,
    recentlyUnfollowed: result.recentlyUnfollowed,
    blockedProfiles: result.blockedProfiles,
    profiles: result.profiles,
    metrics: {
      followersCount: result.followers.length,
      followingCount: result.following.length,
      mutualCount: result.mutuals.length,
      followingNotFollowingBackCount: result.followingNotFollowingBack.length,
      followersNotFollowedBackCount: result.followersNotFollowedBack.length,
      closeFriendsCount: result.closeFriends.length,
      pendingRequestsCount: result.pendingRequests.length,
      recentRequestsCount: result.recentRequests.length,
      recentlyUnfollowedCount: result.recentlyUnfollowed.length,
      blockedProfilesCount: result.blockedProfiles?.length || 0,
    },
    importReport: report,
    metadata: {
      formatDetected: result.schemaDetected,
      fileName,
      parsedRecords: result.parsedRecords,
      skippedRecords: result.skippedRecords,
    },
  };
}

/**
 * Top-level convenience wrapper for parseUploadedExport
 */
export async function parseUploadedExport(
  file: File | Blob,
  onProgress?: (step: string, percent: number) => void
): Promise<ParseResult> {
  const fileName = (file as File).name || 'instagram_export.zip';
  return InstagramExportParser.parse(file, fileName, onProgress);
}
