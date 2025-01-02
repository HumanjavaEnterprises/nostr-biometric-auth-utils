/**
 * Client-side implementation of nostr-biometric-login
 */

import type { 
  AuthenticationOptions, 
  AuthenticationState, 
  AuthenticationStep,
  SessionToken
} from '../types/auth';

export class NostrBiometricClient {
  private options: AuthenticationOptions;
  private state: AuthenticationState;

  constructor(options: AuthenticationOptions) {
    this.options = options;
    this.state = {
      step: AuthenticationStep.IDLE
    };
  }

  /**
   * Start the authentication process for a given npub
   * @param npub The user's npub to authenticate
   */
  async startAuth(npub: string): Promise<void> {
    try {
      this.setState({ step: AuthenticationStep.SENDING_MAGIC_LINK });
      // TODO: Implement magic link request
      
      this.setState({ step: AuthenticationStep.WAITING_FOR_MAGIC_LINK });
      // TODO: Implement magic link verification

      this.setState({ step: AuthenticationStep.STARTING_WEBAUTHN });
      // TODO: Implement WebAuthn
      
    } catch (error) {
      this.setState({ 
        step: AuthenticationStep.FAILED,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Get the current authentication state
   */
  getState(): AuthenticationState {
    return this.state;
  }

  private setState(update: Partial<AuthenticationState>) {
    this.state = { ...this.state, ...update };
  }
}

export type { 
  AuthenticationOptions,
  AuthenticationState,
  AuthenticationStep,
  SessionToken
};
