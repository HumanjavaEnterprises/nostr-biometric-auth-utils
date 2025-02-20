# Nostr Biometric Authentication Utilities

A comprehensive utility library for implementing biometric authentication in Nostr applications using WebAuthn. This library provides a flexible set of tools for adding secure biometric authentication to your Nostr-based applications.

## Features

- **WebAuthn Integration**: Ready-to-use utilities for implementing WebAuthn-based biometric authentication
- **Platform Support**: 
  - TouchID/FaceID for iOS and macOS
  - Windows Hello
  - Android biometric authentication
  - Security Key support
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

## Usage

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

- **Client**: Main client-side implementation for managing authentication flow
- **Core**: 
  - WebAuthn implementation
  - TouchID/FaceID integration
  - Security key support
- **Settings**: Nostr-based settings management
- **Utils**: Helper functions for Nostr entity handling

## Security Considerations

- All biometric data remains on the user's device
- Implements FIDO2 WebAuthn specifications
- Follows security best practices for key management
- Proper error handling for all security-critical operations

## Contributing

Contributions are welcome! Please read our contributing guidelines for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Related Projects

- [nostr-dm-magiclink-utils](https://github.com/HumanjavaEnterprises/nostr-dm-magiclink-utils)
- [MaiQR Platform](https://github.com/HumanjavaEnterprises/MaiQR-Platform)
