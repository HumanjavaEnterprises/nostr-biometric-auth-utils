# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.2] - 2026-07-17

### Fixed
- **WebAuthnClient.register() now serializes the registration (attestation) response correctly.** Previously the registration credential was serialized in the assertion shape (`authenticatorData`/`signature`/`userHandle`) and the `attestationObject` was omitted entirely, so the output could never be verified by a WebAuthn server (`verifyRegistration` always threw). `serializeCredential` now branches on the response type and emits `{ id, rawId, type, response: { attestationObject, clientDataJSON, transports } }` for registration and `{ id, rawId, type, response: { authenticatorData, clientDataJSON, signature, userHandle } }` for authentication.
- All serialized binary credential fields (`rawId`, `attestationObject`, `clientDataJSON`, `authenticatorData`, `signature`, `userHandle`) are now encoded as **base64url** (no `+`, `/`, or `=` padding) per the WebAuthn spec, matching what `@simplewebauthn/server` requires.

### Added
- Unit tests for `WebAuthnClient` credential serialization covering the registration (attestation) shape, base64url encoding, missing `getTransports()`, and the authentication (assertion) shape.

## [0.2.0] - 2026-03-06

### Changed
- **SimpleWebAuthn 13:** Upgraded from previous major version
- **Noble 2.0 migration:** `@noble/curves` ^2.0.1, `@noble/hashes` ^2.0.1
- **Vitest 4:** Upgraded test framework
- **nostr-crypto-utils** dependency upgraded to ^0.6.0
- Dropped Node.js 16 support

### Added
- NIP-44 settings encryption via nostr-crypto-utils v0.5.1

### Fixed
- Resolved TypeScript build errors for `AuthenticatorTransport` and bech32 types
- Default `userVerification` set to `required`; fixed bech32 npub encoding
- Session limits, `Secure` cookies, credential storage bounds
- Full FIDO2 WebAuthn verification implementation
- Resolved npm audit vulnerabilities

### Security
- Eliminated elliptic HIGH vulnerability by updating nostr-crypto-utils

## [0.1.1] - 2025-02-19

### Changed
- Updated dependencies and fixed TypeScript 5.9 type errors
- Refactored for npm package release
- Updated package descriptions to clarify step-up authentication use case

### Removed
- Removed deprecated test-server and proof_of_concept directories

## [0.1.0] - 2025-01-15

### Added
- Initial release
- WebAuthn-based biometric authentication for Nostr applications
- Support for TouchID/FaceID, Windows Hello, Android biometric, and security keys
- NIP-19 compliant entity encoding/decoding
- Nostr profile integration
- Settings management via Nostr direct messages
- Express.js example with WebAuthn and profile fetching
- Comprehensive TypeScript type definitions
