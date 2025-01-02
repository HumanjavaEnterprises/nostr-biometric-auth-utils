import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { NostrRelay } from './nostr/relay';
import { WebAuthnHandler } from './auth/webauthn';
import { DMMonitor } from './nostr/dm-monitor';

// Load environment variables
dotenv.config({ path: '.env.dev' });

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Initialize components
const relay = new NostrRelay(wss);
const webAuthn = new WebAuthnHandler();
const dmMonitor = new DMMonitor(relay);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// WebAuthn endpoints
app.post('/auth/register/options', webAuthn.getRegistrationOptions);
app.post('/auth/register/verify', webAuthn.verifyRegistration);
app.post('/auth/authenticate/options', webAuthn.getAuthenticationOptions);
app.post('/auth/authenticate/verify', webAuthn.verifyAuthentication);

// DM monitoring endpoints
app.get('/monitor/dms/:pubkey', dmMonitor.getDMs);
app.get('/monitor/stats', dmMonitor.getStats);

// Test utility endpoints
app.post('/test/generate-keys', (req, res) => {
  // TODO: Generate test nostr keys
  res.json({ status: 'not implemented' });
});

app.post('/test/simulate-dm', (req, res) => {
  // TODO: Simulate DM events
  res.json({ status: 'not implemented' });
});

app.post('/test/simulate-auth-failure', (req, res) => {
  // TODO: Simulate auth failures
  res.json({ status: 'not implemented' });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
