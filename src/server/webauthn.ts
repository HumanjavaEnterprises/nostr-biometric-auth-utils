/**
 * Server-side WebAuthn implementation
 */
import type { WebAuthnOptions } from '../types/auth';
import { generateRandomString } from '../utils';

export class WebAuthnServer {
  private options: WebAuthnOptions;
  private challenges: Map<string, { challenge: string; timestamp: number }>;

  constructor(options: WebAuthnOptions) {
    this.options = options;
    this.challenges = new Map();
  }

  /**
   * Generate a new challenge for registration
   * @param userId The user's ID (pubkey)
   */
  generateRegistrationChallenge(userId: string): string {
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
    const challenge = generateRandomString(32);
    this.challenges.set(userId, {
      challenge,
      timestamp: Date.now()
    });
    return challenge;
  }

  /**
   * Verify a WebAuthn registration response
   * @param userId The user's ID (pubkey)
   * @param credential The credential from the client
   */
  async verifyRegistration(userId: string, credential: any): Promise<boolean> {
    const expectedChallenge = this.challenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    // Remove the challenge
    this.challenges.delete(userId);

    // Check if challenge has expired (5 minutes)
    if (Date.now() - expectedChallenge.timestamp > 5 * 60 * 1000) {
      throw new Error('Challenge has expired');
    }

    try {
      // TODO: Implement actual credential verification
      // For now, we'll just verify the challenge matches
      const clientDataJSON = JSON.parse(
        Buffer.from(credential.response.clientDataJSON, 'base64').toString()
      );

      return clientDataJSON.challenge === expectedChallenge.challenge;
    } catch (error) {
      throw new Error('Failed to verify registration');
    }
  }

  /**
   * Verify a WebAuthn authentication response
   * @param userId The user's ID (pubkey)
   * @param credential The credential from the client
   */
  async verifyAuthentication(userId: string, credential: any): Promise<boolean> {
    const expectedChallenge = this.challenges.get(userId);
    if (!expectedChallenge) {
      throw new Error('No challenge found for user');
    }

    // Remove the challenge
    this.challenges.delete(userId);

    // Check if challenge has expired (5 minutes)
    if (Date.now() - expectedChallenge.timestamp > 5 * 60 * 1000) {
      throw new Error('Challenge has expired');
    }

    try {
      // TODO: Implement actual credential verification
      // For now, we'll just verify the challenge matches
      const clientDataJSON = JSON.parse(
        Buffer.from(credential.response.clientDataJSON, 'base64').toString()
      );

      return clientDataJSON.challenge === expectedChallenge.challenge;
    } catch (error) {
      throw new Error('Failed to verify authentication');
    }
  }
}
