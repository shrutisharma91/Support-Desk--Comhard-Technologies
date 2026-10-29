"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PencilIcon } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { TicketDetailsFields } from "@/components/tickets/ticket-details-fields"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { useUpdateTicket } from "@/hooks/use-api"
import { errorMessage } from "@/lib/api/client"
import { applyServerErrors } from "@/lib/form-errors"
import type { Ticket, UpdateTicketInput } from "@/lib/types"
import { ticketDetailsSchema, type TicketDetailsValues } from "@/lib/validation"

const FIELDS = ["subject", "customerName", "customerEmail", "description", "customer"] as const

function toValues(t: Ticket): TicketDetailsValues {
  return {
    subject: t.subject,
    customerName: t.customerName ?? "",
    customerEmail: t.customerEmail ?? "",
    description: t.description,
  }
}

export function EditTicketDialog({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = React.useState(false)
  const update = useUpdateTicket(ticket.id)
  const form = useForm<TicketDetailsValues>({
    resolver: zodResolver(ticketDetailsSchema),
    defaultValues: toValues(ticket),
  })
  const { errors, isSubmitting } = form.formState

  React.useEffect(() => {
    if (open) form.reset(toValues(ticket))
  }, [open, ticket, form])

  const onSubmit = form.handleSubmit(async (v) => {
    // Send only what changed — keeps the activity log honest.
    const before = toValues(ticket)
    const patch: UpdateTicketInput = {}
    if (v.subject !== before.subject) patch.subject = v.subject
    if (v.customerName !== before.customerName) patch.customerName = v.customerName || null
    if (v.customerEmail !== before.customerEmail) patch.customerEmail = v.customerEmail || null
    if (v.description !== before.description) patch.description = v.description
    if (Object.keys(patch).length === 0) {
      setOpen(false)
      return
    }
    try {
      await update.mutateAsync(patch)
      toast.success("Ticket details updated")
      setOpen(false)
    } catch (err) {
      if (!applyServerErrors(err, form.setError, FIELDS)) toast.error(errorMessage(err, "Couldn't save changes"))
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PencilIcon /> Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <DialogHeader>
            <DialogTitle>Edit ticket #{ticket.id}</DialogTitle>
            <DialogDescription>Update the subject, customer, or description. Changes are recorded in the history.</DialogDescription>
          </DialogHeader>
          <TicketDetailsFields
            register={form.register}
            errors={errors}
            idPrefix="edit"
            onCustomerChange={() => form.clearErrors("customer" as never)}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : null}
              {isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
