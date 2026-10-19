import { Router } from 'express';
import { workItemsService, type WorkItemListQuery } from './work-items.service';
import {
  CreateWorkItemSchema,
  UpdateWorkItemSchema,
  TransitionWorkItemSchema,
  AddCommentSchema,
  WorkItemStatus,
  Priority,
  WorkItemType,
} from '@instos/shared';
import { authMiddleware } from '../../middleware/auth';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { slaService } from '../../services/sla.service';

export const workItemsRouter = Router();

workItemsRouter.use(authMiddleware);

/**
 * Trigger immediate deterministic SLA breach scan and auto-escalation
 */
workItemsRouter.post('/sla/scan', async (_req, res, next) => {
  try {
    const result = await slaService.scanAndEscalate();
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
 * Dashboard KPIs
 */
workItemsRouter.get('/kpis', async (req, res, next) => {
  try {
    const stats = await workItemsService.getDashboardKpis(req.user!);
    res.json({
      success: true,
      data: stats,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * List Work Items with server-side filters and keyset cursor pagination
 */
workItemsRouter.get('/', async (req, res, next) => {
  try {
    const query: WorkItemListQuery = {
      view: req.query.view as WorkItemListQuery['view'],
      teamId: req.query.teamId as string | undefined,
      status: req.query.status as WorkItemStatus | undefined,
      priority: req.query.priority as Priority | undefined,
      type: req.query.type as WorkItemType | undefined,
      assigneeId: req.query.assigneeId as string | undefined,
      slaBreached: req.query.slaBreached === 'true' ? true : req.query.slaBreached === 'false' ? false : undefined,
      q: req.query.q as string | undefined,
      cursor: req.query.cursor as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };

    const result = await workItemsService.listWorkItems(req.user!, query);
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
 * Create Work Item
 */
workItemsRouter.post('/', idempotencyMiddleware, async (req, res, next) => {
  try {
    const input = CreateWorkItemSchema.parse(req.body);
    const item = await workItemsService.createWorkItem(req.user!, input);
    res.status(201).json({
      success: true,
      data: item,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Get Work Item Detail by ID
 */
workItemsRouter.get('/:id', async (req, res, next) => {
  try {
    const item = await workItemsService.getWorkItemById(req.user!, req.params.id);
    res.json({
      success: true,
      data: item,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Atomic Claim: Race-condition safe
 */
workItemsRouter.post('/:id/claim', async (req, res, next) => {
  try {
    const claimed = await workItemsService.claimWorkItem(req.user!, req.params.id);
    res.json({
      success: true,
      data: claimed,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Optimistic Locking Update
 */
workItemsRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = UpdateWorkItemSchema.parse(req.body);
    const updated = await workItemsService.updateWorkItem(req.user!, req.params.id, input);
    res.json({
      success: true,
      data: updated,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Server-Enforced Workflow State Machine Transition
 */
workItemsRouter.post('/:id/transition', async (req, res, next) => {
  try {
    const input = TransitionWorkItemSchema.parse(req.body);
    const result = await workItemsService.transitionWorkItem(req.user!, req.params.id, input);
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
 * Add Comment or Internal Note
 */
workItemsRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const input = AddCommentSchema.parse(req.body);
    const comment = await workItemsService.addComment(req.user!, req.params.id, input);
    res.status(201).json({
      success: true,
      data: comment,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err) {
    next(err);
  }
});
