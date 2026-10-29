"use client"

import { InboxIcon, PlusIcon, SearchXIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { EmptyState, ErrorState } from "@/components/common/states"
import { PageHeader } from "@/components/layout/page-header"
import { TicketFiltersBar } from "@/components/tickets/ticket-filters-bar"
import { TicketPagination } from "@/components/tickets/ticket-pagination"
import { TicketTable, TicketTableSkeleton } from "@/components/tickets/ticket-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { useTickets } from "@/hooks/use-api"
import { toApiParams, useTicketFilters } from "@/hooks/use-ticket-filters"

export function TicketsView() {
  const { filters, setFilters, clearFilters, activeCount } = useTicketFilters()
  const params = React.useMemo(() => toApiParams(filters), [filters])
  const query = useTickets(params)
  const meta = query.data?.meta

  // If filters shrink the result set below the current page, jump to the last valid page.
  React.useEffect(() => {
    if (meta && meta.totalPages > 0 && filters.page > meta.totalPages) {
      setFilters({ page: meta.totalPages }, { resetPage: false })
    }
  }, [meta, filters.page, setFilters])

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Tickets
            {query.isFetching && !query.isLoading ? <Spinner className="size-4 text-muted-foreground" /> : null}
          </span>
        }
        description={
          meta ? `${meta.total} ticket${meta.total === 1 ? "" : "s"}${activeCount ? " match your filters" : " in total"}` : "Receive, organise, assign and resolve customer issues."
        }
        actions={
          <Button asChild>
            <Link href="/tickets/new">
              <PlusIcon /> New ticket
            </Link>
          </Button>
        }
      />

      <TicketFiltersBar filters={filters} setFilters={setFilters} clearFilters={clearFilters} activeCount={activeCount} />

      <Card className="gap-0 overflow-hidden py-0">
        {query.isLoading ? (
          <TicketTableSkeleton rows={filters.pageSize > 10 ? 10 : filters.pageSize} />
        ) : query.isError && !query.data ? (
          <ErrorState error={query.error} title="Couldn't load tickets" onRetry={() => query.refetch()} className="py-16" />
        ) : query.data && query.data.data.length === 0 ? (
          activeCount ? (
            <EmptyState
              className="py-16"
              icon={<SearchXIcon />}
              title="No tickets match these filters"
              description="Try a different search term or remove some filters."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              className="py-16"
              icon={<InboxIcon />}
              title="No tickets yet"
              description="When customers reach out, their issues will show up here."
              action={
                <Button asChild size="sm">
                  <Link href="/tickets/new">
                    <PlusIcon /> Create the first ticket
                  </Link>
                </Button>
              }
            />
          )
        ) : query.data ? (
          <>
            <TicketTable tickets={query.data.data} dimmed={query.isPlaceholderData} />
            <TicketPagination
              meta={query.data.meta}
              onPageChange={(page) => setFilters({ page }, { resetPage: false })}
              onPageSizeChange={(pageSize) => setFilters({ pageSize })}
            />
          </>
        ) : null}
      </Card>
    </div>
  )
}
