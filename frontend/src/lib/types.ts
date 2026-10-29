// Mirrors docs/API_CONTRACT.md — keep in sync.

export const TICKET_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_ON_CUSTOMER", "RESOLVED"] as const
export const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const
export const MESSAGE_TYPES = ["REPLY", "NOTE"] as const
export const USER_ROLES = ["ADMIN", "AGENT"] as const

export type TicketStatus = (typeof TICKET_STATUSES)[number]
export type TicketPriority = (typeof TICKET_PRIORITIES)[number]
export type MessageType = (typeof MESSAGE_TYPES)[number]
export type UserRole = (typeof USER_ROLES)[number]

export type ActivityType =
  | "TICKET_CREATED"
  | "STATUS_CHANGED"
  | "PRIORITY_CHANGED"
  | "ASSIGNEE_CHANGED"
  | "DETAILS_UPDATED"
  | "REPLY_ADDED"
  | "NOTE_ADDED"

export interface UserSummary {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface Ticket {
  id: number
  subject: string
  customerName: string | null
  customerEmail: string | null
  description: string
  status: TicketStatus
  priority: TicketPriority
  assignee: UserSummary | null
  createdBy: UserSummary | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
  firstResponseAt: string | null
  messageCount: number
  isOverdue: boolean
  slaDueAt: string
  slaBreached: boolean
}

export interface Message {
  id: number
  ticketId: number
  type: MessageType
  body: string
  author: UserSummary | null
  createdAt: string
}

export interface Activity {
  id: number
  ticketId: number
  type: ActivityType
  actor: UserSummary | null
  fromValue: string | null
  toValue: string | null
  createdAt: string
}

export interface PageMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  data: T[]
  meta: PageMeta
}

export interface DashboardStats {
  total: number
  open: number
  inProgress: number
  waitingOnCustomer: number
  resolved: number
  urgent: number
  overdue: number
  slaBreached: number
  unassigned: number
  slaHours: number
}

export interface Settings {
  slaHours: number
}

export interface LoginResponse {
  token: string
  user: UserSummary
}

export type TicketSort = "updated" | "priority" | "created"
export type SortOrder = "asc" | "desc"

export interface TicketListParams {
  q?: string
  status?: TicketStatus[]
  priority?: TicketPriority[]
  assigneeId?: number | "unassigned" | "me"
  overdue?: boolean
  slaBreached?: boolean
  sort?: TicketSort
  order?: SortOrder
  page?: number
  pageSize?: number
}

export interface CreateTicketInput {
  subject: string
  customerName?: string | null
  customerEmail?: string | null
  description: string
  priority?: TicketPriority
  status?: TicketStatus
  assigneeId?: number | null
}

export type UpdateTicketInput = Partial<CreateTicketInput>

export interface CreateMessageInput {
  type: MessageType
  body: string
}

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: Record<string, string>
  }
}
