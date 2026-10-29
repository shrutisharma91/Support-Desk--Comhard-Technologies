import { z } from "zod"

import { TICKET_PRIORITIES, TICKET_STATUSES } from "@/lib/types"

// Client-side mirror of the server rules in docs/API_CONTRACT.md (the server re-validates).
export const ticketDetailsSchema = z
  .object({
    subject: z.string().trim().min(1, "Subject is required").min(3, "Subject must be at least 3 characters").max(200, "Keep the subject under 200 characters"),
    customerName: z.string().trim().max(120, "Name is too long"),
    customerEmail: z
      .string()
      .trim()
      .max(254, "Email is too long")
      .refine((v) => v === "" || z.email().safeParse(v).success, "Enter a valid email address"),
    description: z.string().trim().min(1, "Description is required").max(5000, "Keep the description under 5000 characters"),
  })
  .refine((v) => v.customerName !== "" || v.customerEmail !== "", {
    message: "Provide a customer name or email",
    path: ["customer"],
  })

export const createTicketSchema = ticketDetailsSchema.and(
  z.object({
    priority: z.enum(TICKET_PRIORITIES),
    status: z.enum(TICKET_STATUSES),
    assigneeId: z.string(), // "none" | "<id>"
  }),
)

export type TicketDetailsValues = z.infer<typeof ticketDetailsSchema>
/** Errors may also carry the cross-field "customer" rule (from zod or the server). */
export type TicketDetailsErrorKeys = TicketDetailsValues & { customer?: string }
export type CreateTicketValues = z.infer<typeof createTicketSchema>

export const MESSAGE_MAX = 5000
