import fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = fastify();

// Serve static files
server.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// Serve verify.html for auth/verify routes
server.get('/auth/verify/*', async (request, reply) => {
  return reply.sendFile('verify.html');
});

// Server info endpoint
server.get('/server-info', async (request, reply) => {
  return { rpId: 'nostr-auth.localhost' };
});

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3000, host: 'nostr-auth.localhost' });
    console.log('Server is running at http://nostr-auth.localhost:3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
