import { Router, Request, Response } from 'express';
import { sseService } from '../../services/sse.service';
import { env } from '../../config/env';
import jwt from 'jsonwebtoken';

export const eventsRouter = Router();

/**
 * GET /api/v1/events/stream
 * Server-Sent Events stream for real-time multiplayer updates & notifications
 */
eventsRouter.get('/stream', (req: Request, res: Response) => {
  // Extract token from query or Authorization header
  let token = req.query.token as string | undefined;
  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.slice(7);
  }

  let userId: string | undefined;
  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      userId = decoded.id;
    } catch {
      // Allow unauthenticated connection or anonymous viewing
    }
  }

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // Critical for Nginx / Railway / reverse proxies
    'Access-Control-Allow-Origin': '*',
  });

  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  sseService.addClient(clientId, res, userId);

  req.on('close', () => {
    sseService.removeClient(clientId);
  });
});
