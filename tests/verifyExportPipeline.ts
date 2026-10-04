import JSZip from 'jszip';
import { InstagramExportParser, buildSnapshotFromParseResult } from '../src/lib/exportParser';
import { compareSnapshots, generateEventsFromComparison } from '../src/lib/snapshotEngine';

async function createTestZip(): Promise<Blob> {
  const zip = new JSZip();
  const followersJson = [
    { string_list_data: [{ value: 'user_a', timestamp: 1720000000 }] },
    { string_list_data: [{ value: 'user_b', timestamp: 1720000000 }] },
  ];
  const followingJson = {
    relationships_following: [
      { string_list_data: [{ value: 'user_a', timestamp: 1720000000 }] },
      { string_list_data: [{ value: 'user_c', timestamp: 1720000000 }] },
    ],
  };

  zip.file('followers_and_following/followers_1.json', JSON.stringify(followersJson));
  zip.file('followers_and_following/following.json', JSON.stringify(followingJson));

  return zip.generateAsync({ type: 'blob' });
}

async function runTestSuite() {
  console.log('Testing Export Pipeline...');
  const blob = await createTestZip();
  const parseResult = await InstagramExportParser.parse(blob, 'unit_test.zip');
  console.log('Followers parsed:', parseResult.followers.length);
  console.log('Following parsed:', parseResult.following.length);
  console.log('Mutuals detected:', parseResult.mutuals.length);
}

runTestSuite().catch(console.error);
