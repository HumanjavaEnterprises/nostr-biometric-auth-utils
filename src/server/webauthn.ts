/**
 * Server-side WebAuthn implementation
 *
 * Uses @simplewebauthn/server for full WebAuthn verification including:
 * - clientDataJSON.type validation ('webauthn.create' / 'webauthn.get')
 * - origin verification
 * - rpIdHash verification
 * - authenticator cryptographic signature verification
 * - sign counter checking for clone detection
 */
import type { WebAuthnOptions, StoredCredential } from '../types/auth';
import { generateRandomString } from '../utils';
import {
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';

export class WebAuthnServer {
  private options: WebAuthnOptions;
  private challenges: Map<string, { challenge: string; timestamp: number }>;
  private credentials: Map<string, StoredCredential[]>;

  constructor(options: WebAuthnOptions) {
    if (!options.rpId) {
      throw new Error('WebAuthnServer requires rpId to be set');
    }
    if (!options.origin) {
      throw new Error('WebAuthnServer requires origin to be set for verification');
    }
    this.options = options;
    this.challenges = new Map();
    this.credentials = new Map();
  }

  /**
   * Generate a new challenge for registration
   * @param userId The user's ID (pubkey)
   */
  generateRegistrationChallenge(userId: string): string {
    // Check if user already has credentials
    if (this.credentials.has(userId)) {
      throw new Error('User already has registered credentials. Please use authentication instead.');
    }

    const challenge = generateRandomString(32);
    this.challenges.set(userId, {
      challenge,
      timestamp: Date.now()
    });
    return challenge;
  }

  /**
   * Generate a new challenge for authentication
   * @param userId The user's ID (pubkey)
   */
  generateAuthenticationChallenge(userId: string): string {
    // Check if user has registered
    if (!this.credentials.has(userId)) {
      throw new Error('No registered credentials found. Please register first.');
    }

    const challenge = generateRandomString(32);
    this.challenges.set(userId, {
      challenge,
      timestamp: Date.now()
    });
    return challenge;
  }

  /**
   * Verify a WebAuthn registration response.
   *
   * Validates:
   * - clientDataJSON.type === 'webauthn.create'
   * - clientDataJSON.origin matches expected origin
   * - clientDataJSON.challenge matches the issued challenge (constant-time)
   * - rpIdHash matches SHA-256 of the configured RP ID
   * - Authenticator flags (user presence, user verification if required)
   * - Attestation statement (if present)
   *
   * On success, stores the extracted credential public key and counter
   * for future authentication verification.
   *
   * @param userId The user's ID (pubkey)
   * @param credential The RegistrationResponseJSON from the client
   */
  async verifyRegistration(userId: string, credential: RegistrationResponseJSON): Promise<boolean> {
    // Check if user already has credentials
    if (this.credentials.has(userId)) {
      throw new Error('User already has registered credentials. Please use authentication instead.');
    }

    const expectedChallenge = this.challenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    // Remove the challenge (single-use)
    this.challenges.delete(userId);

    // Check if challenge has expired (5 minutes)
    if (Date.now() - expectedChallenge.timestamp > 5 * 60 * 1000) {
      throw new Error('Challenge has expired');
    }

    try {
      // Use @simplewebauthn/server for full verification.
      // This validates: type, origin, rpIdHash, challenge, attestation, flags.
      const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: expectedChallenge.challenge,
        expectedOrigin: Array.isArray(this.options.origin) ? this.options.origin : [this.options.origin],
        expectedRPID: this.options.rpId,
        requireUserVerification: this.options.userVerification === 'required',
      });

      const { verified, registrationInfo } = verification;

      if (verified && registrationInfo) {
        // Store the credential with its public key for future authentication
        const storedCredential: StoredCredential = {
          credentialID: Buffer.from(registrationInfo.credentialID).toString('base64url'),
          credentialPublicKey: Buffer.from(registrationInfo.credentialPublicKey).toString('base64url'),
          counter: registrationInfo.counter,
          credentialBackedUp: registrationInfo.credentialBackedUp,
          credentialDeviceType: registrationInfo.credentialDeviceType,
          transports: credential.response.transports as AuthenticatorTransportFuture[] | undefined,
        };

        this.credentials.set(userId, [storedCredential]);
      }

      return verified;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to verify registration: ${message}`);
    }
  }

  /**
   * Verify a WebAuthn authentication response.
   *
   * Validates:
   * - clientDataJSON.type === 'webauthn.get'
   * - clientDataJSON.origin matches expected origin
   * - clientDataJSON.challenge matches the issued challenge (constant-time)
   * - rpIdHash matches SHA-256 of the configured RP ID
   * - Authenticator signature against the stored credential public key
   * - Sign counter to detect cloned authenticators
   *
   * @param userId The user's ID (pubkey)
   * @param credential The AuthenticationResponseJSON from the client
   */
  async verifyAuthentication(userId: string, credential: AuthenticationResponseJSON): Promise<boolean> {
    // Check if user has registered
    const storedCredentials = this.credentials.get(userId);
    if (!storedCredentials || storedCredentials.length === 0) {
      throw new Error('No registered credentials found. Please register first.');
    }

    const expectedChallenge = this.challenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    // Remove the challenge (single-use)
    this.challenges.delete(userId);

    // Check if challenge has expired (5 minutes)
    if (Date.now() - expectedChallenge.timestamp > 5 * 60 * 1000) {
      throw new Error('Challenge has expired');
    }

    // Find the matching stored credential by credential ID
    const matchingCredential = storedCredentials.find(
      (cred) => cred.credentialID === credential.id
    );

    if (!matchingCredential) {
      throw new Error('Credential not found for this user');
    }

    try {
      // Use @simplewebauthn/server for full verification.
      // This validates: type, origin, rpIdHash, challenge, signature, counter.
      const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: expectedChallenge.challenge,
        expectedOrigin: Array.isArray(this.options.origin) ? this.options.origin : [this.options.origin],
        expectedRPID: this.options.rpId,
        authenticator: {
          credentialID: Buffer.from(matchingCredential.credentialID, 'base64url'),
          credentialPublicKey: Buffer.from(matchingCredential.credentialPublicKey, 'base64url'),
          counter: matchingCredential.counter,
          transports: matchingCredential.transports as AuthenticatorTransportFuture[] | undefined,
        },
        requireUserVerification: this.options.userVerification === 'required',
      });

      const { verified, authenticationInfo } = verification;

      if (verified) {
        // Update the sign counter to detect cloned authenticators.
        // If the new counter is not greater than the stored counter (and not zero),
        // it may indicate a cloned authenticator. @simplewebauthn/server handles
        // this check internally and will throw if the counter is suspicious.
        matchingCredential.counter = authenticationInfo.newCounter;
      }

      return verified;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to verify authentication: ${message}`);
    }
  }

  /**
   * Get stored credentials for a user (useful for generating authentication options)
   * @param userId The user's ID (pubkey)
   */
  getCredentials(userId: string): StoredCredential[] | undefined {
    return this.credentials.get(userId);
  }

  /**
   * Remove all credentials for a user
   * @param userId The user's ID (pubkey)
   */
  removeCredentials(userId: string): boolean {
    return this.credentials.delete(userId);
  }
}
