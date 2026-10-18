import { Router } from 'express';
import { ticketsService } from './tickets.service';
import { CreateTicketSchema, AddCommentSchema, CsatFeedbackSchema } from '@instos/shared';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { uploadService } from '../../services/upload.service';
import { BadRequestError } from '../../shared/errors';

export const ticketsRouter = Router();

/**
 * Public Ticket Ingestion endpoint (Customer Portal, External Widget, API)
 * Supports Idempotency-Key header to prevent duplicate submissions on double-clicks
 */
ticketsRouter.post('/', idempotencyMiddleware, async (req, res, next) => {
  try {
    const input = CreateTicketSchema.parse(req.body);
    const result = await ticketsService.createTicket(input);
    res.status(201).json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Public Customer Tracking endpoint
 */
ticketsRouter.get('/track/:token', async (req, res, next) => {
  try {
    const ticket = await ticketsService.getTicketByTrackingToken(req.params.token);
    res.json({
      success: true,
      data: ticket,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Public Customer Reply
 */
ticketsRouter.post('/track/:token/messages', async (req, res, next) => {
  try {
    const input = AddCommentSchema.parse(req.body);
    const comment = await ticketsService.addCustomerReply(req.params.token, input);
    res.status(201).json({
      success: true,
      data: comment,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Customer CSAT feedback & resolution confirmation
 */
ticketsRouter.post('/track/:token/feedback', async (req, res, next) => {
  try {
    const input = CsatFeedbackSchema.parse(req.body);
    const result = await ticketsService.submitCsatFeedback(req.params.token, input);
    res.json({
      success: true,
      data: result,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * File / Screenshot upload endpoint (Cloudinary / Local storage)
 */
ticketsRouter.post('/upload', async (req, res, next) => {
  try {
    const { file, filename, mimeType } = req.body;
    if (!file || !filename) {
      throw new BadRequestError('File base64 data and filename are required');
    }

    const buffer = Buffer.from(file.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    const uploaded = await uploadService.uploadFile(buffer, filename, mimeType || 'image/png');

    res.json({
      success: true,
      data: uploaded,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
