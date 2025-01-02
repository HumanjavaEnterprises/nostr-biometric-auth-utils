/**
 * Client-side WebAuthn implementation
 */
import type { WebAuthnOptions } from '../types/auth';

export class WebAuthnClient {
  private options: WebAuthnOptions;

  constructor(options: WebAuthnOptions) {
    this.options = options;
  }

  /**
   * Check if WebAuthn is supported in this browser
   */
  static isSupported(): boolean {
    return window && 
           window.PublicKeyCredential !== undefined && 
           typeof window.PublicKeyCredential === 'function';
  }

  /**
   * Check if the device supports biometric authentication
   */
  static async isAvailable(): Promise<boolean> {
    if (!this.isSupported()) return false;

    // Check if platform authenticator is available
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }

  /**
   * Start WebAuthn authentication
   * @param challenge The challenge from the server
   */
  async authenticate(challenge: string): Promise<any> {
    if (!WebAuthnClient.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const publicKey: PublicKeyCredentialRequestOptions = {
      challenge: this.base64ToBuffer(challenge),
      timeout: this.options.timeout || 60000,
      userVerification: this.options.userVerification || 'preferred',
      rpId: this.options.rpId,
    };

    try {
      const credential = await navigator.credentials.get({
        publicKey
      }) as PublicKeyCredential;

      return this.serializeCredential(credential);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new Error('User declined to use biometric authentication');
      }
      throw error;
    }
  }

  /**
   * Register a new WebAuthn credential
   * @param challenge The challenge from the server
   * @param userId The user's ID (we'll use their pubkey)
   * @param userName The user's display name (we'll use their npub)
   */
  async register(challenge: string, userId: string, userName: string): Promise<any> {
    if (!WebAuthnClient.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const publicKey: PublicKeyCredentialCreationOptions = {
      challenge: this.base64ToBuffer(challenge),
      rp: {
        name: this.options.rpName,
        id: this.options.rpId
      },
      user: {
        id: this.stringToBuffer(userId),
        name: userName,
        displayName: userName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 }, // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      timeout: this.options.timeout || 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: this.options.userVerification || 'preferred',
      },
      attestation: 'none'
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey
      }) as PublicKeyCredential;

      return this.serializeCredential(credential);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new Error('User declined to register biometric authentication');
      }
      throw error;
    }
  }

  private serializeCredential(credential: PublicKeyCredential): any {
    const response = credential.response as AuthenticatorAssertionResponse;
    
    return {
      id: credential.id,
      type: credential.type,
      rawId: this.bufferToBase64(credential.rawId),
      response: {
        authenticatorData: this.bufferToBase64(response.authenticatorData),
        clientDataJSON: this.bufferToBase64(response.clientDataJSON),
        signature: this.bufferToBase64(response.signature),
        userHandle: response.userHandle ? this.bufferToBase64(response.userHandle) : null
      }
    };
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private stringToBuffer(str: string): ArrayBuffer {
    return new TextEncoder().encode(str);
  }
}
