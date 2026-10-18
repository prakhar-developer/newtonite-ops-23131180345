const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(
    public override message: string,
    public statusCode: number,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getAuthToken(): string | null {
  return localStorage.getItem('instos_token');
}

function generateIdempotencyKey(): string {
  return `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Auto-inject Idempotency-Key on mutations if not explicitly set
  const method = (options.method || 'GET').toUpperCase();
  if (['POST', 'PATCH', 'PUT'].includes(method) && !headers.has('Idempotency-Key')) {
    headers.set('Idempotency-Key', generateIdempotencyKey());
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(
      body?.error?.message || `Request failed with status ${res.status}`,
      res.status,
      body?.error?.code || 'UNKNOWN_ERROR',
      body?.error?.details || body
    );
  }

  return body.data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<any>('/auth/me'),

  // Work Items (Internal Ops)
  getKpis: () => request<any>('/items/kpis'),
  listWorkItems: (params: Record<string, string | number | boolean | undefined> = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, String(val));
      }
    });
    const qs = searchParams.toString();
    return request<{ items: any[]; nextCursor: string | null; hasMore: boolean }>(`/items${qs ? `?${qs}` : ''}`);
  },
  getWorkItemById: (id: string) => request<any>(`/items/${id}`),
  createWorkItem: (data: any) =>
    request<any>('/items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  claimWorkItem: (id: string) =>
    request<any>(`/items/${id}/claim`, {
      method: 'POST',
    }),
  updateWorkItem: (id: string, data: any) =>
    request<any>(`/items/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  transitionWorkItem: (id: string, data: { version: number; targetStatus: string; reason?: string }) =>
    request<any>(`/items/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  addComment: (id: string, data: { body: string; isInternal?: boolean; attachments?: any[] }) =>
    request<any>(`/items/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Public Tickets (Customer Portal & Widget)
  createTicket: (data: any) =>
    request<any>('/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getTicketByToken: (token: string) => request<any>(`/tickets/track/${token}`),
  addCustomerMessage: (token: string, data: { body: string; attachments?: any[] }) =>
    request<any>(`/tickets/track/${token}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  submitCsatFeedback: (token: string, data: { rating: number; feedback?: string }) =>
    request<any>(`/tickets/track/${token}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Teams & Governance
  listTeams: () => request<any[]>('/teams'),
  listPublicTeams: () => request<any[]>('/teams/public'),
  createTeam: (data: any) =>
    request<any>('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Users & Roles
  listUsers: () => request<any[]>('/users'),
  createUser: (data: any) =>
    request<any>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUserRole: (userId: string, teamId: string, role: string) =>
    request<any>(`/users/${userId}/role`, {
      method: 'POST',
      body: JSON.stringify({ teamId, role }),
    }),

  // Settings & Outbox Monitor
  getPublicBranding: () => request<any>('/settings/branding'),
  updateBranding: (data: any) =>
    request<any>('/settings/branding', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getOutboxStats: () => request<any>('/settings/outbox/stats'),
  retryOutboxJob: (jobId: string) =>
    request<any>(`/settings/outbox/retry/${jobId}`, {
      method: 'POST',
    }),
};
