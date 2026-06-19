import { generateClientToken } from '../lib/sdk';

// Generate a client JWT for a given user id.
// Run: npx -y tsx --env-file=.env.local scripts/get-token.ts
// Requires ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET in .env.local.
// Replace the user id below with the one you want a token for.
async function main() {
  const userId = process.env.ETHORA_CHAT_USER_ID || '87cf01f3-323a-46ac-8fe4-8ede69b17313';
  const token = generateClientToken(userId);

  if (token) {
    console.log('\n✅ Server Token Generated Successfully:\n');
    console.log(token);
    console.log('\n');
  } else {
    console.error('\n❌ Error: Failed to generate server token.');
    console.error('Check if ETHORA_CHAT_APP_ID and ETHORA_CHAT_APP_SECRET are set in your environment correctly.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
