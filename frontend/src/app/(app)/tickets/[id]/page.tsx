import type { Metadata } from "next"

import { TicketDetailView } from "@/components/tickets/ticket-detail-view"

export const metadata: Metadata = { title: "Ticket" }

export default function TicketDetailPage() {
  return <TicketDetailView />
}
