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
    const { words } = bech32.decode(npub);
    const pubkeyWords = words.slice(0);
    const pubkeyBytes = bech32.fromWords(pubkeyWords);
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
    return bech32.encode('npub', words);
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
 * @param name Cookie name
 * @param value Cookie value
 * @param days Days until expiry
 */
export function setCookie(name: string, value: string, days: number): void {
  if (!isBrowser()) return;
  
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
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
