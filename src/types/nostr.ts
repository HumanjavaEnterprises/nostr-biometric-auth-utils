/**
 * Nostr service types
 */

export interface NostrEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind: number;
  tags: string[][];
  content: string;
  sig: string;
}

export interface NostrFilter {
  authors?: string[];
  kinds?: number[];
  limit?: number;
}

/**
 * Encryption version for Nostr direct messages.
 * - 'nip04': Legacy NIP-04 AES-CBC encryption (kind 4). Default for backward compat.
 * - 'nip44': Modern NIP-44 ChaCha20+HMAC encryption (kind 44). Opt-in.
 */
export type EncryptionVersion = 'nip04' | 'nip44';

export interface NostrService {
  sendDirectMessage(pubkey: string, content: string): Promise<NostrEvent>;
  queryEvents(filter: NostrFilter): Promise<NostrEvent[]>;
}
