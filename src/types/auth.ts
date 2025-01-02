/**
 * Core authentication types for the nostr-biometric-login-service
 */

export interface AuthenticationOptions {
  /** List of Nostr relay URLs to connect to */
  relays: string[];
  /** Duration in seconds for magic link validity */
  magicLinkExpiry: number;
  /** Duration in seconds for session validity */
  sessionDuration: number;
  /** Optional configuration for WebAuthn */
  webAuthn?: WebAuthnOptions;
}

export interface WebAuthnOptions {
  /** Relying Party ID (usually your domain) */
  rpId: string;
  /** Relying Party name (displayed to user) */
  rpName: string;
  /** User verification requirement */
  userVerification?: UserVerificationRequirement;
  /** Timeout in milliseconds */
  timeout?: number;
}

export interface AuthenticationState {
  /** Current step in the authentication process */
  step: AuthenticationStep;
  /** Any error that occurred during authentication */
  error?: string;
  /** Session token if authentication is complete */
  sessionToken?: string;
  /** Timestamp when the session expires */
  sessionExpiry?: number;
}

export enum AuthenticationStep {
  /** Initial state */
  IDLE = 'IDLE',
  /** Sending magic link */
  SENDING_MAGIC_LINK = 'SENDING_MAGIC_LINK',
  /** Waiting for magic link click */
  WAITING_FOR_MAGIC_LINK = 'WAITING_FOR_MAGIC_LINK',
  /** Magic link verified, starting WebAuthn */
  STARTING_WEBAUTHN = 'STARTING_WEBAUTHN',
  /** WebAuthn in progress */
  WEBAUTHN_IN_PROGRESS = 'WEBAUTHN_IN_PROGRESS',
  /** Authentication complete */
  COMPLETE = 'COMPLETE',
  /** Authentication failed */
  FAILED = 'FAILED'
}

export type UserVerificationRequirement = 'required' | 'preferred' | 'discouraged';

export interface MagicLinkPayload {
  /** Timestamp when the magic link was created */
  createdAt: number;
  /** Timestamp when the magic link expires */
  expiresAt: number;
  /** Random token for verification */
  token: string;
  /** Public key of the user */
  pubkey: string;
}

export interface SessionToken {
  /** The actual session token */
  token: string;
  /** Timestamp when the session expires */
  expiresAt: number;
  /** Public key of the authenticated user */
  pubkey: string;
}
