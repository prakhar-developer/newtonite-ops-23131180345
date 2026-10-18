import { z } from 'zod';

// ==========================================
// 1. Shared Domain Constants & Enums
// ==========================================

export const WorkItemType = {
  INCIDENT: 'INCIDENT',
  CUSTOMER_ISSUE: 'CUSTOMER_ISSUE',
  PAYMENT: 'PAYMENT',
  COMPLIANCE: 'COMPLIANCE',
  TASK: 'TASK',
} as const;
export type WorkItemType = (typeof WorkItemType)[keyof typeof WorkItemType];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
  CRITICAL: 'CRITICAL',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const WorkItemStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  AWAITING_APPROVAL: 'AWAITING_APPROVAL',
  AWAITING_CUSTOMER: 'AWAITING_CUSTOMER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;
export type WorkItemStatus = (typeof WorkItemStatus)[keyof typeof WorkItemStatus];

export const TeamRole = {
  VIEWER: 'VIEWER',
  MEMBER: 'MEMBER',
  LEAD: 'LEAD',
  ADMIN: 'ADMIN',
} as const;
export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];

export const SystemRole = {
  OPERATOR: 'OPERATOR',
  SUPER_ADMIN: 'SUPER_ADMIN',
} as const;
export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];

export const TicketChannel = {
  PORTAL: 'PORTAL',
  WIDGET: 'WIDGET',
  API: 'API',
  EMAIL: 'EMAIL',
} as const;
export type TicketChannel = (typeof TicketChannel)[keyof typeof TicketChannel];

export const ActivityAction = {
  CREATED: 'CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  ASSIGNED: 'ASSIGNED',
  UNASSIGNED: 'UNASSIGNED',
  CLAIMED: 'CLAIMED',
  COMMENT_ADDED: 'COMMENT_ADDED',
  INTERNAL_NOTE_ADDED: 'INTERNAL_NOTE_ADDED',
  WORKFLOW_APPROVED: 'WORKFLOW_APPROVED',
  ESCALATED: 'ESCALATED',
  UPDATED: 'UPDATED',
  CUSTOMER_CONFIRMED: 'CUSTOMER_CONFIRMED',
} as const;
export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];

// ==========================================
// 2. Role Hierarchy & Access Control Matrix
// ==========================================

export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  VIEWER: 1,
  MEMBER: 2,
  LEAD: 3,
  ADMIN: 4,
};

export function hasMinimumRole(userRole: TeamRole | null | undefined, minimumRequired: TeamRole): boolean {
  if (!userRole) return false;
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minimumRequired];
}

// ==========================================
// 3. Workflow State Machine Rules
// ==========================================

export const ALLOWED_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]> = {
  OPEN: [WorkItemStatus.IN_PROGRESS, WorkItemStatus.AWAITING_CUSTOMER, WorkItemStatus.CLOSED],
  IN_PROGRESS: [
    WorkItemStatus.AWAITING_APPROVAL,
    WorkItemStatus.AWAITING_CUSTOMER,
    WorkItemStatus.RESOLVED,
    WorkItemStatus.OPEN,
  ],
  AWAITING_APPROVAL: [WorkItemStatus.RESOLVED, WorkItemStatus.IN_PROGRESS],
  AWAITING_CUSTOMER: [WorkItemStatus.IN_PROGRESS, WorkItemStatus.RESOLVED, WorkItemStatus.CLOSED],
  RESOLVED: [WorkItemStatus.CLOSED, WorkItemStatus.IN_PROGRESS],
  CLOSED: [WorkItemStatus.OPEN],
};

// ==========================================
// 4. Default SLA Durations (in Minutes)
// ==========================================

export const SLA_DURATIONS_MINUTES: Record<Priority, number> = {
  CRITICAL: 120,    // 2 Hours
  URGENT: 360,      // 6 Hours
  HIGH: 1440,       // 24 Hours
  MEDIUM: 4320,     // 72 Hours (3 Days)
  LOW: 10080,       // 7 Days
};

// ==========================================
// 5. Zod Validation Schemas
// ==========================================

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const CreateTicketSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email is required for tracking updates'),
  company: z.string().optional(),
  phone: z.string().optional(),
  title: z.string().min(5, 'Title must be at least 5 characters').max(200),
  description: z.string().min(10, 'Please provide details of your issue'),
  category: z.nativeEnum(WorkItemType).default(WorkItemType.CUSTOMER_ISSUE),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  channel: z.nativeEnum(TicketChannel).default(TicketChannel.PORTAL),
  teamSlug: z.string().optional(), // Target team (e.g. 'payments', 'support', 'compliance')
  attachmentUrls: z.array(z.string().url()).optional(),
});
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

export const CreateWorkItemSchema = z.object({
  title: z.string().min(5).max(250),
  description: z.string().optional(),
  type: z.nativeEnum(WorkItemType),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  teamId: z.string().uuid('Valid team ID is required'),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});
export type CreateWorkItemInput = z.infer<typeof CreateWorkItemSchema>;

export const UpdateWorkItemSchema = z.object({
  version: z.number().int().min(1, 'Version token required for optimistic locking'),
  title: z.string().min(5).max(250).optional(),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
});
export type UpdateWorkItemInput = z.infer<typeof UpdateWorkItemSchema>;

export const TransitionWorkItemSchema = z.object({
  version: z.number().int().min(1, 'Version token required'),
  targetStatus: z.nativeEnum(WorkItemStatus),
  reason: z.string().max(500).optional(),
});
export type TransitionWorkItemInput = z.infer<typeof TransitionWorkItemSchema>;

export const AddCommentSchema = z.object({
  body: z.string().min(1, 'Comment body cannot be empty').max(3000),
  isInternal: z.boolean().default(false), // true = internal note for operators; false = customer reply
  attachments: z
    .array(
      z.object({
        url: z.string().url(),
        filename: z.string(),
        size: z.number().optional(),
        format: z.string().optional(),
      })
    )
    .optional(),
});
export type AddCommentInput = z.infer<typeof AddCommentSchema>;

export const CsatFeedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
});
export type CsatFeedbackInput = z.infer<typeof CsatFeedbackSchema>;

export const CreateTeamSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase with hyphens'),
  description: z.string().max(500).optional(),
});
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  systemRole: z.nativeEnum(SystemRole).default(SystemRole.OPERATOR),
  teamMemberships: z
    .array(
      z.object({
        teamId: z.string().uuid(),
        role: z.nativeEnum(TeamRole),
      })
    )
    .optional(),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// Standard API Envelope
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}
