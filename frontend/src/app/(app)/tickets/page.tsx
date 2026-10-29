import type { Metadata } from "next"
import { Suspense } from "react"

import { TicketsView } from "@/components/tickets/tickets-view"
import { TicketTableSkeleton } from "@/components/tickets/ticket-table"

export const metadata: Metadata = { title: "Tickets" }

export default function TicketsPage() {
  return (
    <Suspense fallback={<TicketTableSkeleton />}>
      <TicketsView />
    </Suspense>
  )
}
