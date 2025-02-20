import { describe, it, expect } from 'vitest';
import { NostrService } from './nostr.service';

describe('NostrService', () => {
  it('should be instantiated with default relay', () => {
    const service = new NostrService();
    expect(service.getRelays()).toEqual(['wss://relay.damus.io']);
  });

  it('should be instantiated with custom relays', () => {
    const relays = ['wss://relay1.com', 'wss://relay2.com'];
    const service = new NostrService(relays);
    expect(service.getRelays()).toEqual(relays);
  });

  it('should update relays', () => {
    const service = new NostrService();
    const newRelays = ['wss://relay1.com', 'wss://relay2.com'];
    service.setRelays(newRelays);
    expect(service.getRelays()).toEqual(newRelays);
  });

  it('should throw error for unimplemented sendDirectMessage', async () => {
    const service = new NostrService();
    await expect(service.sendDirectMessage('pubkey', 'content')).rejects.toThrow(
      'sendDirectMessage must be implemented by the consuming application'
    );
  });

  it('should throw error for unimplemented queryEvents', async () => {
    const service = new NostrService();
    await expect(service.queryEvents({})).rejects.toThrow(
      'queryEvents must be implemented by the consuming application'
    );
  });
});
