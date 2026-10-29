import type { TicketPriority, TicketStatus } from "@/lib/types"

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/$/, "")

export const OVERDUE_HOURS = 24

export const STATUS_META: Record<
  TicketStatus,
  { label: string; dot: string; badge: string }
> = {
  OPEN: {
    label: "Open",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30",
  },
  IN_PROGRESS: {
    label: "In Progress",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  },
  WAITING_ON_CUSTOMER: {
    label: "Waiting on Customer",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30",
  },
  RESOLVED: {
    label: "Resolved",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  },
}

export const PRIORITY_META: Record<
  TicketPriority,
  { label: string; rank: number; text: string; bars: number; barColor: string; badge: string }
> = {
  LOW: {
    label: "Low",
    rank: 1,
    bars: 1,
    text: "text-slate-600 dark:text-slate-400",
    barColor: "bg-slate-400",
    badge: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30",
  },
  MEDIUM: {
    label: "Medium",
    rank: 2,
    bars: 2,
    text: "text-sky-700 dark:text-sky-300",
    barColor: "bg-sky-500",
    badge: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  },
  HIGH: {
    label: "High",
    rank: 3,
    bars: 3,
    text: "text-orange-700 dark:text-orange-300",
    barColor: "bg-orange-500",
    badge: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  },
  URGENT: {
    label: "Urgent",
    rank: 4,
    bars: 4,
    text: "text-red-700 dark:text-red-300",
    barColor: "bg-red-500",
    badge: "bg-red-600 text-white border-red-600 dark:bg-red-500 dark:border-red-500",
  },
}

export const FIELD_LABELS: Record<string, string> = {
  subject: "Subject",
  customerName: "Customer name",
  customerEmail: "Customer email",
  description: "Description",
}
