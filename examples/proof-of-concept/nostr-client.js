import { NostrWebsocketUtils } from 'nostr-websocket-utils';
import { config } from './config.js';

class NostrClient {
    constructor() {
        this.nostrWs = new NostrWebsocketUtils();
        this.connectedRelays = new Set();
    }

    async init() {
        for (const relayUrl of config.nostr.defaultRelays) {
            try {
                await this.nostrWs.connect(relayUrl);
                this.connectedRelays.add(relayUrl);
            } catch (error) {
                console.warn(`Failed to connect to relay ${relayUrl}:`, error);
            }
        }
    }

    async getUserProfile(pubkey) {
        if (this.connectedRelays.size === 0) {
            await this.init();
        }

        const filter = {
            kinds: [0],
            authors: [pubkey],
            limit: 1
        };

        try {
            const events = await this.nostrWs.fetchEvents(
                Array.from(this.connectedRelays),
                [filter],
                config.nostr.relayTimeout
            );

            if (events && events.length > 0) {
                // Sort by created_at to get the most recent profile
                const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
                try {
                    return JSON.parse(latestEvent.content);
                } catch (error) {
                    console.error('Error parsing profile content:', error);
                    return null;
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching profile:', error);
            return null;
        }
    }

    cleanup() {
        this.nostrWs.cleanup();
        this.connectedRelays.clear();
    }
}

export const nostrClient = new NostrClient();
