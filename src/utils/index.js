/**
 * Browser-compatible utilities for nostr-biometric-login-service
 */

import { bech32 } from 'https://bundle.run/@scure/base';

/**
 * Convert npub to hex public key
 * @param {string} npub The npub to convert
 */
export function npubToHex(npub) {
  try {
    const { words } = bech32.decode(npub);
    const pubkeyWords = words.slice(0);
    const pubkeyBytes = bech32.fromWords(pubkeyWords);
    return Array.from(pubkeyBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (error) {
    throw new Error('Invalid npub format');
  }
}

/**
 * Convert hex public key to npub
 * @param {string} hex The hex public key to convert
 */
export function hexToNpub(hex) {
  try {
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
    );
    const words = bech32.toWords(bytes);
    return bech32.encode('npub', words);
  } catch (error) {
    throw new Error('Invalid hex format');
  }
}

/**
 * Generate a random string of specified length
 * @param {number} length Length of the random string
 */
export function generateRandomString(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Check if running in browser environment
 */
export function isBrowser() {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}
