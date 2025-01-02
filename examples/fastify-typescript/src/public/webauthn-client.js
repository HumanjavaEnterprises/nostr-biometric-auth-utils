/**
 * Client-side WebAuthn implementation
 */
export class WebAuthnClient {
  constructor(options) {
    this.options = options;
  }

  /**
   * Check if WebAuthn is supported in this browser
   */
  static isSupported() {
    return window && 
           window.PublicKeyCredential !== undefined && 
           typeof window.PublicKeyCredential === 'function';
  }

  /**
   * Check if the device supports biometric authentication
   */
  static async isAvailable() {
    if (!this.isSupported()) return false;

    // Check if platform authenticator is available
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }

  /**
   * Start WebAuthn authentication
   * @param challenge The challenge from the server
   */
  async authenticate(challenge) {
    if (!WebAuthnClient.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const publicKey = {
      challenge: this.base64ToBuffer(challenge),
      timeout: this.options.timeout || 60000,
      userVerification: this.options.userVerification || 'preferred',
      rpId: this.options.rpId,
    };

    try {
      const credential = await navigator.credentials.get({
        publicKey
      });

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
   * @param userId The user's ID
   * @param userName The user's display name
   */
  async register(challenge, userId, userName) {
    if (!WebAuthnClient.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const publicKey = {
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
      });

      return this.serializeCredential(credential);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new Error('User declined to register biometric authentication');
      }
      throw error;
    }
  }

  serializeCredential(credential) {
    const response = credential.response;
    
    return {
      id: credential.id,
      type: credential.type,
      rawId: this.bufferToBase64(credential.rawId),
      response: {
        authenticatorData: this.bufferToBase64(response.authenticatorData),
        clientDataJSON: this.bufferToBase64(response.clientDataJSON),
        signature: response.signature ? this.bufferToBase64(response.signature) : null,
        userHandle: response.userHandle ? this.bufferToBase64(response.userHandle) : null,
        attestationObject: response.attestationObject ? this.bufferToBase64(response.attestationObject) : null
      }
    };
  }

  base64ToBuffer(base64) {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  stringToBuffer(str) {
    return new TextEncoder().encode(str);
  }
}
