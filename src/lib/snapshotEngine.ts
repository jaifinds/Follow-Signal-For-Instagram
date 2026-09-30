import { RelationshipEvent, RelationshipState, Snapshot, SnapshotComparison } from '../types';

/**
 * Snapshot Comparison Engine
 * Computes exact mathematical set differences between two social graph snapshots
 * and derives relationship transition events.
 */

export function compareSnapshots(
  snapshotA: Snapshot | null,
  snapshotB: Snapshot
): SnapshotComparison {
  const followersB = new Set(snapshotB.followers.map(u => u.toLowerCase()));
  const followingB = new Set(snapshotB.following.map(u => u.toLowerCase()));

  // If there is no previous snapshot, this is our initial baseline snapshot
  if (!snapshotA) {
    const mutuals = [...followingB].filter(u => followersB.has(u)).sort();
    const notFollowingBack = [...followingB].filter(u => !followersB.has(u)).sort();
    const youDontFollowBack = [...followersB].filter(u => !followingB.has(u)).sort();

    return {
      currentSnapshotId: snapshotB.id,
      comparedAt: new Date().toISOString(),
      newFollowers: [...followersB].sort(),
      lostFollowers: [],
      newFollowing: [...followingB].sort(),
      unfollowed: [],
      becameMutual: mutuals,
      noLongerMutual: [],
      notFollowingBack,
      youDontFollowBack,
      mutuals,
    };
  }

  const followersA = new Set(snapshotA.followers.map(u => u.toLowerCase()));
  const followingA = new Set(snapshotA.following.map(u => u.toLowerCase()));

  // Set operations
  // newFollowers = followersB - followersA
  const newFollowers = [...followersB].filter(u => !followersA.has(u)).sort();

  // lostFollowers = followersA - followersB
  const lostFollowers = [...followersA].filter(u => !followersB.has(u)).sort();

  // newFollowing = followingB - followingA
  const newFollowing = [...followingB].filter(u => !followingA.has(u)).sort();

  // unfollowed = followingA - followingB
  const unfollowed = [...followingA].filter(u => !followingB.has(u)).sort();

  // mutuals
  const mutualA = new Set([...followingA].filter(u => followersA.has(u)));
  const mutualB = new Set([...followingB].filter(u => followersB.has(u)));

  // becameMutual = mutualB - mutualA
  const becameMutual = [...mutualB].filter(u => !mutualA.has(u)).sort();

  // noLongerMutual = mutualA - mutualB
  const noLongerMutual = [...mutualA].filter(u => !mutualB.has(u)).sort();

  // notFollowingBack = followingB - followersB
  const notFollowingBack = [...followingB].filter(u => !followersB.has(u)).sort();

  // youDontFollowBack = followersB - followingB
  const youDontFollowBack = [...followersB].filter(u => !followingB.has(u)).sort();

  return {
    priorSnapshotId: snapshotA.id,
    currentSnapshotId: snapshotB.id,
    comparedAt: new Date().toISOString(),
    newFollowers,
    lostFollowers,
    newFollowing,
    unfollowed,
    becameMutual,
    noLongerMutual,
    notFollowingBack,
    youDontFollowBack,
    mutuals: [...mutualB].sort(),
  };
}

/**
 * Generate append-oriented RelationshipEvent ledger entries from a snapshot comparison
 */
export function generateEventsFromComparison(
  snapshotA: Snapshot | null,
  snapshotB: Snapshot,
  diff: SnapshotComparison
): RelationshipEvent[] {
  const events: RelationshipEvent[] = [];
  const detectedAt = new Date().toISOString();
  const effectiveAt = snapshotB.effectiveAt || snapshotB.createdAt;
  const userId = snapshotB.userId;

  // If this is the initial snapshot, record a baseline event
  if (!snapshotA) {
    events.push({
      id: `evt_init_${snapshotB.id}`,
      userId,
      subjectUsername: snapshotB.metadata?.accountUsername || 'you',
      eventType: 'SNAPSHOT_IMPORTED',
      detectedAt,
      effectiveAt,
      sourceSnapshotId: snapshotB.id,
      previousState: 'NONE',
      newState: 'NONE',
      confidence: 'CONFIRMED',
      summary: `Baseline snapshot created: ${snapshotB.followersCount} followers, ${snapshotB.followingCount} following.`,
      details: `First historical anchor established with ${snapshotB.mutualCount} mutual connections.`,
    });
    return events;
  }

  const followersA = new Set(snapshotA.followers.map(u => u.toLowerCase()));
  const followingA = new Set(snapshotA.following.map(u => u.toLowerCase()));
  const followersB = new Set(snapshotB.followers.map(u => u.toLowerCase()));
  const followingB = new Set(snapshotB.following.map(u => u.toLowerCase()));

  // 1. New Followers
  for (const username of diff.newFollowers) {
    const isYouFollowingThem = followingB.has(username);
    if (isYouFollowingThem) {
      events.push({
        id: `evt_fb_${snapshotB.id}_${username}`,
        userId,
        subjectUsername: username,
        eventType: 'FOLLOW_BACK',
        detectedAt,
        effectiveAt,
        sourceSnapshotId: snapshotB.id,
        previousSnapshotId: snapshotA.id,
        previousState: 'YOU_FOLLOW_THEM',
        newState: 'MUTUAL',
        confidence: 'CONFIRMED',
        summary: `@${username} followed you back! Relationship is now MUTUAL.`,
        details: `Detected in snapshot ${snapshotB.label}. You were already following them.`,
      });
    } else {
      events.push({
        id: `evt_nf_${snapshotB.id}_${username}`,
        userId,
        subjectUsername: username,
        eventType: 'NEW_FOLLOWER',
        detectedAt,
        effectiveAt,
        sourceSnapshotId: snapshotB.id,
        previousSnapshotId: snapshotA.id,
        previousState: 'NONE',
        newState: 'THEY_FOLLOW_YOU',
        confidence: 'CONFIRMED',
        summary: `@${username} started following you.`,
        details: `Observed between ${snapshotA.label} and ${snapshotB.label}.`,
      });
    }
  }

  // 2. Lost Followers (unfollowed you)
  for (const username of diff.lostFollowers) {
    const wasMutual = followersA.has(username) && followingA.has(username);
    const doYouStillFollow = followingB.has(username);

    if (wasMutual && doYouStillFollow) {
      events.push({
        id: `evt_nlm_${snapshotB.id}_${username}`,
        userId,
        subjectUsername: username,
        eventType: 'NO_LONGER_MUTUAL',
        detectedAt,
        effectiveAt,
        sourceSnapshotId: snapshotB.id,
        previousSnapshotId: snapshotA.id,
        previousState: 'MUTUAL',
        newState: 'YOU_FOLLOW_THEM',
        confidence: 'CONFIRMED',
        summary: `@${username} stopped following you. No longer mutual.`,
        details: `You still follow them, but they dropped from your followers list.`,
      });
    } else {
      events.push({
        id: `evt_lf_${snapshotB.id}_${username}`,
        userId,
        subjectUsername: username,
        eventType: 'LOST_FOLLOWER',
        detectedAt,
        effectiveAt,
        sourceSnapshotId: snapshotB.id,
        previousSnapshotId: snapshotA.id,
        previousState: wasMutual ? 'MUTUAL' : 'THEY_FOLLOW_YOU',
        newState: doYouStillFollow ? 'YOU_FOLLOW_THEM' : 'NONE',
        confidence: 'CONFIRMED',
        summary: `@${username} is no longer following you.`,
        details: `Removed or unfollowed your account before snapshot ${snapshotB.label}.`,
      });
    }
  }

  // 3. New Following (You followed them)
  for (const username of diff.newFollowing) {
    // Check if they already followed you in A
    const didTheyFollowInA = followersA.has(username);
    if (didTheyFollowInA) {
      events.push({
        id: `evt_bm_${snapshotB.id}_${username}`,
        userId,
        subjectUsername: username,
        eventType: 'BECAME_MUTUAL',
        detectedAt,
        effectiveAt,
        sourceSnapshotId: snapshotB.id,
        previousSnapshotId: snapshotA.id,
        previousState: 'THEY_FOLLOW_YOU',
        newState: 'MUTUAL',
        confidence: 'CONFIRMED',
        summary: `You followed @${username} back. Connection became MUTUAL.`,
        details: `They were already in your followers list; you added them to following.`,
      });
    } else {
      events.push({
        id: `evt_f_${snapshotB.id}_${username}`,
        userId,
        subjectUsername: username,
        eventType: 'FOLLOWED',
        detectedAt,
        effectiveAt,
        sourceSnapshotId: snapshotB.id,
        previousSnapshotId: snapshotA.id,
        previousState: 'NONE',
        newState: 'YOU_FOLLOW_THEM',
        confidence: 'CONFIRMED',
        summary: `You started following @${username}.`,
        details: `Added to following list in snapshot ${snapshotB.label}.`,
      });
    }
  }

  // 4. Unfollowed by you
  for (const username of diff.unfollowed) {
    const doTheyStillFollow = followersB.has(username);
    events.push({
      id: `evt_unf_${snapshotB.id}_${username}`,
      userId,
      subjectUsername: username,
      eventType: 'UNFOLLOWED',
      detectedAt,
      effectiveAt,
      sourceSnapshotId: snapshotB.id,
      previousSnapshotId: snapshotA.id,
      previousState: followersA.has(username) ? 'MUTUAL' : 'YOU_FOLLOW_THEM',
      newState: doTheyStillFollow ? 'THEY_FOLLOW_YOU' : 'NONE',
      confidence: 'CONFIRMED',
      summary: `You unfollowed @${username}.`,
      details: doTheyStillFollow
        ? `They still follow you, but you removed them from your following list.`
        : `Neither party follows each other.`,
    });
  }

  // Snapshot import milestone event
  events.push({
    id: `evt_snap_${snapshotB.id}`,
    userId,
    subjectUsername: snapshotB.metadata?.accountUsername || 'you',
    eventType: 'SNAPSHOT_IMPORTED',
    detectedAt,
    effectiveAt,
    sourceSnapshotId: snapshotB.id,
    previousSnapshotId: snapshotA.id,
    previousState: 'NONE',
    newState: 'NONE',
    confidence: 'CONFIRMED',
    summary: `Snapshot "${snapshotB.label}" ingested: +${diff.newFollowers.length} / -${diff.lostFollowers.length} followers.`,
    details: `${diff.becameMutual.length} new mutuals, ${diff.notFollowingBack.length} not following back.`,
  });

  return events;
}

/**
 * Determine relationship state between User and Subject in a specific snapshot
 */
export function getRelationshipStateInSnapshot(
  snapshot: Snapshot,
  username: string
): RelationshipState {
  const norm = username.toLowerCase();
  const follower = snapshot.followers.some(u => u.toLowerCase() === norm);
  const following = snapshot.following.some(u => u.toLowerCase() === norm);

  if (follower && following) return 'MUTUAL';
  if (follower) return 'THEY_FOLLOW_YOU';
  if (following) return 'YOU_FOLLOW_THEM';
  return 'NONE';
}
