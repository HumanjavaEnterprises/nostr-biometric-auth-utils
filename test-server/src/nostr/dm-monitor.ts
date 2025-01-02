import { Request, Response } from 'express';
import { NostrRelay } from './relay';

export class DMMonitor {
  private relay: NostrRelay;
  private dmStats: {
    total: number;
    walletStorage: number;
    walletSettings: number;
    walletDeletion: number;
    other: number;
  };

  constructor(relay: NostrRelay) {
    this.relay = relay;
    this.dmStats = {
      total: 0,
      walletStorage: 0,
      walletSettings: 0,
      walletDeletion: 0,
      other: 0
    };

    this.setupMonitoring();
  }

  private setupMonitoring() {
    this.relay.on('dm', (event) => {
      this.dmStats.total++;
      
      try {
        const content = JSON.parse(event.content);
        switch (content.type) {
          case 'wallet-storage':
            this.dmStats.walletStorage++;
            break;
          case 'wallet-settings':
            this.dmStats.walletSettings++;
            break;
          case 'wallet-deletion':
            this.dmStats.walletDeletion++;
            break;
          default:
            this.dmStats.other++;
        }
      } catch {
        this.dmStats.other++;
      }
    });
  }

  /**
   * Get DMs for a specific pubkey
   */
  getDMs = async (req: Request, res: Response) => {
    const { pubkey } = req.params;
    const { limit = 50, type } = req.query;

    try {
      const dms = await this.relay.getDMs(pubkey, {
        limit: Number(limit),
        type: type as string
      });

      res.json({
        pubkey,
        count: dms.length,
        dms: dms.map(dm => ({
          id: dm.id,
          type: this.getDMType(dm),
          timestamp: dm.created_at,
          encrypted: true,
          size: dm.content.length
        }))
      });
    } catch (error) {
      console.error('Error fetching DMs:', error);
      res.status(500).json({ error: 'Failed to fetch DMs' });
    }
  };

  /**
   * Get DM statistics
   */
  getStats = async (req: Request, res: Response) => {
    res.json({
      stats: this.dmStats,
      timestamp: Date.now()
    });
  };

  /**
   * Determine DM type from content
   */
  private getDMType(dm: any): string {
    try {
      const content = JSON.parse(dm.content);
      return content.type || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.dmStats = {
      total: 0,
      walletStorage: 0,
      walletSettings: 0,
      walletDeletion: 0,
      other: 0
    };
  }
}
