import type { TicketListParams } from "@/lib/types"

export const qk = {
  me: ["me"] as const,
  users: ["users"] as const,
  tickets: ["tickets"] as const,
  ticketList: (p: TicketListParams) => ["tickets", "list", p] as const,
  ticket: (id: number) => ["tickets", "detail", id] as const,
  messages: (id: number) => ["tickets", "detail", id, "messages"] as const,
  activity: (id: number) => ["tickets", "detail", id, "activity"] as const,
  dashboard: ["dashboard"] as const,
  settings: ["settings"] as const,
}
