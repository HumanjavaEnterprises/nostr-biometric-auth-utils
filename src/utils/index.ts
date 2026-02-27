/**
 * Shared utilities for nostr-biometric-login-service
 */

import { bech32 } from '@scure/base';

/**
 * Convert npub to hex public key
 * @param npub The npub to convert
 */
export function npubToHex(npub: string): string {
  try {
    if (!npub.startsWith('npub1')) {
      throw new Error('Invalid npub: must start with npub1');
    }
    // Decode the full bech32 string directly — npub1... is already valid bech32
    // with 'npub' as the human-readable part and '1' as the separator
    const decoded = bech32.decode(npub as `npub1${string}`, 1500);
    const pubkeyBytes = bech32.fromWords(decoded.words);
    return Buffer.from(pubkeyBytes).toString('hex');
  } catch (error) {
    throw new Error('Invalid npub format');
  }
}

/**
 * Convert hex public key to npub
 * @param hex The hex public key to convert
 */
export function hexToNpub(hex: string): string {
  try {
    const bytes = Buffer.from(hex, 'hex');
    const words = bech32.toWords(bytes);
    // HRP is 'npub' — bech32.encode adds the '1' separator automatically
    return bech32.encode('npub', words, 1500);
  } catch (error) {
    throw new Error('Invalid hex format');
  }
}

/**
 * Generate a random string of specified length
 * @param length Length of the random string
 */
export function generateRandomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString('hex');
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/**
 * Set a cookie in the browser
 *
 * NOTE: HttpOnly cannot be set via document.cookie — it can only be set via
 * a server-side Set-Cookie header. Session cookies should be set server-side
 * with the HttpOnly flag to prevent client-side script access.
 *
 * @param name Cookie name
 * @param value Cookie value
 * @param days Days until expiry
 */
export function setCookie(name: string, value: string, days: number): void {
  if (!isBrowser()) return;

  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict;Secure`;
}

/**
 * Get a cookie value
 * @param name Cookie name
 */
export function getCookie(name: string): string | null {
  if (!isBrowser()) return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}
