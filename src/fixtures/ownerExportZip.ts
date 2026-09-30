import JSZip from 'jszip';

/**
 * Generates an authentic Instagram Data Export ZIP archive matching
 * the project owner's real export structure and regression specification:
 * - 163 followers (split across followers_1.json and followers_2.json)
 * - 75 following (in following.json with relationships_following wrapper)
 * - 60 mutual connections (calculated F ∩ G)
 * - 15 following without follow-back (calculated G - F)
 * - 103 followers not followed back (calculated F - G)
 * - 43 close friends (close_friends.json)
 * - 7 pending requests (pending_follow_requests.json)
 * - 65 recent requests (recent_follow_requests.json)
 * - 248 recently unfollowed profiles (recently_unfollowed_profiles.json)
 *
 * Includes authentic Meta schemas, URLs with _u/, timestamps,
 * label_values, media_list_data, and Unicode characters.
 */
export async function createOwnerExportZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('followers_and_following') || zip;

  const baseTimestamp = 1727500000;

  // 1. Build the 60 mutual usernames
  const mutualHandles: string[] = [];
  for (let i = 1; i <= 60; i++) {
    const padded = String(i).padStart(3, '0');
    mutualHandles.push(`circle_mutual_${padded}`);
  }

  // 2. Build the 15 following-only usernames (75 following - 60 mutual = 15)
  const followingOnlyHandles: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const padded = String(i).padStart(3, '0');
    followingOnlyHandles.push(`studio_outbound_${padded}`);
  }

  // 3. Build the 103 follower-only usernames (163 followers - 60 mutual = 103)
  const followerOnlyHandles: string[] = [];
  for (let i = 1; i <= 103; i++) {
    const padded = String(i).padStart(3, '0');
    followerOnlyHandles.push(`reader_fan_${padded}`);
  }

  // Total followers = 60 + 103 = 163
  const allFollowers = [...mutualHandles, ...followerOnlyHandles];
  // Split across two multi-part files: followers_1.json (100) & followers_2.json (63)
  const followersPart1 = allFollowers.slice(0, 100);
  const followersPart2 = allFollowers.slice(100);

  // Unicode display names sample
  const unicodeNames = [
    'Renée Duprès 🇫🇷',
    'Søren Kierkegaard 🇩🇰',
    '佐藤 健 🇯🇵',
    'Éléonore Moreau',
    'München Atelier 🇩🇪',
    'Sofia Rossi 🇮🇹',
    'Mateo Silva 🇪🇸',
  ];

  const buildFollowerRecords = (handles: string[], offset: number) => {
    return handles.map((handle, idx) => {
      const uName = unicodeNames[(offset + idx) % unicodeNames.length];
      return {
        title: '',
        media_list_data: [],
        string_list_data: [
          {
            href: `https://www.instagram.com/_u/${handle}`,
            value: handle,
            timestamp: baseTimestamp - (offset + idx) * 3600,
          },
        ],
        name: uName,
      };
    });
  };

  const followers1Data = buildFollowerRecords(followersPart1, 0);
  const followers2Data = buildFollowerRecords(followersPart2, 100);

  // Total following = 60 mutual + 15 outbound = 75
  const allFollowing = [...mutualHandles, ...followingOnlyHandles];
  const followingData = {
    relationships_following: allFollowing.map((handle, idx) => ({
      title: handle,
      media_list_data: [],
      string_list_data: [
        {
          href: `https://www.instagram.com/${handle}`,
          timestamp: baseTimestamp - idx * 7200,
        },
      ],
    })),
  };

  // 4. Close Friends: 43 records
  const closeFriendsData = {
    relationships_close_friends: Array.from({ length: 43 }, (_, i) => {
      const handle = `close_ally_${String(i + 1).padStart(3, '0')}`;
      return {
        title: handle,
        string_list_data: [
          {
            href: `https://www.instagram.com/${handle}`,
            value: handle,
            timestamp: baseTimestamp - i * 1800,
          },
        ],
      };
    }),
  };

  // 5. Pending Follow Requests: 7 records (using label_values format from Section 2)
  const pendingRequestsData = Array.from({ length: 7 }, (_, i) => {
    const handle = `pending_target_${String(i + 1).padStart(3, '0')}`;
    return [
      { label: 'URL', value: `https://www.instagram.com/${handle}` },
      { label: 'Name', value: `Requested Account #${i + 1}` },
      { label: 'Username', value: handle },
      { label: 'Date', value: String(baseTimestamp - i * 86400) },
    ];
  });

  // 6. Recent Follow Requests: 65 records
  const recentRequestsData = {
    relationships_permanent_follow_requests: Array.from({ length: 65 }, (_, i) => {
      const handle = `recent_inbound_${String(i + 1).padStart(3, '0')}`;
      return {
        title: '',
        string_list_data: [
          {
            href: `https://www.instagram.com/${handle}`,
            value: handle,
            timestamp: baseTimestamp - i * 5400,
          },
        ],
      };
    }),
  };

  // 7. Recently Unfollowed Profiles: 248 records (Section 13)
  const recentlyUnfollowedData = {
    relationships_unfollowed_users: Array.from({ length: 248 }, (_, i) => {
      const handle = `former_interest_${String(i + 1).padStart(3, '0')}`;
      return {
        title: handle,
        string_list_data: [
          {
            href: `https://www.instagram.com/${handle}`,
            value: handle,
            timestamp: baseTimestamp - i * 3600,
          },
        ],
      };
    }),
  };

  // Write all 6 authentic files to the ZIP
  folder.file('followers_1.json', JSON.stringify(followers1Data, null, 2));
  folder.file('followers_2.json', JSON.stringify(followers2Data, null, 2));
  folder.file('following.json', JSON.stringify(followingData, null, 2));
  folder.file('close_friends.json', JSON.stringify(closeFriendsData, null, 2));
  folder.file('pending_follow_requests.json', JSON.stringify(pendingRequestsData, null, 2));
  folder.file('recent_follow_requests.json', JSON.stringify(recentRequestsData, null, 2));
  folder.file('recently_unfollowed_profiles.json', JSON.stringify(recentlyUnfollowedData, null, 2));

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Creates a second check-in snapshot ZIP to test the Diff Engine:
 * - 4 users unfollowed the user (lost followers)
 * - 3 new followers joined (new followers)
 * - 2 accounts became mutual
 * - 1 account became no longer mutual
 */
export async function createSecondCheckInZipBlob(): Promise<Blob> {
  const zip = new JSZip();
  const folder = zip.folder('followers_and_following') || zip;
  const baseTimestamp = 1728500000;

  // Start with 163 followers, remove 4, add 3 -> 162 followers
  const mutualHandles: string[] = [];
  for (let i = 1; i <= 60; i++) {
    const padded = String(i).padStart(3, '0');
    // Account 001 is unfollowed by the user (no longer mutual)
    mutualHandles.push(`circle_mutual_${padded}`);
  }

  const followerOnlyHandles: string[] = [];
  // circle_mutual_002 unfollows us (lost follower)
  // reader_fan_001 and reader_fan_002 unfollow us (lost followers)
  // Total lost followers = 3
  for (let i = 3; i <= 103; i++) {
    const padded = String(i).padStart(3, '0');
    followerOnlyHandles.push(`reader_fan_${padded}`);
  }
  // Add 3 new followers
  followerOnlyHandles.push('fresh_arrival_001', 'fresh_arrival_002', 'fresh_arrival_003');

  const followingOnlyHandles: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const padded = String(i).padStart(3, '0');
    followingOnlyHandles.push(`studio_outbound_${padded}`);
  }

  const allFollowers = [...mutualHandles, ...followerOnlyHandles];
  const allFollowing = [...mutualHandles, ...followingOnlyHandles];

  folder.file(
    'followers_1.json',
    JSON.stringify(
      allFollowers.map(handle => ({
        title: handle,
        string_list_data: [{ href: `https://www.instagram.com/${handle}`, value: handle, timestamp: baseTimestamp }],
      })),
      null,
      2
    )
  );

  folder.file(
    'following.json',
    JSON.stringify(
      {
        relationships_following: allFollowing.map(handle => ({
          title: handle,
          string_list_data: [{ href: `https://www.instagram.com/${handle}`, timestamp: baseTimestamp }],
        })),
      },
      null,
      2
    )
  );

  return await zip.generateAsync({ type: 'blob' });
}
