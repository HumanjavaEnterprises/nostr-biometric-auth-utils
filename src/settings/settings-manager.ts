import { NostrService, NostrEvent } from '../types/nostr';
import { Settings } from '../types/settings';

export class SettingsManager {
  private nostrService: NostrService;
  private userPubkey: string;
  private cachedSettings: Settings | null = null;

  constructor(nostrService: NostrService, userPubkey: string) {
    this.nostrService = nostrService;
    this.userPubkey = userPubkey;
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
          const content = JSON.parse(event.content);
          return content.type === 'settings';
        } catch {
          return false;
        }
      }).sort((a, b) => b.created_at - a.created_at);

      if (settingsDMs.length === 0) {
        return null;
      }

      // Get latest settings
      const latestSettings = JSON.parse(settingsDMs[0].content);
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
   * Save settings to DM
   */
  async saveSettings(settings: Settings): Promise<void> {
    const message = {
      type: 'settings',
      data: settings,
      timestamp: Date.now()
    };

    await this.nostrService.sendDirectMessage(this.userPubkey, JSON.stringify(message));
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
}
