/**
 * Client-side WebAuthn implementation
 */
class WebAuthnClient {
  constructor(options) {
    this.rpName = options.rpName;
    this.rpId = options.rpId;
  }

  /**
   * Check if WebAuthn is supported in this browser
   */
  isSupported() {
    return window.PublicKeyCredential !== undefined;
  }

  /**
   * Check if the device supports biometric authentication
   */
  async isAvailable() {
    if (!this.isSupported()) {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }

  /**
   * Register a new WebAuthn credential
   * @param {string} challenge The challenge from the server
   * @param {string} userId The user's ID
   * @param {string} username The user's display name
   */
  async register(challenge, userId, username) {
    const publicKeyCredentialCreationOptions = {
      challenge: this._base64ToArrayBuffer(challenge),
      rp: {
        name: this.rpName,
        id: this.rpId
      },
      user: {
        id: new TextEncoder().encode(userId),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },
        { alg: -257, type: "public-key" }
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        requireResidentKey: false,
        userVerification: "preferred"
      },
      timeout: 60000,
      attestation: "none"
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      });

      return {
        id: credential.id,
        type: credential.type,
        rawId: this._arrayBufferToBase64(credential.rawId),
        response: {
          attestationObject: this._arrayBufferToBase64(
            credential.response.attestationObject
          ),
          clientDataJSON: this._arrayBufferToBase64(
            credential.response.clientDataJSON
          )
        }
      };
    } catch (error) {
      console.error("Error creating credential:", error);
      throw error;
    }
  }

  /**
   * Start WebAuthn authentication
   * @param {string} challenge The challenge from the server
   */
  async authenticate(challenge) {
    const publicKeyCredentialRequestOptions = {
      challenge: this._base64ToArrayBuffer(challenge),
      rpId: this.rpId,
      timeout: 60000,
      userVerification: "preferred"
    };

    try {
      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      });

      return {
        id: assertion.id,
        type: assertion.type,
        rawId: this._arrayBufferToBase64(assertion.rawId),
        response: {
          authenticatorData: this._arrayBufferToBase64(
            assertion.response.authenticatorData
          ),
          clientDataJSON: this._arrayBufferToBase64(
            assertion.response.clientDataJSON
          ),
          signature: this._arrayBufferToBase64(assertion.response.signature),
          userHandle: this._arrayBufferToBase64(assertion.response.userHandle)
        }
      };
    } catch (error) {
      console.error("Error getting assertion:", error);
      throw error;
    }
  }

  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  _base64ToArrayBuffer(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
