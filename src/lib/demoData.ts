import JSZip from 'jszip';
import { RelationshipEvent, Snapshot, SocialProfile } from '../types';
import { compareSnapshots, generateEventsFromComparison } from './snapshotEngine';

export const DEMO_USER_ID = 'demo_user_jai_intel';
export const DEMO_ACCOUNT_HANDLE = 'jai_dwivedi_intel';

export const SYNTHETIC_PROFILES: Record<string, SocialProfile> = {
  alex: {
    username: 'alex',
    displayName: 'Alex Chen',
    profileUrl: 'https://instagram.com/alex',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isPrivate: false,
    notes: 'Angel investor & systems engineer. Met at SF Graph Summit.',
    isStarred: true,
    firstSeenAt: '2026-08-15T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['Tech', 'Investor', 'Close Friend'],
  },
  sam: {
    username: 'sam',
    displayName: 'Sam Rivera',
    profileUrl: 'https://instagram.com/sam',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isPrivate: true,
    notes: 'Ex-colleague. Stopped following recently.',
    isStarred: false,
    firstSeenAt: '2026-08-15T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['Design', 'Mutual Transition'],
  },
  riya: {
    username: 'riya',
    displayName: 'Riya Patel',
    profileUrl: 'https://instagram.com/riya',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isPrivate: false,
    notes: 'Founder of NeuroData. Followed back on Sept 1.',
    isStarred: true,
    firstSeenAt: '2026-09-01T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['Founder', 'Mutual'],
  },
  aarav: {
    username: 'aarav',
    displayName: 'Aarav Sharma',
    profileUrl: 'https://instagram.com/aarav',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isPrivate: false,
    notes: 'AI Researcher at VectorLab.',
    isStarred: false,
    firstSeenAt: '2026-09-01T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['Researcher', 'Fan'],
  },
  elena: {
    username: 'elena',
    displayName: 'Elena Rostova',
    profileUrl: 'https://instagram.com/elena',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    isVerified: true,
    isPrivate: false,
    notes: 'Design Architect. Became mutual connection in Snapshot #3.',
    isStarred: true,
    firstSeenAt: '2026-08-15T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['Design', 'Mutual'],
  },
  marcus: {
    username: 'marcus',
    displayName: 'Marcus Brody',
    profileUrl: 'https://instagram.com/marcus',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isPrivate: false,
    notes: 'Not following me back for 2 months.',
    isStarred: false,
    firstSeenAt: '2026-08-15T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['Unreciprocated'],
  },
  maya: {
    username: 'maya',
    displayName: 'Maya Lin',
    profileUrl: 'https://instagram.com/maya',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
    isVerified: false,
    isPrivate: true,
    notes: 'Followed in Snapshot 3.',
    isStarred: false,
    firstSeenAt: '2026-09-28T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['New Follower'],
  },
  dev_ghost: {
    username: 'dev_ghost',
    displayName: 'Ghost Account',
    profileUrl: 'https://instagram.com/dev_ghost',
    notes: 'Unfollowed between Snapshot 1 and 2.',
    firstSeenAt: '2026-08-15T00:00:00Z',
    lastSeenAt: '2026-09-01T00:00:00Z',
  },
  cryptoking: {
    username: 'cryptoking',
    displayName: 'Crypto Signals Direct',
    profileUrl: 'https://instagram.com/cryptoking',
    notes: 'Spam account, dropped follow quickly.',
    firstSeenAt: '2026-09-01T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
  },
  nina_art: {
    username: 'nina_art',
    displayName: 'Nina Vance',
    profileUrl: 'https://instagram.com/nina_art',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    firstSeenAt: '2026-08-15T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
    tags: ['Creative'],
  },
  kai_z: {
    username: 'kai_z',
    displayName: 'Kai Zhao',
    profileUrl: 'https://instagram.com/kai_z',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    firstSeenAt: '2026-08-15T00:00:00Z',
    lastSeenAt: '2026-09-28T00:00:00Z',
  },
};

// Seed Snapshots
export const DEMO_SNAPSHOTS: Snapshot[] = [
  // Snapshot 1: Aug 15, 2026 (Baseline)
  {
    id: 'snap_demo_001',
    userId: DEMO_USER_ID,
    label: 'Baseline Export (Aug 15)',
    createdAt: '2026-08-15T12:00:00Z',
    effectiveAt: '2026-08-15T11:45:00Z',
    source: 'EXPORT_ZIP',
    followersCount: 16,
    followingCount: 14,
    mutualCount: 10,
    followers: [
      'alex',
      'sam',
      'elena',
      'dev_ghost',
      'nina_art',
      'kai_z',
      'sarah_connor',
      'david_k',
      'tariq_m',
      'lucas_v',
      'hannah_b',
      'liam_w',
      'sophia_t',
      'charlie_d',
      'olivia_p',
      'noah_s',
    ],
    following: [
      'alex',
      'sam',
      'marcus', // not following back
      'dev_ghost',
      'nina_art',
      'kai_z',
      'david_k',
      'tariq_m',
      'lucas_v',
      'elonmusk', // not following back
      'satyanadella', // not following back
      'samaltman', // not following back
      'hannah_b',
      'liam_w',
    ],
    metadata: {
      formatDetected: 'Meta Instagram ZIP (JSON v3)',
      fileName: 'instagram_export_aug15_2026.zip',
      parsedRecords: 30,
      skippedRecords: 0,
      accountUsername: DEMO_ACCOUNT_HANDLE,
    },
  },

  // Snapshot 2: Sept 01, 2026
  {
    id: 'snap_demo_002',
    userId: DEMO_USER_ID,
    label: 'Sprint Review Sync (Sep 01)',
    createdAt: '2026-09-01T14:30:00Z',
    effectiveAt: '2026-09-01T14:00:00Z',
    source: 'EXPORT_JSON',
    followersCount: 18,
    followingCount: 15,
    mutualCount: 11,
    followers: [
      'alex',
      'sam',
      'elena',
      // 'dev_ghost' is lost!
      'nina_art',
      'kai_z',
      'sarah_connor',
      'david_k',
      'tariq_m',
      'lucas_v',
      'hannah_b',
      'liam_w',
      'sophia_t',
      'charlie_d',
      'olivia_p',
      'noah_s',
      // New followers:
      'riya', // new follower!
      'aarav', // new follower!
      'cryptoking', // spam follower!
    ],
    following: [
      'alex',
      'sam',
      'marcus',
      // unfollowed 'dev_ghost'
      'nina_art',
      'kai_z',
      'david_k',
      'tariq_m',
      'lucas_v',
      'elonmusk',
      'satyanadella',
      'samaltman',
      'hannah_b',
      'liam_w',
      // You followed back:
      'riya', // became mutual!
      'elena', // you followed elena (was follower in snap 1, now mutual!)
    ],
    metadata: {
      formatDetected: 'Instagram JSON Data Folder',
      fileName: 'followers_sep01.json',
      parsedRecords: 33,
      skippedRecords: 0,
      accountUsername: DEMO_ACCOUNT_HANDLE,
    },
  },

  // Snapshot 3: Sept 28, 2026 (Recent)
  {
    id: 'snap_demo_003',
    userId: DEMO_USER_ID,
    label: 'Q3 Closing Snapshot (Sep 28)',
    createdAt: '2026-09-28T18:00:00Z',
    effectiveAt: '2026-09-28T17:50:00Z',
    source: 'EXPORT_ZIP',
    followersCount: 19,
    followingCount: 15,
    mutualCount: 12,
    followers: [
      'alex',
      // 'sam' unfollowed you!
      'elena',
      'nina_art',
      'kai_z',
      'sarah_connor',
      'david_k',
      'tariq_m',
      'lucas_v',
      'hannah_b',
      'liam_w',
      'sophia_t',
      'charlie_d',
      'olivia_p',
      'noah_s',
      'riya',
      'aarav',
      // 'cryptoking' unfollowed or account removed
      'maya', // brand new follower
      'zara_code', // brand new follower
    ],
    following: [
      'alex',
      'sam', // you still follow sam (he stopped following you -> NOT FOLLOWING BACK!)
      'marcus',
      'nina_art',
      'kai_z',
      'david_k',
      'tariq_m',
      'lucas_v',
      'elonmusk',
      'satyanadella',
      'samaltman',
      'hannah_b',
      'liam_w',
      'riya',
      'elena',
    ],
    metadata: {
      formatDetected: 'Meta Verified Archive (ZIP v4)',
      fileName: 'instagram_export_sep28_2026.zip',
      parsedRecords: 34,
      skippedRecords: 0,
      accountUsername: DEMO_ACCOUNT_HANDLE,
    },
  },
];

/**
 * Builds all historical relationship events across demo snapshots
 */
export function buildDemoEvents(): RelationshipEvent[] {
  const allEvents: RelationshipEvent[] = [];

  // Snap 1 baseline
  const diff1 = compareSnapshots(null, DEMO_SNAPSHOTS[0]);
  const evts1 = generateEventsFromComparison(null, DEMO_SNAPSHOTS[0], diff1);
  allEvents.push(...evts1);

  // Snap 1 -> Snap 2
  const diff2 = compareSnapshots(DEMO_SNAPSHOTS[0], DEMO_SNAPSHOTS[1]);
  const evts2 = generateEventsFromComparison(DEMO_SNAPSHOTS[0], DEMO_SNAPSHOTS[1], diff2);
  allEvents.push(...evts2);

  // Snap 2 -> Snap 3
  const diff3 = compareSnapshots(DEMO_SNAPSHOTS[1], DEMO_SNAPSHOTS[2]);
  const evts3 = generateEventsFromComparison(DEMO_SNAPSHOTS[1], DEMO_SNAPSHOTS[2], diff3);
  allEvents.push(...evts3);

  // Sort descending by effectiveAt
  return allEvents.sort(
    (a, b) => new Date(b.effectiveAt).getTime() - new Date(a.effectiveAt).getTime()
  );
}

/**
 * Generates sample Instagram followers/following JSON files for immediate testing
 */
export function generateSampleExportJson(): { followersJson: string; followingJson: string } {
  const sampleFollowers = [
    {
      title: '',
      media_list_data: [],
      string_list_data: [
        {
          href: 'https://www.instagram.com/alex',
          value: 'alex',
          timestamp: 1727500000,
        },
      ],
    },
    {
      title: '',
      media_list_data: [],
      string_list_data: [
        {
          href: 'https://www.instagram.com/riya',
          value: 'riya',
          timestamp: 1727510000,
        },
      ],
    },
    {
      title: '',
      media_list_data: [],
      string_list_data: [
        {
          href: 'https://www.instagram.com/aarav',
          value: 'aarav',
          timestamp: 1727520000,
        },
      ],
    },
    {
      title: '',
      media_list_data: [],
      string_list_data: [
        {
          href: 'https://www.instagram.com/elena',
          value: 'elena',
          timestamp: 1727530000,
        },
      ],
    },
    {
      title: '',
      media_list_data: [],
      string_list_data: [
        {
          href: 'https://www.instagram.com/kai_z',
          value: 'kai_z',
          timestamp: 1727540000,
        },
      ],
    },
  ];

  const sampleFollowing = {
    relationships_following: [
      {
        title: 'alex',
        string_list_data: [
          {
            href: 'https://www.instagram.com/alex',
            value: 'alex',
            timestamp: 1727500000,
          },
        ],
      },
      {
        title: 'riya',
        string_list_data: [
          {
            href: 'https://www.instagram.com/riya',
            value: 'riya',
            timestamp: 1727510000,
          },
        ],
      },
      {
        title: 'marcus',
        string_list_data: [
          {
            href: 'https://www.instagram.com/marcus',
            value: 'marcus',
            timestamp: 1727520000,
          },
        ],
      },
      {
        title: 'sam',
        string_list_data: [
          {
            href: 'https://www.instagram.com/sam',
            value: 'sam',
            timestamp: 1727530000,
          },
        ],
      },
    ],
  };

  return {
    followersJson: JSON.stringify(sampleFollowers, null, 2),
    followingJson: JSON.stringify(sampleFollowing, null, 2),
  };
}

/**
 * Creates an authentic in-memory Instagram data export ZIP file
 * structured exactly as Meta downloads:
 *   followers_and_following/followers_1.json
 *   followers_and_following/following.json
 */
export async function generateSampleInstagramZipBlob(): Promise<Blob> {
  const { followersJson, followingJson } = generateSampleExportJson();
  const zip = new JSZip();

  const folder = zip.folder('followers_and_following');
  if (folder) {
    folder.file('followers_1.json', followersJson);
    folder.file('following.json', followingJson);
  } else {
    zip.file('followers_1.json', followersJson);
    zip.file('following.json', followingJson);
  }

  return await zip.generateAsync({ type: 'blob' });
}
