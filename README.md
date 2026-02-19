# Nostr Biometric Authentication Utilities

[![npm version](https://img.shields.io/npm/v/nostr-biometric-auth-utils.svg)](https://www.npmjs.com/package/nostr-biometric-auth-utils)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A comprehensive utility library for implementing biometric authentication in Nostr applications using WebAuthn. This library provides a flexible set of tools for adding secure biometric authentication as a step-up factor to your Nostr-based applications.

## Features

- **WebAuthn Integration**: Ready-to-use utilities for implementing WebAuthn-based biometric authentication
- **Platform Support**:
  - TouchID/FaceID for iOS and macOS
  - Windows Hello
  - Android biometric authentication
  - Security Key support (FIDO2/U2F)
- **Nostr-Specific Tools**:
  - Full NIP-19 compliance for entity encoding/decoding
  - Nostr profile integration
  - Direct message-based settings management
- **Type Safety**: Comprehensive TypeScript support with strict typing
- **Flexible Integration**: Can be used with any web framework or Nostr client
- **Security First**: Built with security best practices and proper error handling

## Installation

```bash
npm install nostr-biometric-auth-utils
```

## Quick Start

### Basic Authentication Flow

```typescript
import { NostrBiometricClient } from 'nostr-biometric-auth-utils';

const client = new NostrBiometricClient({
  relays: ['wss://relay.damus.io'],
  magicLinkExpiry: 300,
  sessionDuration: 86400
});

// Start authentication for a user
await client.startAuth('npub1...');

// Listen for state changes
client.onStateChange((state) => {
  switch (state.step) {
    case 'WAITING_FOR_MAGIC_LINK':
      console.log('Please check your Nostr client for the magic link');
      break;
    case 'STARTING_WEBAUTHN':
      console.log('Please complete biometric verification');
      break;
    case 'COMPLETED':
      console.log('Authentication successful!');
      break;
  }
});
```

### Settings Management

```typescript
import { SettingsManager } from 'nostr-biometric-auth-utils';

const settings = new SettingsManager(nostrService, userPubkey);

// Load user settings
const currentSettings = await settings.loadSettings();

// Update settings
await settings.updateSettings({
  biometricEnabled: true,
  sessionDuration: 3600
});
```

## Architecture

The library is organized into several core modules:

```
nostr-biometric-auth-utils/
├── src/
│   ├── client/          # Main client-side authentication flow
│   │   └── index.ts     # NostrBiometricClient implementation
│   ├── core/            # Core authentication implementations
│   │   ├── webauthn.ts  # WebAuthn registration & verification
│   │   ├── touchid.ts   # TouchID/FaceID integration
│   │   └── security-key.ts  # Hardware security key support
│   ├── settings/        # Nostr-based settings management
│   │   └── index.ts     # SettingsManager for DM-based config
│   └── utils/           # Helper functions
│       └── nostr.ts     # Nostr entity encoding/decoding (NIP-19)
```

### Authentication Flow

```
1. User provides their npub
         │
         v
2. Magic link sent via Nostr DM
         │
         v
3. User clicks magic link
         │
         v
4. WebAuthn biometric challenge
   (TouchID / FaceID / Windows Hello / Security Key)
         │
         v
5. Session established
```

The flow combines Nostr's cryptographic identity with WebAuthn biometrics for two-factor authentication. The magic link verifies the user controls the Nostr key, and biometrics verify the user is physically present.

## API Reference

### NostrBiometricClient

The main client for managing the authentication flow.

```typescript
const client = new NostrBiometricClient(options: ClientOptions);
```

| Option | Type | Description |
|--------|------|-------------|
| `relays` | `string[]` | Nostr relay URLs to connect to |
| `magicLinkExpiry` | `number` | Magic link expiry in seconds (default: 300) |
| `sessionDuration` | `number` | Session duration in seconds (default: 86400) |

#### Methods

- `startAuth(npub: string)` — Begins the authentication flow for a given npub
- `onStateChange(callback)` — Registers a callback for auth state transitions
- `cancelAuth()` — Cancels an in-progress authentication

### SettingsManager

Manages user settings stored via Nostr direct messages.

```typescript
const settings = new SettingsManager(nostrService, userPubkey);
```

#### Methods

- `loadSettings()` — Loads the user's current settings
- `updateSettings(settings)` — Updates and persists settings
- `resetSettings()` — Resets settings to defaults

### WebAuthn Utilities

Low-level WebAuthn functions for custom flows.

```typescript
import { registerCredential, verifyCredential } from 'nostr-biometric-auth-utils';

// Register a new biometric credential
const credential = await registerCredential({
  rpName: 'Your App',
  rpId: 'your-app.com',
  userId: npub,
  userName: displayName,
});

// Verify a credential during authentication
const result = await verifyCredential({
  credentialId: credential.id,
  challenge: serverChallenge,
});
```

## Security Considerations

### Biometric Data Privacy

- All biometric data remains on the user's device — it is never transmitted to servers
- The WebAuthn protocol only exchanges cryptographic proofs, not biometric templates
- Implements FIDO2 WebAuthn specifications for maximum interoperability

### Key Management

- Nostr private keys are never handled by this library
- Magic link signing uses nostr-crypto-utils for NIP-compliant operations
- WebAuthn credentials are bound to the origin (domain) and cannot be phished

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Stolen npub | Magic link requires access to Nostr DMs |
| Compromised relay | Multi-relay support with verification |
| Phishing | WebAuthn origin binding prevents cross-site use |
| Session hijacking | Configurable session expiry with biometric re-auth |

### Best Practices

1. Always use multiple relays for magic link delivery
2. Set appropriate expiry times for magic links (5-15 minutes)
3. Implement session refresh with biometric re-verification
4. Monitor failed authentication attempts
5. Use HTTPS in production for WebAuthn origin verification

## Examples

See the `examples/` directory for complete working examples:

- `examples/proof_of_concept/` — Minimal Express.js server with WebAuthn flow

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [nostr-crypto-utils](https://github.com/HumanjavaEnterprises/nostr-crypto-utils) — Core cryptographic utilities for Nostr
- [nostr-dm-magiclink-utils](https://github.com/HumanjavaEnterprises/nostr-dm-magiclink-utils) — Magic link authentication via Nostr DMs
- [nostr-auth-middleware](https://github.com/HumanjavaEnterprises/nostr-auth-middleware) — Authentication middleware for Nostr apps
