import fastify from 'fastify';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';
import { config } from './config.js';
import { bech32 } from '@scure/base';
import { nostrClient } from './nostr-client.js';
import { magicLinkHandler } from './magic-link-handler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = fastify({ 
    logger: true,
    https: config.server.https || false
});

// Add JSON body parsing support
server.addContentTypeParser('application/json', { parseAs: 'string' }, function (req, body, done) {
    try {
        const json = JSON.parse(body);
        done(null, json);
    } catch (err) {
        err.statusCode = 400;
        done(err, undefined);
    }
});

// Helper function to decode npub
function decodeNpub(npub) {
    try {
        const { words } = bech32.decode(npub, 1000);
        const data = bech32.fromWords(words);
        return {
            type: 'npub',
            data: Buffer.from(data).toString('hex')
        };
    } catch (error) {
        throw new Error('Invalid npub format');
    }
}

server.get('/', (request, reply) => {
    reply.sendFile('index.html');
});

server.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
});

// Add configuration endpoint for client
server.get('/config', (request, reply) => {
    reply.send({
        app: {
            name: config.app.name,
            origin: config.app.origin,
            id: config.app.id
        },
        webauthn: {
            timeout: config.webauthn.timeout,
            authenticatorAttachment: config.webauthn.authenticatorAttachment,
            userVerification: config.webauthn.userVerification,
            attestation: config.webauthn.attestation,
            algorithms: config.webauthn.algorithms
        }
    });
});

// Add npub verification endpoint
server.post('/verify-npub', async (request, reply) => {
    try {
        const { npub } = request.body;
        
        if (!npub) {
            return reply.code(400).send({ error: 'npub is required' });
        }

        // Verify and decode the npub
        try {
            if (!npub.startsWith('npub1')) {
                return reply.code(400).send({ error: 'Invalid npub format' });
            }

            const decoded = decodeNpub(npub);
            
            // Fetch user profile from relays
            const profile = await nostrClient.getUserProfile(decoded.data);
            
            return reply.send({
                username: profile?.name || profile?.displayName || `user:${decoded.data.slice(0, 8)}`,
                displayName: profile?.displayName,
                name: profile?.name,
                about: profile?.about,
                picture: profile?.picture,
                publicKey: decoded.data
            });
        } catch (error) {
            return reply.code(400).send({ error: 'Invalid npub' });
        }
    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ error: 'Internal server error' });
    }
});

// Add magic link request endpoint
server.post('/request-magic-link', async (request, reply) => {
    try {
        const { npub } = request.body;
        
        if (!npub) {
            return reply.code(400).send({ error: 'npub is required' });
        }

        try {
            if (!npub.startsWith('npub1')) {
                return reply.code(400).send({ error: 'Invalid npub format' });
            }

            const decoded = decodeNpub(npub);
            const success = await magicLinkHandler.sendMagicLink(decoded.data);
            
            if (success) {
                return reply.send({ 
                    message: 'Magic link sent successfully. Please check your Nostr DMs.',
                    pubkey: decoded.data
                });
            } else {
                return reply.code(500).send({ error: 'Failed to send magic link' });
            }
        } catch (error) {
            return reply.code(400).send({ error: 'Invalid npub' });
        }
    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ error: 'Internal server error' });
    }
});

// Add magic link verification endpoint
server.post('/verify-magic-link', async (request, reply) => {
    try {
        const { token } = request.body;
        
        if (!token) {
            return reply.code(400).send({ error: 'Token is required' });
        }

        const result = await magicLinkHandler.verifyMagicLink(token);
        
        if (!result.valid) {
            return reply.code(400).send({ error: result.reason });
        }

        return reply.send({
            verified: true,
            pubkey: result.pubkey,
            profile: result.profile
        });
    } catch (error) {
        request.log.error(error);
        reply.code(500).send({ error: 'Internal server error' });
    }
});

// Cleanup function for WebSocket connections
function cleanup() {
    nostrClient.closeAllConnections();
    magicLinkHandler.cleanup();
    process.exit(0);
}

// Handle cleanup on server shutdown
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Start the server
const start = async () => {
    try {
        await magicLinkHandler.init();
        await server.listen({ 
            port: config.server.port, 
            host: config.server.host 
        });
        console.log(`Server is running on ${config.app.origin}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
