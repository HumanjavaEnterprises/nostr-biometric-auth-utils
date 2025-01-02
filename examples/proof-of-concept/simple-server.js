import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { base64ToBytes, bytesToHex, hexToBytes } from '@scure/base';
import { NostrWebSocketClient } from 'nostr-websocket-utils';
import { NostrCrypto } from 'nostr-crypto-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true
});

// Serve static files
fastify.register(fastifyStatic, {
  root: join(__dirname, 'public'),
  prefix: '/'
});

// In-memory credential storage (for demo purposes)
const credentialStorage = new Map();

// Configuration
const config = {
  rpName: 'Nostr Wallet',
  rpID: 'localhost',
  origin: 'http://localhost:3000',
  relayUrl: 'wss://relay.maiqr.app'
};

// Initialize Nostr client
const nostrClient = new NostrWebSocketClient({
  relayUrl: config.relayUrl,
  autoReconnect: true
});

// Connect to relay
await nostrClient.connect();

// Verify npub and fetch user profile
fastify.post('/verify-npub', async (request, reply) => {
  try {
    const { npub } = request.body;
    const pubkey = NostrCrypto.decodePubkey(npub);
    
    // Fetch user profile from relay
    const profile = await nostrClient.fetchUserProfile(pubkey);
    const username = profile?.name || profile?.displayName || 'Unknown User';

    return { 
      pubkey,
      username,
      success: true 
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ 
      error: error.message,
      success: false 
    });
  }
});

// Generate registration options
fastify.post('/generate-registration-options', async (request, reply) => {
  try {
    const { pubkey, username } = request.body;
    
    // Convert pubkey to hex for WebAuthn ID
    const userIdBytes = hexToBytes(pubkey);
    const userIdBase64 = base64ToBytes(userIdBytes);
    
    const options = {
      rpName: config.rpName,
      rpID: config.rpID,
      userID: userIdBase64,
      userName: username,
      timeout: 60000,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
        authenticatorAttachment: 'platform'
      }
    };

    return options;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ error: error.message });
  }
});

// Verify registration
fastify.post('/verify-registration', async (request, reply) => {
  try {
    const { pubkey, credential } = request.body;
    
    // Store the credential
    credentialStorage.set(pubkey, credential);
    
    return { 
      verified: true,
      pubkey 
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ error: error.message });
  }
});

// Generate authentication options
fastify.post('/generate-authentication-options', async (request, reply) => {
  try {
    const { pubkey } = request.body;
    const credential = credentialStorage.get(pubkey);
    
    if (!credential) {
      throw new Error('No credential found for this user');
    }
    
    const options = {
      timeout: 60000,
      allowCredentials: [{
        id: credential.id,
        type: 'public-key',
        transports: ['internal']
      }],
      userVerification: 'required',
      rpID: config.rpID
    };

    return options;
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ error: error.message });
  }
});

// Verify authentication
fastify.post('/verify-authentication', async (request, reply) => {
  try {
    const { pubkey, credential } = request.body;
    const storedCredential = credentialStorage.get(pubkey);
    
    if (!storedCredential) {
      throw new Error('No credential found for this user');
    }
    
    // In a real implementation, you would verify the credential here
    // For demo purposes, we'll just check if the credentials exist
    return { 
      verified: true,
      pubkey 
    };
  } catch (error) {
    fastify.log.error(error);
    return reply.status(400).send({ error: error.message });
  }
});

// Start server
try {
  await fastify.listen({ port: 3000 });
  console.log('Server listening on port 3000');
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
