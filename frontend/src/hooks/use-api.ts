"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { dashboardApi, settingsApi, ticketsApi, usersApi } from "@/lib/api/endpoints"
import { qk } from "@/lib/api/query-keys"
import type {
  CreateMessageInput,
  CreateTicketInput,
  Settings,
  Ticket,
  TicketListParams,
  UpdateTicketInput,
} from "@/lib/types"

export function useUsers() {
  return useQuery({
    queryKey: qk.users,
    queryFn: ({ signal }) => usersApi.list(signal),
    staleTime: 5 * 60_000,
  })
}

export function useTickets(params: TicketListParams) {
  return useQuery({
    queryKey: qk.ticketList(params),
    queryFn: ({ signal }) => ticketsApi.list(params, signal),
    placeholderData: keepPreviousData,
  })
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: qk.ticket(id),
    queryFn: ({ signal }) => ticketsApi.get(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useMessages(id: number) {
  return useQuery({
    queryKey: qk.messages(id),
    queryFn: ({ signal }) => ticketsApi.messages(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useActivity(id: number) {
  return useQuery({
    queryKey: qk.activity(id),
    queryFn: ({ signal }) => ticketsApi.activity(id, signal),
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: ({ signal }) => dashboardApi.stats(signal),
    refetchInterval: 60_000,
  })
}

export function useSettings() {
  return useQuery({
    queryKey: qk.settings,
    queryFn: ({ signal }) => settingsApi.get(signal),
  })
}

/** Ticket writes change list rows, dashboard counts and (for a detail) activity — refresh all of it. */
function useTicketWriteSync() {
  const qc = useQueryClient()
  return (ticket?: Ticket) => {
    if (ticket) qc.setQueryData(qk.ticket(ticket.id), ticket)
    qc.invalidateQueries({ queryKey: [...qk.tickets, "list"] })
    qc.invalidateQueries({ queryKey: qk.dashboard })
    if (ticket) qc.invalidateQueries({ queryKey: qk.activity(ticket.id) })
  }
}

export function useCreateTicket() {
  const sync = useTicketWriteSync()
  return useMutation({
    mutationFn: (input: CreateTicketInput) => ticketsApi.create(input),
    onSuccess: (ticket) => sync(ticket),
  })
}

export function useUpdateTicket(id: number) {
  const sync = useTicketWriteSync()
  return useMutation({
    mutationFn: (input: UpdateTicketInput) => ticketsApi.update(id, input),
    onSuccess: (ticket) => sync(ticket),
  })
}

export function useDeleteTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ticketsApi.remove(id),
    onSuccess: (_void, id) => {
      qc.removeQueries({ queryKey: qk.ticket(id) })
      qc.invalidateQueries({ queryKey: [...qk.tickets, "list"] })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useAddMessage(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateMessageInput) => ticketsApi.addMessage(id, input),
    onSuccess: (message) => {
      qc.setQueryData(qk.messages(id), (prev: import("@/lib/types").Message[] | undefined) =>
        prev ? [...prev, message] : [message],
      )
      qc.invalidateQueries({ queryKey: qk.messages(id) })
      qc.invalidateQueries({ queryKey: qk.activity(id) })
      qc.invalidateQueries({ queryKey: qk.ticket(id) })
      qc.invalidateQueries({ queryKey: [...qk.tickets, "list"] })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}

export function useUpdateSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Settings) => settingsApi.update(input),
    onSuccess: (settings) => {
      qc.setQueryData(qk.settings, settings)
      qc.invalidateQueries({ queryKey: qk.tickets })
      qc.invalidateQueries({ queryKey: qk.dashboard })
    },
  })
}
