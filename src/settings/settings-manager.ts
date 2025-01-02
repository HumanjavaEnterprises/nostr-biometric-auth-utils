import { NostrService, MagicLinkService } from 'nostr-dm-magiclink-utils';
import { WalletSettings } from '../types/settings';
import { walletCrypto } from '../crypto/wallet-crypto';

export class SettingsManager {
  private nostrService: NostrService;
  private magicLinkService: MagicLinkService;
  private userPubkey: string;
  private cachedSettings: WalletSettings | null = null;

  constructor(nostrService: NostrService, magicLinkService: MagicLinkService, userPubkey: string) {
    this.nostrService = nostrService;
    this.magicLinkService = magicLinkService;
    this.userPubkey = userPubkey;
  }

  /**
   * Get default settings
   */
  private getDefaultSettings(): WalletSettings {
    return {
      network: {
        BTC: {
          nodes: [
            {
              url: 'https://mempool.space/api/v1',
              type: 'public',
              priority: 1,
              enabled: true
            },
            {
              url: 'https://blockstream.info/api',
              type: 'public',
              priority: 2,
              enabled: true
            }
          ],
          network: 'mainnet',
          feePreference: 'normal'
        },
        LightningBTC: {
          nodes: [
            {
              url: 'https://ln.getalby.com',
              type: 'public',
              priority: 1,
              enabled: true
            }
          ],
          network: 'mainnet'
        },
        // ... similar defaults for other chains
      },
      security: {
        autoLockTimeout: 5,
        requireAuthFor: {
          send: true,
          receive: false,
          export: true,
          settings: true
        },
        sessionType: 'flow',
        sessionDuration: 15,
        biometricEnabled: true,
        hardwareKeyEnabled: false
      },
      display: {
        theme: 'dark',
        currency: 'USD',
        language: 'en',
        hideBalances: false,
        showTestnetWallets: false,
        compactMode: false
      },
      notifications: {
        enabled: true,
        notify: {
          receives: true,
          sends: true,
          confirmations: true,
          priceAlerts: false
        },
        confirmationThreshold: {
          BTC: 2,
          LTC: 6,
          DOGE: 6,
          SOL: 32
        },
        priceAlerts: {
          enabled: false,
          currency: 'USD',
          thresholds: {}
        }
      },
      privacy: {
        shareBalanceWithParent: false,
        shareTxHistoryWithParent: false,
        allowExternalQueries: true,
        clearDataOnExit: false,
        useLocalBlockExplorer: false
      },
      version: '1.0.0',
      lastUpdated: Date.now()
    };
  }

  /**
   * Load settings from DMs
   */
  async loadSettings(decryptionKey: CryptoKey): Promise<WalletSettings> {
    if (this.cachedSettings) {
      return this.cachedSettings;
    }

    const dms = await this.nostrService.getSelfDMs(this.userPubkey);
    const settingsDMs = dms.filter(dm => {
      try {
        const data = JSON.parse(dm.content);
        return data.type === 'wallet-settings' && data.version === '1.0.0';
      } catch {
        return false;
      }
    }).sort((a, b) => b.created_at - a.created_at);

    if (settingsDMs.length === 0) {
      this.cachedSettings = this.getDefaultSettings();
      await this.saveSettings(this.cachedSettings, decryptionKey);
      return this.cachedSettings;
    }

    const latestDM = settingsDMs[0];
    const data = JSON.parse(latestDM.content);
    const decrypted = await walletCrypto.decryptWallet(data.settings, decryptionKey);
    this.cachedSettings = decrypted as WalletSettings;

    return this.cachedSettings;
  }

  /**
   * Save settings to DM
   */
  async saveSettings(
    settings: WalletSettings,
    encryptionKey: CryptoKey
  ): Promise<void> {
    const encrypted = await walletCrypto.encryptWallet(settings, encryptionKey);

    const message = {
      type: 'wallet-settings',
      version: '1.0.0',
      settings: encrypted,
      timestamp: Date.now(),
      metadata: {
        theme: settings.display.theme,
        language: settings.display.language,
        network: {
          BTC: settings.network.BTC.network,
          LTC: settings.network.LTC.network,
          // ... other networks
        }
      }
    };

    await this.magicLinkService.sendSelfDM(this.userPubkey, JSON.stringify(message));
    this.cachedSettings = settings;
  }

  /**
   * Update specific settings
   */
  async updateSettings(
    updates: Partial<WalletSettings>,
    encryptionKey: CryptoKey
  ): Promise<WalletSettings> {
    const current = await this.loadSettings(encryptionKey);
    const updated = this.mergeSettings(current, updates);
    await this.saveSettings(updated, encryptionKey);
    return updated;
  }

  /**
   * Deep merge settings
   */
  private mergeSettings(
    current: WalletSettings,
    updates: Partial<WalletSettings>
  ): WalletSettings {
    return {
      ...current,
      ...updates,
      network: updates.network ? {
        ...current.network,
        ...updates.network,
        // Deep merge each chain's settings
        BTC: updates.network.BTC ? {
          ...current.network.BTC,
          ...updates.network.BTC,
          nodes: [...(updates.network.BTC.nodes || current.network.BTC.nodes)]
        } : current.network.BTC,
        // ... other chains
      } : current.network,
      security: updates.security ? {
        ...current.security,
        ...updates.security,
        requireAuthFor: {
          ...current.security.requireAuthFor,
          ...updates.security?.requireAuthFor
        }
      } : current.security,
      display: updates.display ? {
        ...current.display,
        ...updates.display
      } : current.display,
      notifications: updates.notifications ? {
        ...current.notifications,
        ...updates.notifications,
        notify: {
          ...current.notifications.notify,
          ...updates.notifications?.notify
        },
        confirmationThreshold: {
          ...current.notifications.confirmationThreshold,
          ...updates.notifications?.confirmationThreshold
        }
      } : current.notifications,
      privacy: updates.privacy ? {
        ...current.privacy,
        ...updates.privacy
      } : current.privacy,
      lastUpdated: Date.now()
    };
  }
}
