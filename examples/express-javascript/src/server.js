import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { nip19 } from 'nostr-tools';
import crypto from 'crypto';
import 'websocket-polyfill';
import { SimplePool } from 'nostr-tools';
import { config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Nostr pool
const pool = new SimplePool();

// Basic WebAuthn server implementation
class WebAuthnServer {
  constructor(options) {
    this.options = options;
    this.challenges = new Map();
    this.credentials = new Map();
  }

  generateRandomBuffer() {
    return crypto.randomBytes(32);
  }

  generateRegistrationChallenge(userId) {
    const challenge = this.generateRandomBuffer().toString('base64');
    this.challenges.set(userId, {
      challenge,
      timestamp: Date.now()
    });
    return challenge;
  }

  generateAuthenticationChallenge(userId) {
    const challenge = this.generateRandomBuffer().toString('base64');
    this.challenges.set(userId, {
      challenge,
      timestamp: Date.now()
    });
    return challenge;
  }

  verifyRegistration(userId, credential) {
    const expectedChallenge = this.challenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('Challenge not found');
    }

    // In a real implementation, we would verify the attestation
    // For this example, we'll just store the credential
    this.credentials.set(userId, credential);
    this.challenges.delete(userId);

    return true;
  }

  verifyAuthentication(userId, credential) {
    const expectedChallenge = this.challenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('Challenge not found');
    }

    const storedCredential = this.credentials.get(userId);
    if (!storedCredential) {
      throw new Error('User not registered');
    }

    // In a real implementation, we would verify the assertion
    // For this example, we'll just check if the credential exists
    this.challenges.delete(userId);

    return true;
  }
}

const app = express();

// Middleware
app.use(cors({
  origin: config.origin,
  credentials: true
}));
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Helper function to get profile from relays
async function getProfileFromRelays(pubkey) {
  try {
    const filter = {
      kinds: [0],
      authors: [pubkey],
      limit: 1
    };

    const events = await pool.list(config.relays, [filter]);
    if (!events || events.length === 0) {
      return null;
    }

    const profileEvent = events[0];
    const content = JSON.parse(profileEvent.content);
    
    return {
      name: content.name || content.displayName || content.display_name,
      picture: content.picture || content.image || content.avatar,
      about: content.about || content.description,
      pubkey: pubkey
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.post('/npub-to-hex', async (req, res) => {
  try {
    const { npub } = req.body;
    if (!npub) {
      return res.status(400).json({ error: 'npub is required' });
    }

    try {
      const decoded = nip19.decode(npub);
      if (!decoded || !decoded.data) {
        return res.status(400).json({ error: 'Invalid npub format' });
      }

      // Get profile information
      const profile = await getProfileFromRelays(decoded.data);
      
      return res.json({ 
        pubkey: decoded.data,
        profile
      });
    } catch (conversionError) {
      console.error('Error in npub conversion:', conversionError);
      return res.status(400).json({ error: 'Invalid npub format' });
    }
  } catch (error) {
    console.error('Error handling npub conversion request:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
});

// WebAuthn configuration
const webAuthnServer = new WebAuthnServer({
  rpName: config.rpName,
  rpId: config.rpId,
  origin: config.origin
});

app.post('/auth/webauthn/register/challenge', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const challenge = webAuthnServer.generateRegistrationChallenge(userId);
    res.json({ challenge });
  } catch (error) {
    console.error('Error generating registration challenge:', error);
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

app.post('/auth/webauthn/register/verify', async (req, res) => {
  try {
    const { userId, credential } = req.body;
    if (!userId || !credential) {
      return res.status(400).json({ error: 'userId and credential are required' });
    }

    const success = webAuthnServer.verifyRegistration(userId, credential);
    res.json({ success });
  } catch (error) {
    console.error('Error verifying registration:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/auth/webauthn/authenticate/challenge', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const challenge = webAuthnServer.generateAuthenticationChallenge(userId);
    res.json({ challenge });
  } catch (error) {
    console.error('Error generating authentication challenge:', error);
    res.status(500).json({ error: 'Failed to generate challenge' });
  }
});

app.post('/auth/webauthn/authenticate/verify', async (req, res) => {
  try {
    const { userId, credential } = req.body;
    if (!userId || !credential) {
      return res.status(400).json({ error: 'userId and credential are required' });
    }

    const success = webAuthnServer.verifyAuthentication(userId, credential);
    res.json({ success });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(config.port, () => {
  console.log(`Server running at ${config.origin}/`);
});
