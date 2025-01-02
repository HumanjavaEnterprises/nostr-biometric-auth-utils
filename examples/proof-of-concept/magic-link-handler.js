import { createNostrMagicLink, NostrError } from 'nostr-dm-magiclink-utils';
import { config } from './config.js';
import { nostrClient } from './nostr-client.js';

class MagicLinkHandler {
    constructor() {
        this.pendingLinks = new Map(); // Store pending magic links
        this.magicLink = null;
    }

    async init() {
        this.magicLink = createNostrMagicLink({
            nostr: {
                privateKey: config.nostr.privateKey,
                relayUrls: config.nostr.defaultRelays,
                connectionTimeout: config.nostr.relayTimeout
            },
            magicLink: {
                verifyUrl: `${config.app.origin}/auth`,
                token: async () => {
                    const token = await this.generateToken();
                    return token;
                },
                defaultLocale: 'en',
                templates: {
                    en: {
                        subject: 'Login to Nostr Biometric Service',
                        body: 'Click this secure link to log in: {{link}}\\nValid for {{timeout}} minutes.'
                    }
                }
            }
        });
    }

    async generateToken() {
        // Generate a secure random token
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async sendMagicLink(recipientPubkey) {
        try {
            const result = await this.magicLink.sendMagicLink({
                recipientPubkey,
                messageOptions: {
                    locale: 'en',
                    variables: {
                        timeout: config.nostr.magicLinkTimeout / 60000
                    }
                }
            });

            if (result.success) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error sending magic link:', error);
            return false;
        }
    }

    async verifyMagicLink(token) {
        try {
            const result = await this.magicLink.verifyToken(token);
            return { valid: result.success, pubkey: result.pubkey };
        } catch (error) {
            console.error('Error verifying magic link:', error);
            return { valid: false, reason: error.message };
        }
    }
}

export const magicLinkHandler = new MagicLinkHandler();
