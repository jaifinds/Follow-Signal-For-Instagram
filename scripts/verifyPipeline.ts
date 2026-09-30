import { createOwnerExportZipBlob, createSecondCheckInZipBlob } from '../src/fixtures/ownerExportZip';
import { InstagramExportParser, buildSnapshotFromParseResult } from '../src/lib/exportParser';
import { compareSnapshots, generateEventsFromComparison } from '../src/lib/snapshotEngine';

async function runTests() {
  console.log('=== RUNNING INSTAGRAM RELATIONSHIP INTELLIGENCE VERIFICATION ===');

  // Test 1: Generate real Owner Export ZIP Blob
  console.log('\n[TEST 1] Generating authentic Owner Export ZIP Blob...');
  const ownerZipBlob = await createOwnerExportZipBlob();
  console.log(`✓ Owner ZIP generated successfully. Size: ${ownerZipBlob.size} bytes`);

  // Test 2: Ingest & Parse Owner ZIP via InstagramExportParser
  console.log('\n[TEST 2] Ingesting ZIP via InstagramExportParser.parse...');
  const progressLogs: string[] = [];
  const parseResult = await InstagramExportParser.parse(ownerZipBlob, 'instagram_owner_export.zip', (step, pct) => {
    progressLogs.push(`[${pct}%] ${step}`);
  });
  console.log(`✓ Parser finished. Discovered format: ${parseResult.schemaDetected}`);
  console.log(`✓ Progress steps triggered: ${progressLogs.length}`);

  // Test 3: Verify Exact Regression Numbers (PHASE 3)
  console.log('\n[TEST 3] Verifying exact regression values:');
  const expected = {
    followers: 163,
    following: 75,
    mutuals: 60,
    followingNotFollowingBack: 15,
    followersNotFollowedBack: 103,
    closeFriends: 43,
    pendingRequests: 7,
    recentRequests: 65,
    recentlyUnfollowed: 248,
  };

  const actual = {
    followers: parseResult.followers.length,
    following: parseResult.following.length,
    mutuals: parseResult.mutuals.length,
    followingNotFollowingBack: parseResult.followingNotFollowingBack.length,
    followersNotFollowedBack: parseResult.followersNotFollowedBack.length,
    closeFriends: parseResult.closeFriends.length,
    pendingRequests: parseResult.pendingRequests.length,
    recentRequests: parseResult.recentRequests.length,
    recentlyUnfollowed: parseResult.recentlyUnfollowed.length,
  };

  let allPassed = true;
  for (const [key, expVal] of Object.entries(expected)) {
    const actVal = (actual as any)[key];
    const match = expVal === actVal;
    if (!match) allPassed = false;
    console.log(`  ${match ? '✓' : '✗'} ${key}: expected ${expVal}, got ${actVal}`);
  }

  if (!allPassed) {
    throw new Error('Regression test failed! Numbers do not match specification.');
  }
  console.log('✓ All 9 core regression metrics passed exact match!');

  // Test 4: Build Snapshot
  console.log('\n[TEST 4] Building Snapshot 1 (Baseline)...');
  const snapshot1 = buildSnapshotFromParseResult(parseResult, 'Baseline Snapshot', 'user_owner', 'instagram_owner_export.zip', true);
  console.log(`✓ Snapshot 1 created. ID: ${snapshot1.id}, Followers: ${snapshot1.followersCount}, Following: ${snapshot1.followingCount}`);
  console.log(`✓ Import Report: Files detected: ${snapshot1.importReport?.filesDetected}, Status: "${snapshot1.importReport?.statusMessage}"`);

  // Test 5: Diff with self should yield 0 changes
  console.log('\n[TEST 5] Baseline diff check (comparing snapshot against itself)...');
  const baselineDiff = compareSnapshots(snapshot1, snapshot1);
  if (baselineDiff.lostFollowers.length !== 0 || baselineDiff.newFollowers.length !== 0) {
    throw new Error('Baseline diff failed! Expected 0 changes against self.');
  }
  console.log('✓ Baseline diff against itself produces 0 new/lost followers as required.');

  // Test 6: Ingest Second Check-in ZIP and Diff
  console.log('\n[TEST 6] Ingesting Second Check-in Archive and testing Diff Engine...');
  const secondZipBlob = await createSecondCheckInZipBlob();
  const parseResult2 = await InstagramExportParser.parse(secondZipBlob, 'second_checkin.zip');
  const snapshot2 = buildSnapshotFromParseResult(parseResult2, 'Second Check-in', 'user_owner', 'second_checkin.zip', false, 5);
  
  const diff = compareSnapshots(snapshot1, snapshot2);
  console.log(`  New followers: ${diff.newFollowers.length} (${diff.newFollowers.join(', ')})`);
  console.log(`  Lost followers: ${diff.lostFollowers.length} (${diff.lostFollowers.join(', ')})`);
  
  const events = generateEventsFromComparison(snapshot1, snapshot2, diff);
  console.log(`✓ Diff Engine computed ${events.length} ledger events.`);
  for (const ev of events) {
    console.log(`    - [${ev.eventType}] ${ev.summary}`);
  }

  console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===\n');
}

runTests().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
