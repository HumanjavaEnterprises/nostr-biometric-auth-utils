import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import { NostrBiometricServer } from '../../../src/server';
import { WebAuthnServer } from '../../../src/server/webauthn';
import os from 'os';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Development configuration
const VALID_DOMAINS = [
  'nostr-auth.localhost',
  'travellaptop.local',
  '10.0.0.31'
];

const IS_DEV = process.env.NODE_ENV !== 'production';

// For WebAuthn, we need to use a valid domain for the rpId
// IP addresses and some local domains won't work directly
function getWebAuthnRpId(hostname: string) {
  // Remove port if present
  hostname = hostname.split(':')[0].toLowerCase();
  
  // If it's an IP address or non-.local hostname, use localhost
  if (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || // IP address
    !hostname.includes('.') // Hostname without domain
  ) {
    return 'localhost';
  }
  
  return hostname;
}

// Helper to check if a hostname is valid
function isValidHostname(hostname: string) {
  // Remove port number if present
  hostname = hostname.split(':')[0];
  
  // Case insensitive comparison
  const lowerHostname = hostname.toLowerCase();
  return VALID_DOMAINS.some(domain => {
    const lowerDomain = domain.toLowerCase();
    return lowerHostname === lowerDomain || 
           lowerHostname.endsWith('.' + lowerDomain) ||
           // Also check without .local suffix
           (lowerDomain.endsWith('.local') && 
            lowerHostname === lowerDomain.replace('.local', ''));
  });
}

// Initialize the server
const server = fastify({ 
  logger: true,
  // Required for WebAuthn to work over IP/hostname
  https: {
    key: fs.readFileSync(path.join(__dirname, '../../proof-of-concept/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, '../../proof-of-concept/cert.pem'))
  }
});

// Add hook to validate hostname
server.addHook('onRequest', async (request, reply) => {
  const hostname = request.hostname;
  console.log('Received request with hostname:', hostname);
  console.log('Headers:', request.headers);
  console.log('Valid domains:', VALID_DOMAINS);
  console.log('Is valid?', isValidHostname(hostname));
  
  if (!isValidHostname(hostname)) {
    const validUrls = VALID_DOMAINS.map(domain => `https://${domain}:3000`);
    reply.code(400).send({
      error: 'Invalid hostname',
      message: `Please access this server using one of these URLs: ${validUrls.join(', ')}`
    });
  }
});

// Serve static files from public directory
server.register(fastifyStatic, {
  root: path.join(__dirname, '..', 'src', 'public'),
  prefix: '/public/',
});

// Serve index.html at root
server.get('/', async (request, reply) => {
  return reply.sendFile('index.html', path.join(__dirname, '..', 'src', 'public'));
});

// Add route to get server info
server.get('/server-info', async (request, reply) => {
  const hostname = request.hostname;
  const rpId = getWebAuthnRpId(hostname);
  
  return {
    hostname,
    addresses: VALID_DOMAINS,
    rpId
  };
});

// Initialize WebAuthn with dynamic rpId
const webAuthnServer = new WebAuthnServer({
  rpId: 'localhost', // Default rpId, will be updated per request
  rpName: 'Nostr Biometric Login Example'
});

// Routes
server.post('/auth/webauthn/register/challenge', async (request, reply) => {
  const { userId } = request.body as { userId: string };
  webAuthnServer.options.rpId = getWebAuthnRpId(request.hostname);
  const challenge = webAuthnServer.generateRegistrationChallenge(userId);
  return { challenge };
});

server.post('/auth/webauthn/register/verify', async (request, reply) => {
  const { userId, credential } = request.body as { userId: string; credential: any };
  try {
    webAuthnServer.options.rpId = getWebAuthnRpId(request.hostname);
    const success = await webAuthnServer.verifyRegistration(userId, credential);
    return { success };
  } catch (error) {
    reply.status(400);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

server.post('/auth/webauthn/authenticate/challenge', async (request, reply) => {
  const { userId } = request.body as { userId: string };
  webAuthnServer.options.rpId = getWebAuthnRpId(request.hostname);
  const challenge = webAuthnServer.generateAuthenticationChallenge(userId);
  return { challenge };
});

server.post('/auth/webauthn/authenticate/verify', async (request, reply) => {
  const { userId, credential } = request.body as { userId: string; credential: any };
  try {
    webAuthnServer.options.rpId = getWebAuthnRpId(request.hostname);
    const success = await webAuthnServer.verifyAuthentication(userId, credential);
    return { success };
  } catch (error) {
    reply.status(400);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Start the server
const start = async () => {
  try {
    // Listen on all interfaces
    await server.listen({ 
      port: 3000, 
      host: '0.0.0.0'
    });
    
    console.log('\nServer running at:');
    for (const domain of VALID_DOMAINS) {
      console.log(`- https://${domain}:3000`);
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
