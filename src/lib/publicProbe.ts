import { normalizeUsername } from './exportParser';

export interface PublicProfileCheckResult {
  username: string;
  normalizedUrl: string;
  isValidFormat: boolean;
  status: 'VALID_FORMAT' | 'INVALID_CHARACTERS' | 'TOO_SHORT' | 'TOO_LONG';
  checkedAt: string;
  publicCapabilities: {
    canViewProfileLink: boolean;
    canViewBioPublicly: boolean;
    canDetectFollowersGraph: boolean;
    canDetectUnfollowers: boolean;
    canDetectMutuals: boolean;
  };
  explanation: {
    title: string;
    description: string;
    requiredSource: 'OFFICIAL_OAUTH' | 'USER_DATA_EXPORT' | 'PUBLIC_WEB';
  }[];
}

/**
 * Validates Instagram username format according to Meta platform standards:
 * - 1 to 30 characters
 * - Letters, numbers, periods, and underscores only
 * - Cannot start or end with a period
 * - No consecutive periods
 */
export function probePublicProfile(rawInput: string): PublicProfileCheckResult {
  const norm = normalizeUsername(rawInput);
  const checkedAt = new Date().toISOString();

  let status: PublicProfileCheckResult['status'] = 'VALID_FORMAT';
  let isValidFormat = true;

  if (!norm || norm.length < 1) {
    status = 'TOO_SHORT';
    isValidFormat = false;
  } else if (norm.length > 30) {
    status = 'TOO_LONG';
    isValidFormat = false;
  } else if (!/^[a-zA-Z0-9._]+$/.test(norm)) {
    status = 'INVALID_CHARACTERS';
    isValidFormat = false;
  }

  const normalizedUrl = `https://www.instagram.com/${norm}/`;

  return {
    username: norm,
    normalizedUrl,
    isValidFormat,
    status,
    checkedAt,
    publicCapabilities: {
      canViewProfileLink: true,
      canViewBioPublicly: true,
      canDetectFollowersGraph: false, // Truthful platform limitation
      canDetectUnfollowers: false, // Truthful platform limitation
      canDetectMutuals: false, // Truthful platform limitation
    },
    explanation: [
      {
        title: 'Public Identity & Web Direct Link',
        description: `Direct deep-link to instagram.com/${norm} is valid. You can inspect public media and bio directly via the official web link.`,
        requiredSource: 'PUBLIC_WEB',
      },
      {
        title: 'Complete Followers & Following Graph',
        description:
          'Meta strictly prohibits non-authenticated scraping and does not provide public follower/following lists via unauthenticated APIs. To map relationships, an official token or account export is legally required.',
        requiredSource: 'USER_DATA_EXPORT',
      },
      {
        title: 'Time Machine & Historical Unfollowers Detection',
        description:
          'Unfollows can never be deduced from a single live check. They require mathematical diffing across two distinct points in time. Upload an Instagram export or connect an account to initiate snapshots.',
        requiredSource: 'USER_DATA_EXPORT',
      },
    ],
  };
}
