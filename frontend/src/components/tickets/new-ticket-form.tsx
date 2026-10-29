"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon, SendIcon } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { useAuth } from "@/components/auth/auth-provider"
import { PageHeader } from "@/components/layout/page-header"
import { AssigneeSelect } from "@/components/tickets/assignee-select"
import { PrioritySelect, StatusSelect } from "@/components/tickets/enum-selects"
import { TicketDetailsFields } from "@/components/tickets/ticket-details-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { useCreateTicket } from "@/hooks/use-api"
import { errorMessage } from "@/lib/api/client"
import { applyServerErrors } from "@/lib/form-errors"
import { createTicketSchema, type CreateTicketValues } from "@/lib/validation"

const FIELDS = ["subject", "customerName", "customerEmail", "description", "priority", "status", "assigneeId", "customer"] as const

export function NewTicketForm() {
  const router = useRouter()
  const { user } = useAuth()
  const create = useCreateTicket()

  const form = useForm<CreateTicketValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      customerName: "",
      customerEmail: "",
      description: "",
      priority: "MEDIUM",
      status: "OPEN",
      assigneeId: "none",
    },
  })
  const { errors, isSubmitting } = form.formState

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const ticket = await create.mutateAsync({
        subject: v.subject,
        customerName: v.customerName || null,
        customerEmail: v.customerEmail || null,
        description: v.description,
        priority: v.priority,
        status: v.status,
        assigneeId: v.assigneeId === "none" ? null : Number(v.assigneeId),
      })
      toast.success(`Ticket #${ticket.id} created`)
      router.push(`/tickets/${ticket.id}`)
    } catch (err) {
      if (!applyServerErrors(err, form.setError, FIELDS)) toast.error(errorMessage(err, "Couldn't create the ticket"))
    }
  })

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button variant="ghost" size="sm" asChild className="-ml-2 text-muted-foreground">
        <Link href="/tickets">
          <ArrowLeftIcon /> Back to tickets
        </Link>
      </Button>
      <PageHeader title="New ticket" description="Log a customer issue so the team can pick it up." />

      <form onSubmit={onSubmit} noValidate>
        <Card>
          <CardHeader>
            <CardTitle>Issue details</CardTitle>
            <CardDescription>Fields marked * are required.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <TicketDetailsFields
              register={form.register}
              errors={errors}
              idPrefix="new"
              onCustomerChange={() => form.clearErrors("customer" as never)}
            />

            <div className="grid gap-4 border-t pt-6 sm:grid-cols-3">
              <Field>
                <FieldLabel htmlFor="new-priority">Priority</FieldLabel>
                <Controller
                  control={form.control}
                  name="priority"
                  render={({ field }) => <PrioritySelect id="new-priority" value={field.value} onChange={field.onChange} />}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new-status">Status</FieldLabel>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => <StatusSelect id="new-status" value={field.value} onChange={field.onChange} />}
                />
              </Field>
              <Field data-invalid={!!errors.assigneeId}>
                <FieldLabel htmlFor="new-assignee">Assignee</FieldLabel>
                <Controller
                  control={form.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <AssigneeSelect id="new-assignee" value={field.value} onChange={field.onChange} currentUserId={user?.id} />
                  )}
                />
                {errors.assigneeId ? (
                  <p className="text-sm text-destructive">{errors.assigneeId.message}</p>
                ) : (
                  <FieldDescription>
                    <button
                      type="button"
                      className="underline-offset-4 hover:underline"
                      onClick={() => user && form.setValue("assigneeId", String(user.id))}
                    >
                      Assign to me
                    </button>
                  </FieldDescription>
                )}
              </Field>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t">
            <Button type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <SendIcon />}
              {isSubmitting ? "Creating…" : "Create ticket"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
