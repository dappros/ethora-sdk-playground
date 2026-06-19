import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import { getSDKInstance } from '../lib/sdk';

// npx -y tsx --env-file=.env.local scripts/setup-test-users.ts

const NAMES = ['taras', 'dmytro', 'yana', 'borys', 'mansi', 'nikhil', 'sample'];

interface UserOut {
  label: string;
  userId: string;
  jwt: string;
}

interface GroupOut {
  name: string;
  roomId: string;
  roomJID: string;
  users: UserOut[];
}

function createUserJwt3d(userId: string): string {
  const appId = process.env.ETHORA_CHAT_APP_ID!;
  const appSecret = process.env.ETHORA_CHAT_APP_SECRET!;
  return jwt.sign(
    {
      data: {
        type: 'client',
        userId: String(userId),
        appId: appId,
      },
    },
    appSecret,
    { algorithm: 'HS256', expiresIn: '3d' }
  );
}

async function main() {
  const sdk = getSDKInstance();
  const results: GroupOut[] = [];

  for (const name of NAMES) {
    console.log(`\n=== Processing ${name} ===`);

    // 2 users for this person
    const users: UserOut[] = [];
    for (let i = 1; i <= 2; i++) {
      const label = `${name}${i}`;
      const userId = randomUUID();

      try {
        await sdk.createUser(userId, {
          firstName: `${name.charAt(0).toUpperCase() + name.slice(1)}`,
          lastName: `Test${i}`,
          email: `${label}.test@example.com`,
          password: 'Qwerty123',
        });
        console.log(`  ✓ created user ${label} -> ${userId}`);
      } catch (e: any) {
        console.warn(`  ! user ${label} create warning:`, e?.message ?? e);
      }

      const token = createUserJwt3d(userId);
      users.push({ label, userId, jwt: token });
    }

    // group room (the pair's testroom)
    const roomId = randomUUID();
    const roomTitle = `${name} testroom`;
    try {
      await sdk.createChatRoom(roomId, {
        title: roomTitle,
        uuid: roomId,
        type: 'group',
      });
      console.log(`  ✓ created room "${roomTitle}" -> ${roomId}`);
    } catch (e: any) {
      console.warn(`  ! room ${roomTitle} create warning:`, e?.message ?? e);
    }

    // grant both users access
    try {
      await sdk.grantUserAccessToChatRoom(
        roomId,
        users.map((u) => u.userId)
      );
      console.log(`  ✓ granted access to both users`);
    } catch (e: any) {
      console.warn(`  ! grant access warning:`, e?.message ?? e);
    }

    const roomJID = sdk.createChatName(roomId, true);

    results.push({
      name,
      roomId,
      roomJID,
      users,
    });
  }

  console.log('\n\n===================== RESULTS =====================\n');
  for (const g of results) {
    console.log(`\n── ${g.name} testroom ──`);
    console.log(`  roomId : ${g.roomId}`);
    console.log(`  roomJID: ${g.roomJID}`);
    for (const u of g.users) {
      console.log(`  user ${u.label}:`);
      console.log(`    userId: ${u.userId}`);
      console.log(`    jwt   : ${u.jwt}`);
    }
  }

  // Also dump as JSON so the user has structured output
  console.log('\n\n===================== JSON =====================\n');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
