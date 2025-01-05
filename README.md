# Nostr Biometric Login Service

A service that enables biometric step-up authentication for Nostr applications using WebAuthn.

## Features

- WebAuthn-based biometric authentication
- Support for multiple domains (localhost, .local domains, IP addresses)
- TypeScript implementation with strict type safety
- Example Fastify server implementation
- Full NIP-19 compliance for Nostr entity encoding/decoding
- Comprehensive error handling for all Nostr operations

## Technical Details

### Nostr Integration

The service implements full NIP-19 support for bech32-encoded entities:
- Automatic conversion between npub and hex formats
- Type-safe handling of all NIP-19 entity types
- Comprehensive error handling for malformed inputs
- Strong TypeScript types for all Nostr-related data structures

### Type Safety

The project emphasizes type safety through:
- Strict TypeScript configuration
- Comprehensive type definitions for all Nostr entities
- Type guards for runtime validation
- Proper error handling with typed error responses

## Project Structure

```
.
├── src/                    # Core library source code
│   ├── client/            # Client-side implementation
│   ├── server/            # Server-side implementation
│   └── types/             # TypeScript type definitions
├── examples/              # Example implementations
│   └── fastify-typescript/ # Fastify server example
└── proof-of-concept/      # Initial POC implementation
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm (v7 or later)

### Installation

```bash
npm install
```

### Running the Example

1. Clone the repository
2. Install dependencies:
   ```bash
   cd examples/fastify-typescript
   npm install
   ```
3. Add the following entries to your `/etc/hosts` file:
   ```
   127.0.0.1 localhost
   127.0.0.1 nostr-auth.localhost
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
5. Visit https://nostr-auth.localhost:3000 in your browser

## Development

The example server supports multiple ways to access it:
- https://nostr-auth.localhost:3000 (recommended for development)
- https://your-hostname.local:3000 (for local network access)
- https://your-ip-address:3000 (for local network access)

Note: When accessing via IP address or hostname, the WebAuthn implementation will use 'localhost' as the relying party ID for security reasons.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security concerns, please read our [SECURITY.md](SECURITY.md) document.
