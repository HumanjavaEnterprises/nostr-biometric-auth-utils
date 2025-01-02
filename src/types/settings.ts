/**
 * Settings types for the nostr-biometric-login-service
 */

export interface Settings {
  npub: string;
  relays: string[];
  magicLinkExpiry: number;
  biometricEnabled: boolean;
  sessionDuration: number;
  lastLogin?: number;
}

export interface SettingsUpdate {
  npub?: string;
  relays?: string[];
  magicLinkExpiry?: number;
  biometricEnabled?: boolean;
  sessionDuration?: number;
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
