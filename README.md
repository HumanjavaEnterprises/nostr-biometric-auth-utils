# Nostr Biometric Login Service

A service that enables biometric step-up authentication for Nostr applications using WebAuthn.

## Features

- WebAuthn-based biometric authentication
- Support for multiple domains (localhost, .local domains, IP addresses)
- Implementations in both TypeScript (Fastify) and JavaScript (Express)
- Full NIP-19 compliance for Nostr entity encoding/decoding
- Nostr profile fetching from multiple relays
- Comprehensive error handling for all operations
- Example implementations with both Fastify and Express

## Technical Details

### Nostr Integration

The service implements full NIP-19 support for bech32-encoded entities:
- Automatic conversion between npub and hex formats
- Type-safe handling of all NIP-19 entity types
- Profile fetching from multiple Nostr relays
- Comprehensive error handling for malformed inputs
- Strong TypeScript types for all Nostr-related data structures

### Type Safety

The project emphasizes type safety through:
- Strict TypeScript configuration in the Fastify example
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
│   ├── fastify-typescript/ # Fastify server example with TypeScript
│   └── express-javascript/ # Express server example with JavaScript
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

### Running the Examples

#### Fastify TypeScript Example

1. Navigate to the Fastify example:
   ```bash
   cd examples/fastify-typescript
   npm install
   ```
2. Add the following entries to your `/etc/hosts` file:
   ```
   127.0.0.1 localhost
   127.0.0.1 nostr-auth.localhost
   ```
3. Start the server:
   ```bash
   npm run dev
   ```
4. Visit https://nostr-auth.localhost:3000 in your browser

#### Express JavaScript Example

1. Navigate to the Express example:
   ```bash
   cd examples/express-javascript
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
3. Visit http://localhost:3000 in your browser

### Example Features

Both examples demonstrate:
- WebAuthn registration and authentication
- Nostr profile fetching from relays
- NIP-19 npub handling
- Biometric authentication flow

Key differences:
- Fastify example uses TypeScript for enhanced type safety
- Express example uses JavaScript for simplicity
- Fastify example supports multiple domains
- Express example focuses on localhost development

## Development

The Fastify example server supports multiple ways to access it:
- https://nostr-auth.localhost:3000 (recommended for development)
- https://your-hostname.local:3000 (for local network access)
- https://your-ip-address:3000 (for local network access)

The Express example is configured for localhost development:
- http://localhost:3000 (default development setup)

Note: When accessing via IP address or hostname in the Fastify example, the WebAuthn implementation will use 'localhost' as the relying party ID for security reasons.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

For security concerns, please read our [SECURITY.md](SECURITY.md) document.
