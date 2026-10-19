import { Response } from 'express';
import { logger } from '../shared/logger';

interface SSEClient {
  id: string;
  res: Response;
  userId?: string;
}

export class SSEService {
  private clients: Map<string, SSEClient> = new Map();

  constructor() {
    // Heartbeat every 20 seconds to keep proxy connections alive (Railway, Nginx, Vercel)
    setInterval(() => {
      this.sendHeartbeat();
    }, 20000);
  }

  addClient(id: string, res: Response, userId?: string) {
    this.clients.set(id, { id, res, userId });
    logger.info(`[SSE] Client connected: ${id} (Total: ${this.clients.size})`);

    // Initial greeting
    this.sendToClient(res, 'CONNECTED', {
      clientId: id,
      serverTime: new Date().toISOString(),
      activeConnections: this.clients.size,
    });
  }

  removeClient(id: string) {
    if (this.clients.has(id)) {
      this.clients.delete(id);
      logger.info(`[SSE] Client disconnected: ${id} (Total: ${this.clients.size})`);
    }
  }

  broadcast(eventType: string, payload: unknown) {
    const data = JSON.stringify(payload);
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(`event: ${eventType}\ndata: ${data}\n\n`);
      } catch (err) {
        logger.warn(`[SSE] Failed to write to client ${id}, removing...`, { err });
        this.removeClient(id);
      }
    }
  }

  sendToUser(userId: string, eventType: string, payload: unknown) {
    const data = JSON.stringify(payload);
    for (const [id, client] of this.clients.entries()) {
      if (client.userId === userId) {
        try {
          client.res.write(`event: ${eventType}\ndata: ${data}\n\n`);
        } catch {
          this.removeClient(id);
        }
      }
    }
  }

  private sendToClient(res: Response, eventType: string, payload: unknown) {
    try {
      res.write(`event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch {
      // Ignored
    }
  }

  private sendHeartbeat() {
    const ping = `event: PING\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`;
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(ping);
      } catch {
        this.removeClient(id);
      }
    }
  }
}

export const sseService = new SSEService();
