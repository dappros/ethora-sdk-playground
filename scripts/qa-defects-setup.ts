import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { getSDKInstance } from '../lib/sdk';

// npx -y tsx --env-file=.env.local scripts/qa-defects-setup.ts
// Creates 2 users + 1 shared group room for manual QA of the 26.7.1 defects.

function createUserJwt(userId: string): string {
  const appId = process.env.ETHORA_CHAT_APP_ID!;
  const appSecret = process.env.ETHORA_CHAT_APP_SECRET!;
  return jwt.sign(
    { data: { type: 'client', userId: String(userId), appId } },
    appSecret,
    { algorithm: 'HS256', expiresIn: '3d' }
  );
}

async function main() {
  const sdk = getSDKInstance();

  const users: { label: string; userId: string; jwt: string }[] = [];
  for (const [i, label] of ['qaAlice', 'qaBob'].entries()) {
    const userId = randomUUID();
    await sdk.createUser(userId, {
      firstName: label === 'qaAlice' ? 'Alice' : 'Bob',
      lastName: 'QA',
      email: `${label.toLowerCase()}.${Date.now()}@example.com`,
      password: 'Qwerty123',
    });
    console.log(`created ${label} -> ${userId}`);
    users.push({ label, userId, jwt: createUserJwt(userId) });
  }

  const roomId = randomUUID();
  await sdk.createChatRoom(roomId, {
    title: 'QA Defects Room',
    uuid: roomId,
    type: 'group',
  });
  await sdk.grantUserAccessToChatRoom(roomId, users.map((u) => u.userId));
  const roomJID = sdk.createChatName(roomId, true);

  console.log('\n===================== JSON =====================\n');
  console.log(JSON.stringify({ roomId, roomJID, users }, null, 2));
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
