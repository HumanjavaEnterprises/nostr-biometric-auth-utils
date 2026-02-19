# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
