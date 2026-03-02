/**
 * Settings types for the nostr-biometric-login-service
 */

import type { EncryptionVersion } from './nostr';

export interface Settings {
  npub: string;
  relays: string[];
  magicLinkExpiry: number;
  biometricEnabled: boolean;
  sessionDuration: number;
  lastLogin?: number;
  /** Encryption version used for settings DMs. Defaults to 'nip04'. */
  encryptionVersion?: EncryptionVersion;
}

export interface SettingsUpdate {
  npub?: string;
  relays?: string[];
  magicLinkExpiry?: number;
  biometricEnabled?: boolean;
  sessionDuration?: number;
  encryptionVersion?: EncryptionVersion;
}

export interface SessionState {
  isAuthenticated: boolean;
  sessionToken?: string;
  expiresAt?: number;
  error?: string;
}

export interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error?: string;
}
