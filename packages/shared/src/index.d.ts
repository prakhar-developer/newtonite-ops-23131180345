import { z } from 'zod';
export declare const WorkItemType: {
    readonly INCIDENT: "INCIDENT";
    readonly CUSTOMER_ISSUE: "CUSTOMER_ISSUE";
    readonly PAYMENT: "PAYMENT";
    readonly COMPLIANCE: "COMPLIANCE";
    readonly TASK: "TASK";
};
export type WorkItemType = (typeof WorkItemType)[keyof typeof WorkItemType];
export declare const Priority: {
    readonly LOW: "LOW";
    readonly MEDIUM: "MEDIUM";
    readonly HIGH: "HIGH";
    readonly URGENT: "URGENT";
    readonly CRITICAL: "CRITICAL";
};
export type Priority = (typeof Priority)[keyof typeof Priority];
export declare const WorkItemStatus: {
    readonly OPEN: "OPEN";
    readonly IN_PROGRESS: "IN_PROGRESS";
    readonly AWAITING_APPROVAL: "AWAITING_APPROVAL";
    readonly AWAITING_CUSTOMER: "AWAITING_CUSTOMER";
    readonly RESOLVED: "RESOLVED";
    readonly CLOSED: "CLOSED";
};
export type WorkItemStatus = (typeof WorkItemStatus)[keyof typeof WorkItemStatus];
export declare const TeamRole: {
    readonly VIEWER: "VIEWER";
    readonly MEMBER: "MEMBER";
    readonly LEAD: "LEAD";
    readonly ADMIN: "ADMIN";
};
export type TeamRole = (typeof TeamRole)[keyof typeof TeamRole];
export declare const SystemRole: {
    readonly OPERATOR: "OPERATOR";
    readonly SUPER_ADMIN: "SUPER_ADMIN";
};
export type SystemRole = (typeof SystemRole)[keyof typeof SystemRole];
export declare const TicketChannel: {
    readonly PORTAL: "PORTAL";
    readonly WIDGET: "WIDGET";
    readonly API: "API";
    readonly EMAIL: "EMAIL";
};
export type TicketChannel = (typeof TicketChannel)[keyof typeof TicketChannel];
export declare const ActivityAction: {
    readonly CREATED: "CREATED";
    readonly STATUS_CHANGED: "STATUS_CHANGED";
    readonly PRIORITY_CHANGED: "PRIORITY_CHANGED";
    readonly ASSIGNED: "ASSIGNED";
    readonly UNASSIGNED: "UNASSIGNED";
    readonly CLAIMED: "CLAIMED";
    readonly COMMENT_ADDED: "COMMENT_ADDED";
    readonly INTERNAL_NOTE_ADDED: "INTERNAL_NOTE_ADDED";
    readonly WORKFLOW_APPROVED: "WORKFLOW_APPROVED";
    readonly ESCALATED: "ESCALATED";
    readonly UPDATED: "UPDATED";
    readonly CUSTOMER_CONFIRMED: "CUSTOMER_CONFIRMED";
};
export type ActivityAction = (typeof ActivityAction)[keyof typeof ActivityAction];
export declare const ROLE_HIERARCHY: Record<TeamRole, number>;
export declare function hasMinimumRole(userRole: TeamRole | null | undefined, minimumRequired: TeamRole): boolean;
export declare const ALLOWED_TRANSITIONS: Record<WorkItemStatus, WorkItemStatus[]>;
export declare const SLA_DURATIONS_MINUTES: Record<Priority, number>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export type LoginInput = z.infer<typeof LoginSchema>;
export declare const CreateTicketSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    category: z.ZodDefault<z.ZodNativeEnum<{
        readonly INCIDENT: "INCIDENT";
        readonly CUSTOMER_ISSUE: "CUSTOMER_ISSUE";
        readonly PAYMENT: "PAYMENT";
        readonly COMPLIANCE: "COMPLIANCE";
        readonly TASK: "TASK";
    }>>;
    priority: z.ZodDefault<z.ZodNativeEnum<{
        readonly LOW: "LOW";
        readonly MEDIUM: "MEDIUM";
        readonly HIGH: "HIGH";
        readonly URGENT: "URGENT";
        readonly CRITICAL: "CRITICAL";
    }>>;
    channel: z.ZodDefault<z.ZodNativeEnum<{
        readonly PORTAL: "PORTAL";
        readonly WIDGET: "WIDGET";
        readonly API: "API";
        readonly EMAIL: "EMAIL";
    }>>;
    teamSlug: z.ZodOptional<z.ZodString>;
    attachmentUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    title: string;
    description: string;
    category: "INCIDENT" | "CUSTOMER_ISSUE" | "PAYMENT" | "COMPLIANCE" | "TASK";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
    channel: "PORTAL" | "WIDGET" | "API" | "EMAIL";
    phone?: string | undefined;
    company?: string | undefined;
    teamSlug?: string | undefined;
    attachmentUrls?: string[] | undefined;
}, {
    name: string;
    email: string;
    title: string;
    description: string;
    phone?: string | undefined;
    company?: string | undefined;
    category?: "INCIDENT" | "CUSTOMER_ISSUE" | "PAYMENT" | "COMPLIANCE" | "TASK" | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    channel?: "PORTAL" | "WIDGET" | "API" | "EMAIL" | undefined;
    teamSlug?: string | undefined;
    attachmentUrls?: string[] | undefined;
}>;
export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export declare const CreateWorkItemSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodNativeEnum<{
        readonly INCIDENT: "INCIDENT";
        readonly CUSTOMER_ISSUE: "CUSTOMER_ISSUE";
        readonly PAYMENT: "PAYMENT";
        readonly COMPLIANCE: "COMPLIANCE";
        readonly TASK: "TASK";
    }>;
    priority: z.ZodDefault<z.ZodNativeEnum<{
        readonly LOW: "LOW";
        readonly MEDIUM: "MEDIUM";
        readonly HIGH: "HIGH";
        readonly URGENT: "URGENT";
        readonly CRITICAL: "CRITICAL";
    }>>;
    teamId: z.ZodString;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    type: "INCIDENT" | "CUSTOMER_ISSUE" | "PAYMENT" | "COMPLIANCE" | "TASK";
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";
    teamId: string;
    description?: string | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
}, {
    type: "INCIDENT" | "CUSTOMER_ISSUE" | "PAYMENT" | "COMPLIANCE" | "TASK";
    title: string;
    teamId: string;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
}>;
export type CreateWorkItemInput = z.infer<typeof CreateWorkItemSchema>;
export declare const UpdateWorkItemSchema: z.ZodObject<{
    version: z.ZodNumber;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodNativeEnum<{
        readonly LOW: "LOW";
        readonly MEDIUM: "MEDIUM";
        readonly HIGH: "HIGH";
        readonly URGENT: "URGENT";
        readonly CRITICAL: "CRITICAL";
    }>>;
    assigneeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    version: number;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
}, {
    version: number;
    title?: string | undefined;
    description?: string | undefined;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL" | undefined;
    assigneeId?: string | null | undefined;
    dueDate?: string | null | undefined;
}>;
export type UpdateWorkItemInput = z.infer<typeof UpdateWorkItemSchema>;
export declare const TransitionWorkItemSchema: z.ZodObject<{
    version: z.ZodNumber;
    targetStatus: z.ZodNativeEnum<{
        readonly OPEN: "OPEN";
        readonly IN_PROGRESS: "IN_PROGRESS";
        readonly AWAITING_APPROVAL: "AWAITING_APPROVAL";
        readonly AWAITING_CUSTOMER: "AWAITING_CUSTOMER";
        readonly RESOLVED: "RESOLVED";
        readonly CLOSED: "CLOSED";
    }>;
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    version: number;
    targetStatus: "OPEN" | "IN_PROGRESS" | "AWAITING_APPROVAL" | "AWAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
    reason?: string | undefined;
}, {
    version: number;
    targetStatus: "OPEN" | "IN_PROGRESS" | "AWAITING_APPROVAL" | "AWAITING_CUSTOMER" | "RESOLVED" | "CLOSED";
    reason?: string | undefined;
}>;
export type TransitionWorkItemInput = z.infer<typeof TransitionWorkItemSchema>;
export declare const AddCommentSchema: z.ZodObject<{
    body: z.ZodString;
    isInternal: z.ZodDefault<z.ZodBoolean>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        filename: z.ZodString;
        size: z.ZodOptional<z.ZodNumber>;
        format: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        filename: string;
        size?: number | undefined;
        format?: string | undefined;
    }, {
        url: string;
        filename: string;
        size?: number | undefined;
        format?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    isInternal: boolean;
    body: string;
    attachments?: {
        url: string;
        filename: string;
        size?: number | undefined;
        format?: string | undefined;
    }[] | undefined;
}, {
    body: string;
    isInternal?: boolean | undefined;
    attachments?: {
        url: string;
        filename: string;
        size?: number | undefined;
        format?: string | undefined;
    }[] | undefined;
}>;
export type AddCommentInput = z.infer<typeof AddCommentSchema>;
export declare const CsatFeedbackSchema: z.ZodObject<{
    rating: z.ZodNumber;
    feedback: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    rating: number;
    feedback?: string | undefined;
}, {
    rating: number;
    feedback?: string | undefined;
}>;
export type CsatFeedbackInput = z.infer<typeof CsatFeedbackSchema>;
export declare const CreateTeamSchema: z.ZodObject<{
    name: z.ZodString;
    slug: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug: string;
    description?: string | undefined;
}, {
    name: string;
    slug: string;
    description?: string | undefined;
}>;
export type CreateTeamInput = z.infer<typeof CreateTeamSchema>;
export declare const CreateUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    systemRole: z.ZodDefault<z.ZodNativeEnum<{
        readonly OPERATOR: "OPERATOR";
        readonly SUPER_ADMIN: "SUPER_ADMIN";
    }>>;
    teamMemberships: z.ZodOptional<z.ZodArray<z.ZodObject<{
        teamId: z.ZodString;
        role: z.ZodNativeEnum<{
            readonly VIEWER: "VIEWER";
            readonly MEMBER: "MEMBER";
            readonly LEAD: "LEAD";
            readonly ADMIN: "ADMIN";
        }>;
    }, "strip", z.ZodTypeAny, {
        teamId: string;
        role: "VIEWER" | "MEMBER" | "LEAD" | "ADMIN";
    }, {
        teamId: string;
        role: "VIEWER" | "MEMBER" | "LEAD" | "ADMIN";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    systemRole: "OPERATOR" | "SUPER_ADMIN";
    password: string;
    teamMemberships?: {
        teamId: string;
        role: "VIEWER" | "MEMBER" | "LEAD" | "ADMIN";
    }[] | undefined;
}, {
    name: string;
    email: string;
    password: string;
    systemRole?: "OPERATOR" | "SUPER_ADMIN" | undefined;
    teamMemberships?: {
        teamId: string;
        role: "VIEWER" | "MEMBER" | "LEAD" | "ADMIN";
    }[] | undefined;
}>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
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
//# sourceMappingURL=index.d.ts.map