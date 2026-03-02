import { nip44 } from 'nostr-crypto-utils';
import { hexToBytes } from 'nostr-crypto-utils';
import type { NostrService, NostrEvent, EncryptionVersion } from '../types/nostr';
import type { Settings } from '../types/settings';

/**
 * Options for SettingsManager construction.
 */
export interface SettingsManagerOptions {
  /** The NostrService implementation for sending/querying DMs */
  nostrService: NostrService;
  /** The user's hex-encoded public key */
  userPubkey: string;
  /**
   * The user's hex-encoded private key.
   * Required when encryptionVersion is 'nip44' for deriving conversation keys.
   * When using 'nip04', the consuming application handles encryption in sendDirectMessage.
   */
  privateKey?: string;
  /**
   * Encryption version to use for settings DMs.
   * - 'nip04': Legacy NIP-04 encryption (default). Encryption is handled by the
   *   consuming application's NostrService.sendDirectMessage implementation.
   * - 'nip44': Modern NIP-44 encryption. SettingsManager encrypts/decrypts content
   *   directly using the provided privateKey before passing to NostrService.
   */
  encryptionVersion?: EncryptionVersion;
}

export class SettingsManager {
  private nostrService: NostrService;
  private userPubkey: string;
  private privateKey: string | undefined;
  private encryptionVersion: EncryptionVersion;
  private cachedSettings: Settings | null = null;

  constructor(options: SettingsManagerOptions);
  /**
   * @deprecated Use the options object constructor instead.
   * Retained for backward compatibility.
   */
  constructor(nostrService: NostrService, userPubkey: string);
  constructor(
    optionsOrService: SettingsManagerOptions | NostrService,
    userPubkey?: string
  ) {
    if (userPubkey !== undefined) {
      // Legacy two-argument constructor
      this.nostrService = optionsOrService as NostrService;
      this.userPubkey = userPubkey;
      this.encryptionVersion = 'nip04';
    } else {
      const opts = optionsOrService as SettingsManagerOptions;
      this.nostrService = opts.nostrService;
      this.userPubkey = opts.userPubkey;
      this.privateKey = opts.privateKey;
      this.encryptionVersion = opts.encryptionVersion ?? 'nip04';

      if (this.encryptionVersion === 'nip44' && !this.privateKey) {
        throw new Error(
          'privateKey is required when using NIP-44 encryption'
        );
      }
    }
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): Settings {
    return {
      npub: '',
      relays: ['wss://relay.damus.io', 'wss://relay.nostr.band'],
      magicLinkExpiry: 300, // 5 minutes
      biometricEnabled: false,
      sessionDuration: 86400 // 24 hours
    };
  }

  /**
   * Encrypt content using NIP-44.
   * @param plaintext - The plaintext content to encrypt
   * @returns Base64-encoded NIP-44 encrypted payload
   */
  private encryptNip44(plaintext: string): string {
    if (!this.privateKey) {
      throw new Error('privateKey is required for NIP-44 encryption');
    }
    const privkeyBytes = hexToBytes(this.privateKey);
    const conversationKey = nip44.getConversationKey(privkeyBytes, this.userPubkey);
    return nip44.encrypt(plaintext, conversationKey);
  }

  /**
   * Decrypt content using NIP-44.
   * @param payload - Base64-encoded NIP-44 encrypted payload
   * @returns Decrypted plaintext string
   */
  private decryptNip44(payload: string): string {
    if (!this.privateKey) {
      throw new Error('privateKey is required for NIP-44 decryption');
    }
    const privkeyBytes = hexToBytes(this.privateKey);
    const conversationKey = nip44.getConversationKey(privkeyBytes, this.userPubkey);
    return nip44.decrypt(payload, conversationKey);
  }

  /**
   * Attempt to decrypt event content, trying NIP-44 first if configured,
   * then falling back to treating content as plaintext JSON (for NIP-04,
   * where the NostrService handles decryption before returning events).
   */
  private decryptContent(event: NostrEvent): string {
    if (this.encryptionVersion === 'nip44' && this.privateKey) {
      try {
        return this.decryptNip44(event.content);
      } catch {
        // Fall through to try as plain JSON (may be a legacy NIP-04 event
        // already decrypted by the NostrService)
      }
    }
    return event.content;
  }

  /**
   * Get settings from Nostr DMs
   */
  private async getSettingsFromDMs(): Promise<Settings | null> {
    try {
      // Get events and filter for DMs
      const events = await this.nostrService.queryEvents({
        authors: [this.userPubkey],
        kinds: [4], // kind 4 is for encrypted direct messages
        limit: 100
      });

      // Filter for settings DMs
      const settingsDMs = events.filter((event: NostrEvent) => {
        try {
          const decrypted = this.decryptContent(event);
          const content = JSON.parse(decrypted);
          return content.type === 'settings';
        } catch {
          return false;
        }
      }).sort((a, b) => b.created_at - a.created_at);

      if (settingsDMs.length === 0) {
        return null;
      }

      // Get latest settings
      const decrypted = this.decryptContent(settingsDMs[0]);
      const latestSettings = JSON.parse(decrypted);
      return latestSettings.data;
    } catch (error) {
      console.error('Error getting settings from DMs:', error);
      return null;
    }
  }

  /**
   * Load settings
   */
  async loadSettings(): Promise<Settings> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    const settingsFromDMs = await this.getSettingsFromDMs();
    if (settingsFromDMs) {
      this.cachedSettings = settingsFromDMs;
      return this.cachedSettings;
    }

    this.cachedSettings = this.getDefaultSettings();
    return this.cachedSettings;
  }

  /**
   * Save settings to DM.
   * When using NIP-44, content is encrypted before passing to NostrService.
   * When using NIP-04, content is passed as plaintext JSON and the
   * NostrService.sendDirectMessage implementation handles encryption.
   */
  async saveSettings(settings: Settings): Promise<void> {
    const message = {
      type: 'settings',
      data: settings,
      timestamp: Date.now()
    };

    let content = JSON.stringify(message);

    if (this.encryptionVersion === 'nip44') {
      content = this.encryptNip44(content);
    }

    await this.nostrService.sendDirectMessage(this.userPubkey, content);
    this.cachedSettings = settings;
  }

  /**
   * Update specific settings
   */
  async updateSettings(updates: Partial<Settings>): Promise<Settings> {
    const current = await this.loadSettings();
    const updated = { ...current, ...updates };
    await this.saveSettings(updated);
    return updated;
  }

  /**
   * Get the current encryption version
   */
  getEncryptionVersion(): EncryptionVersion {
    return this.encryptionVersion;
  }
}
