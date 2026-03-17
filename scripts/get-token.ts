import { generateClientToken } from '../lib/sdk';

async function main() {
  const token = generateClientToken("playground-user-1");
  
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
