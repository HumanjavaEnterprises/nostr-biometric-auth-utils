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

export interface NostrService {
  sendDirectMessage(pubkey: string, content: string): Promise<NostrEvent>;
  queryEvents(filter: NostrFilter): Promise<NostrEvent[]>;
}
