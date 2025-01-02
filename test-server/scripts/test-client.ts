import WebSocket from 'ws';
import { generatePrivateKey, getPublicKey, getEventHash, signEvent } from 'nostr-tools';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.dev' });

async function main() {
  const ws = new WebSocket('ws://localhost:3000');

  ws.on('open', () => {
    console.log('Connected to test server');

    // Create a test DM event
    const privateKey = process.env.NOSTR_TEST_NSEC?.replace('nsec1', '') || generatePrivateKey();
    const publicKey = getPublicKey(privateKey);

    const event = {
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      tags: [['p', publicKey]],
      content: JSON.stringify({
        type: 'wallet-storage',
        version: '1.0.0',
        data: {
          name: 'Test Wallet',
          type: 'BTC',
          encrypted: true,
          timestamp: Date.now()
        }
      }),
      pubkey: publicKey
    };

    // Sign the event
    const id = getEventHash(event);
    const sig = signEvent(event, privateKey);
    const signedEvent = { ...event, id, sig };

    // Send the event
    ws.send(JSON.stringify(['EVENT', signedEvent]));

    // Subscribe to our own events
    ws.send(JSON.stringify(['REQ', 'test-sub', { kinds: [4], authors: [publicKey] }]));
  });

  ws.on('message', (data) => {
    console.log('Received:', JSON.parse(data.toString()));
  });

  ws.on('error', console.error);
}

main().catch(console.error);
