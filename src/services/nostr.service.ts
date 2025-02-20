import { NostrEvent, NostrFilter } from '../types/nostr';

/**
 * Basic Nostr service implementation
 */
export class NostrService {
  private relays: string[];

  constructor(relays: string[] = ['wss://relay.damus.io']) {
    this.relays = relays;
  }

  /**
   * Send a direct message to a pubkey
   */
  async sendDirectMessage(_pubkey: string, _content: string): Promise<NostrEvent> {
    // Implementation will be provided by the consuming application
    throw new Error('sendDirectMessage must be implemented by the consuming application');
  }

  /**
   * Query events based on filter
   */
  async queryEvents(_filter: NostrFilter): Promise<NostrEvent[]> {
    // Implementation will be provided by the consuming application
    throw new Error('queryEvents must be implemented by the consuming application');
  }

  /**
   * Set relays to use
   */
  setRelays(relays: string[]): void {
    this.relays = relays;
  }

  /**
   * Get current relays
   */
  getRelays(): string[] {
    return [...this.relays];
  }
}
