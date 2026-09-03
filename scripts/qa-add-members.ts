import { randomUUID } from 'crypto';
import { getSDKInstance } from '../lib/sdk';

// npx -y tsx --env-file=.env.local scripts/qa-add-members.ts <roomId> <count>
// Pads a room with extra members so the Chat Profile member list overflows
// a small (4.7") screen — needed to test defect #30 honestly.

async function main() {
  const sdk = getSDKInstance();
  const roomId = process.argv[2];
  const count = Number(process.argv[3] || 8);
  if (!roomId) { console.error('usage: qa-add-members.ts <roomId> [count]'); process.exit(2); }

  const ids: string[] = [];
  for (let i = 1; i <= count; i++) {
    const userId = randomUUID();
    await sdk.createUser(userId, {
      firstName: `Member${i}`,
      lastName: 'Filler',
      email: `filler${i}.${Date.now()}@example.com`,
      password: 'Qwerty123',
    });
    ids.push(userId);
    console.log(`created Member${i} -> ${userId}`);
  }
  await sdk.grantUserAccessToChatRoom(roomId, ids);
  console.log(`granted ${ids.length} members access to ${roomId}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
