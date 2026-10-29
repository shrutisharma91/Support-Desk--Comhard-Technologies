import { api } from "@/lib/api/client"
import type {
  Activity,
  CreateMessageInput,
  CreateTicketInput,
  DashboardStats,
  LoginResponse,
  Message,
  Paginated,
  Settings,
  Ticket,
  TicketListParams,
  UpdateTicketInput,
  UserSummary,
} from "@/lib/types"

export const authApi = {
  login: (email: string, password: string) =>
    api<LoginResponse>("/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: (signal?: AbortSignal) => api<UserSummary>("/auth/me", { signal }),
}

export const usersApi = {
  list: (signal?: AbortSignal) => api<UserSummary[]>("/users", { signal }),
}

export const ticketsApi = {
  list: (params: TicketListParams, signal?: AbortSignal) =>
    api<Paginated<Ticket>>("/tickets", {
      signal,
      query: {
        q: params.q?.trim() || undefined,
        status: params.status,
        priority: params.priority,
        assigneeId: params.assigneeId,
        overdue: params.overdue ? "true" : undefined,
        slaBreached: params.slaBreached ? "true" : undefined,
        sort: params.sort,
        order: params.order,
        page: params.page,
        pageSize: params.pageSize,
      },
    }),
  get: (id: number, signal?: AbortSignal) => api<Ticket>(`/tickets/${id}`, { signal }),
  create: (input: CreateTicketInput) => api<Ticket>("/tickets", { method: "POST", body: input }),
  update: (id: number, input: UpdateTicketInput) =>
    api<Ticket>(`/tickets/${id}`, { method: "PATCH", body: input }),
  remove: (id: number) => api<void>(`/tickets/${id}`, { method: "DELETE" }),
  messages: (id: number, signal?: AbortSignal) => api<Message[]>(`/tickets/${id}/messages`, { signal }),
  addMessage: (id: number, input: CreateMessageInput) =>
    api<Message>(`/tickets/${id}/messages`, { method: "POST", body: input }),
  activity: (id: number, signal?: AbortSignal) => api<Activity[]>(`/tickets/${id}/activity`, { signal }),
}

export const dashboardApi = {
  stats: (signal?: AbortSignal) => api<DashboardStats>("/dashboard/stats", { signal }),
}

export const settingsApi = {
  get: (signal?: AbortSignal) => api<Settings>("/settings", { signal }),
  update: (input: Settings) => api<Settings>("/settings", { method: "PATCH", body: input }),
}
