import { WebSocketServer, WebSocket } from 'ws';
import { Event as NostrEvent, getEventHash, validateEvent, verifySignature } from 'nostr-tools';
import { EventEmitter } from 'events';

export class NostrRelay extends EventEmitter {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, Set<string>> = new Map();
  private events: NostrEvent[] = [];

  constructor(wss: WebSocketServer) {
    super();
    this.wss = wss;
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');
      this.clients.set(ws, new Set());

      ws.on('message', async (message: string) => {
        try {
          const [type, ...data] = JSON.parse(message.toString());
          await this.handleMessage(ws, type, data);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify(['NOTICE', 'Invalid message format']));
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
        this.clients.delete(ws);
      });
    });
  }

  private async handleMessage(ws: WebSocket, type: string, data: any[]) {
    switch (type) {
      case 'EVENT':
        await this.handleEvent(ws, data[0]);
        break;
      case 'REQ':
        await this.handleSubscription(ws, data[0], data[1]);
        break;
      case 'CLOSE':
        this.handleClose(ws, data[0]);
        break;
      default:
        ws.send(JSON.stringify(['NOTICE', 'Unknown message type']));
    }
  }

  private async handleEvent(ws: WebSocket, event: NostrEvent) {
    // Validate event
    if (!validateEvent(event) || !verifySignature(event)) {
      ws.send(JSON.stringify(['NOTICE', 'Invalid event']));
      return;
    }

    // Check if it's a DM
    if (event.kind === 4) {
      this.emit('dm', event);
    }

    // Store event
    this.events.push(event);

    // Broadcast to subscribers
    this.broadcast(event);

    // Confirm acceptance
    ws.send(JSON.stringify(['OK', event.id, true, '']));
  }

  private async handleSubscription(ws: WebSocket, subId: string, filters: any) {
    // Store subscription
    this.clients.get(ws)?.add(subId);

    // Send matching events
    const matching = this.events.filter(event => this.matchFilters(event, filters));
    matching.forEach(event => {
      ws.send(JSON.stringify(['EVENT', subId, event]));
    });

    // Send EOSE
    ws.send(JSON.stringify(['EOSE', subId]));
  }

  private handleClose(ws: WebSocket, subId: string) {
    this.clients.get(ws)?.delete(subId);
  }

  private matchFilters(event: NostrEvent, filters: any): boolean {
    if (!filters) return true;

    // Match kinds
    if (filters.kinds && !filters.kinds.includes(event.kind)) {
      return false;
    }

    // Match authors
    if (filters.authors && !filters.authors.includes(event.pubkey)) {
      return false;
    }

    // Match #e tags
    if (filters.ids && !filters.ids.some((id: string) => event.id.startsWith(id))) {
      return false;
    }

    // Match #p tags
    if (filters.p && !event.tags.some(tag => 
      tag[0] === 'p' && filters.p.includes(tag[1])
    )) {
      return false;
    }

    return true;
  }

  private broadcast(event: NostrEvent) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        const subs = this.clients.get(client);
        if (subs) {
          subs.forEach(subId => {
            client.send(JSON.stringify(['EVENT', subId, event]));
          });
        }
      }
    });
  }

  /**
   * Get DMs for a specific pubkey
   */
  async getDMs(pubkey: string, options: {
    limit?: number;
    type?: string;
  } = {}): Promise<NostrEvent[]> {
    return this.events
      .filter(event => 
        event.kind === 4 &&
        (event.tags.some(tag => tag[0] === 'p' && tag[1] === pubkey))
      )
      .slice(-(options.limit || 50));
  }
}
