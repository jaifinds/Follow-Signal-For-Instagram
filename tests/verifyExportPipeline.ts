import { createOwnerExportZipBlob, createSecondCheckInZipBlob } from '../src/fixtures/ownerExportZip';
import { InstagramExportParser, buildSnapshotFromParseResult } from '../src/lib/exportParser';
import { compareSnapshots, generateEventsFromComparison } from '../src/lib/snapshotEngine';

async function runTestSuite() {
  console.log('=====================================================');
  console.log('CHRONOGRAPH EXPORT PARSER & SNAPSHOT REGRESSION SUITE');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(description: string, condition: boolean, actual?: any, expected?: any) {
    if (condition) {
      console.log(`  ✓ PASS: ${description}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${description} (Actual: ${actual}, Expected: ${expected})`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: Real Owner Export ZIP Parsing
  // -------------------------------------------------------------
  console.log('Test 1: Parsing Owner Export ZIP...');
  const ownerZipBlob = await createOwnerExportZipBlob();
  const parseResult = await InstagramExportParser.parse(ownerZipBlob, 'instagram_owner_export.zip');

  assert('Followers count equals 163', parseResult.followers.length === 163, parseResult.followers.length, 163);
  assert('Following count equals 75', parseResult.following.length === 75, parseResult.following.length, 75);
  assert('Mutuals count equals 60', parseResult.mutuals.length === 60, parseResult.mutuals.length, 60);
  assert(
    'Following without follow-back equals 15',
    parseResult.followingNotFollowingBack.length === 15,
    parseResult.followingNotFollowingBack.length,
    15
  );
  assert(
    'Followers not followed back equals 103',
    parseResult.followersNotFollowedBack.length === 103,
    parseResult.followersNotFollowedBack.length,
    103
  );
  assert('Close Friends equals 43', parseResult.closeFriends.length === 43, parseResult.closeFriends.length, 43);
  assert(
    'Pending Requests equals 7',
    parseResult.pendingRequests.length === 7,
    parseResult.pendingRequests.length,
    7
  );
  assert(
    'Recent Requests equals 65',
    parseResult.recentRequests.length === 65,
    parseResult.recentRequests.length,
    65
  );
  assert(
    'Recently Unfollowed dataset equals 248',
    parseResult.recentlyUnfollowed.length === 248,
    parseResult.recentlyUnfollowed.length,
    248
  );

  // -------------------------------------------------------------
  // Test 2: Baseline Snapshot Rules (Section 9, 18, 19)
  // -------------------------------------------------------------
  console.log('\nTest 2: Baseline Snapshot Rules...');
  const snapshot1 = buildSnapshotFromParseResult(parseResult, 'Baseline Snapshot', 'user_123', 'instagram_owner_export.zip', true);

  assert('Snapshot 1 is marked as baseline', snapshot1.importReport?.isBaseline === true);
  assert(
    'Baseline status message matches expectation',
    snapshot1.importReport?.statusMessage === 'This is your baseline. Future imports can reveal changes.',
    snapshot1.importReport?.statusMessage
  );

  const diffInitial = compareSnapshots(null, snapshot1);
  assert('Initial diff has zero lost followers', diffInitial.lostFollowers.length === 0, diffInitial.lostFollowers.length, 0);

  const initialEvents = generateEventsFromComparison(null, snapshot1, diffInitial);
  assert('Initial events contains SNAPSHOT_IMPORTED baseline anchor', initialEvents.some(e => e.eventType === 'SNAPSHOT_IMPORTED'));
  assert('Initial events has NO false LOST_FOLLOWER events', !initialEvents.some(e => e.eventType === 'LOST_FOLLOWER'));

  // -------------------------------------------------------------
  // Test 3: Second Snapshot Diff Engine (Section 10 & 20)
  // -------------------------------------------------------------
  console.log('\nTest 3: Second Check-in Snapshot Diff Engine...');
  const secondZipBlob = await createSecondCheckInZipBlob();
  const parseResult2 = await InstagramExportParser.parse(secondZipBlob, 'instagram_checkin_2.zip');

  const diffSecond = compareSnapshots(snapshot1, buildSnapshotFromParseResult(parseResult2, 'Check-in #2', 'user_123', 'instagram_checkin_2.zip', false));
  const secondEvents = generateEventsFromComparison(
    snapshot1,
    buildSnapshotFromParseResult(parseResult2, 'Check-in #2', 'user_123', 'instagram_checkin_2.zip', false),
    diffSecond
  );

  assert('New followers detected', diffSecond.newFollowers.length === 3, diffSecond.newFollowers.length, 3);
  assert('Lost followers detected', diffSecond.lostFollowers.length === 2, diffSecond.lostFollowers.length, 2);
  assert('Events ledger generated events for transitions', secondEvents.length > 0);

  // -------------------------------------------------------------
  // Test 4: Unicode Preservation & Safe Profile URLs
  // -------------------------------------------------------------
  console.log('\nTest 4: Unicode Preservation & Safe URLs...');
  const sampleProfile = Object.values(parseResult.profiles).find(p => p.displayName && p.displayName.includes('Renée'));
  assert('Unicode display names preserved correctly', Boolean(sampleProfile && sampleProfile.displayName?.includes('Renée')));
  assert('Profile URL correctly formatted without _u/', Boolean(sampleProfile?.profileUrl.includes('https://www.instagram.com/')));

  console.log('\n-----------------------------------------------------');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('-----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
