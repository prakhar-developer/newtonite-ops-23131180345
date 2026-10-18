"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateUserSchema = exports.CreateTeamSchema = exports.CsatFeedbackSchema = exports.AddCommentSchema = exports.TransitionWorkItemSchema = exports.UpdateWorkItemSchema = exports.CreateWorkItemSchema = exports.CreateTicketSchema = exports.LoginSchema = exports.SLA_DURATIONS_MINUTES = exports.ALLOWED_TRANSITIONS = exports.ROLE_HIERARCHY = exports.ActivityAction = exports.TicketChannel = exports.SystemRole = exports.TeamRole = exports.WorkItemStatus = exports.Priority = exports.WorkItemType = void 0;
exports.hasMinimumRole = hasMinimumRole;
const zod_1 = require("zod");
// ==========================================
// 1. Shared Domain Constants & Enums
// ==========================================
exports.WorkItemType = {
    INCIDENT: 'INCIDENT',
    CUSTOMER_ISSUE: 'CUSTOMER_ISSUE',
    PAYMENT: 'PAYMENT',
    COMPLIANCE: 'COMPLIANCE',
    TASK: 'TASK',
};
exports.Priority = {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
    CRITICAL: 'CRITICAL',
};
exports.WorkItemStatus = {
    OPEN: 'OPEN',
    IN_PROGRESS: 'IN_PROGRESS',
    AWAITING_APPROVAL: 'AWAITING_APPROVAL',
    AWAITING_CUSTOMER: 'AWAITING_CUSTOMER',
    RESOLVED: 'RESOLVED',
    CLOSED: 'CLOSED',
};
exports.TeamRole = {
    VIEWER: 'VIEWER',
    MEMBER: 'MEMBER',
    LEAD: 'LEAD',
    ADMIN: 'ADMIN',
};
exports.SystemRole = {
    OPERATOR: 'OPERATOR',
    SUPER_ADMIN: 'SUPER_ADMIN',
};
exports.TicketChannel = {
    PORTAL: 'PORTAL',
    WIDGET: 'WIDGET',
    API: 'API',
    EMAIL: 'EMAIL',
};
exports.ActivityAction = {
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
};
// ==========================================
// 2. Role Hierarchy & Access Control Matrix
// ==========================================
exports.ROLE_HIERARCHY = {
    VIEWER: 1,
    MEMBER: 2,
    LEAD: 3,
    ADMIN: 4,
};
function hasMinimumRole(userRole, minimumRequired) {
    if (!userRole)
        return false;
    return exports.ROLE_HIERARCHY[userRole] >= exports.ROLE_HIERARCHY[minimumRequired];
}
// ==========================================
// 3. Workflow State Machine Rules
// ==========================================
exports.ALLOWED_TRANSITIONS = {
    OPEN: [exports.WorkItemStatus.IN_PROGRESS, exports.WorkItemStatus.AWAITING_CUSTOMER, exports.WorkItemStatus.CLOSED],
    IN_PROGRESS: [
        exports.WorkItemStatus.AWAITING_APPROVAL,
        exports.WorkItemStatus.AWAITING_CUSTOMER,
        exports.WorkItemStatus.RESOLVED,
        exports.WorkItemStatus.OPEN,
    ],
    AWAITING_APPROVAL: [exports.WorkItemStatus.RESOLVED, exports.WorkItemStatus.IN_PROGRESS],
    AWAITING_CUSTOMER: [exports.WorkItemStatus.IN_PROGRESS, exports.WorkItemStatus.RESOLVED, exports.WorkItemStatus.CLOSED],
    RESOLVED: [exports.WorkItemStatus.CLOSED, exports.WorkItemStatus.IN_PROGRESS],
    CLOSED: [exports.WorkItemStatus.OPEN],
};
// ==========================================
// 4. Default SLA Durations (in Minutes)
// ==========================================
exports.SLA_DURATIONS_MINUTES = {
    CRITICAL: 120, // 2 Hours
    URGENT: 360, // 6 Hours
    HIGH: 1440, // 24 Hours
    MEDIUM: 4320, // 72 Hours (3 Days)
    LOW: 10080, // 7 Days
};
// ==========================================
// 5. Zod Validation Schemas
// ==========================================
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.CreateTicketSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().email('Valid email is required for tracking updates'),
    company: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    title: zod_1.z.string().min(5, 'Title must be at least 5 characters').max(200),
    description: zod_1.z.string().min(10, 'Please provide details of your issue'),
    category: zod_1.z.nativeEnum(exports.WorkItemType).default(exports.WorkItemType.CUSTOMER_ISSUE),
    priority: zod_1.z.nativeEnum(exports.Priority).default(exports.Priority.MEDIUM),
    channel: zod_1.z.nativeEnum(exports.TicketChannel).default(exports.TicketChannel.PORTAL),
    teamSlug: zod_1.z.string().optional(), // Target team (e.g. 'payments', 'support', 'compliance')
    attachmentUrls: zod_1.z.array(zod_1.z.string().url()).optional(),
});
exports.CreateWorkItemSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(250),
    description: zod_1.z.string().optional(),
    type: zod_1.z.nativeEnum(exports.WorkItemType),
    priority: zod_1.z.nativeEnum(exports.Priority).default(exports.Priority.MEDIUM),
    teamId: zod_1.z.string().uuid('Valid team ID is required'),
    assigneeId: zod_1.z.string().uuid().optional().nullable(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
});
exports.UpdateWorkItemSchema = zod_1.z.object({
    version: zod_1.z.number().int().min(1, 'Version token required for optimistic locking'),
    title: zod_1.z.string().min(5).max(250).optional(),
    description: zod_1.z.string().optional(),
    priority: zod_1.z.nativeEnum(exports.Priority).optional(),
    assigneeId: zod_1.z.string().uuid().optional().nullable(),
    dueDate: zod_1.z.string().datetime().optional().nullable(),
});
exports.TransitionWorkItemSchema = zod_1.z.object({
    version: zod_1.z.number().int().min(1, 'Version token required'),
    targetStatus: zod_1.z.nativeEnum(exports.WorkItemStatus),
    reason: zod_1.z.string().max(500).optional(),
});
exports.AddCommentSchema = zod_1.z.object({
    body: zod_1.z.string().min(1, 'Comment body cannot be empty').max(3000),
    isInternal: zod_1.z.boolean().default(false), // true = internal note for operators; false = customer reply
    attachments: zod_1.z
        .array(zod_1.z.object({
        url: zod_1.z.string().url(),
        filename: zod_1.z.string(),
        size: zod_1.z.number().optional(),
        format: zod_1.z.string().optional(),
    }))
        .optional(),
});
exports.CsatFeedbackSchema = zod_1.z.object({
    rating: zod_1.z.number().int().min(1).max(5),
    feedback: zod_1.z.string().max(1000).optional(),
});
exports.CreateTeamSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    slug: zod_1.z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be alphanumeric lowercase with hyphens'),
    description: zod_1.z.string().max(500).optional(),
});
exports.CreateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(100),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    systemRole: zod_1.z.nativeEnum(exports.SystemRole).default(exports.SystemRole.OPERATOR),
    teamMemberships: zod_1.z
        .array(zod_1.z.object({
        teamId: zod_1.z.string().uuid(),
        role: zod_1.z.nativeEnum(exports.TeamRole),
    }))
        .optional(),
});
//# sourceMappingURL=index.js.map