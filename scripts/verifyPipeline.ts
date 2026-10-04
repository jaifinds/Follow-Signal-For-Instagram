import JSZip from 'jszip';
import { InstagramExportParser, buildSnapshotFromParseResult } from '../src/lib/exportParser';
import { compareSnapshots, generateEventsFromComparison } from '../src/lib/snapshotEngine';

async function createTestZip(): Promise<Blob> {
  const zip = new JSZip();
  const followersJson = [
    { string_list_data: [{ value: 'alex_test', timestamp: 1720000000 }] },
    { string_list_data: [{ value: 'jordan_test', timestamp: 1720000000 }] },
  ];
  const followingJson = {
    relationships_following: [
      { string_list_data: [{ value: 'alex_test', timestamp: 1720000000 }] },
      { string_list_data: [{ value: 'unreciprocated_user', timestamp: 1720000000 }] },
    ],
  };

  zip.file('followers_and_following/followers_1.json', JSON.stringify(followersJson));
  zip.file('followers_and_following/following.json', JSON.stringify(followingJson));

  return zip.generateAsync({ type: 'blob' });
}

async function runTests() {
  console.log('=== RUNNING INSTAGRAM RELATIONSHIP INTELLIGENCE VERIFICATION ===');
  const testBlob = await createTestZip();
  const parseResult = await InstagramExportParser.parse(testBlob, 'test_export.zip');
  console.log(`✓ Parser finished. Discovered format: ${parseResult.schemaDetected}`);
  console.log(`Followers: ${parseResult.followers.length}, Following: ${parseResult.following.length}`);
  console.log(`Mutuals: ${parseResult.mutuals.length}`);
}

runTests().catch(console.error);
