"use client"

import type { FieldErrors, UseFormRegister } from "react-hook-form"

import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { TicketDetailsErrorKeys } from "@/lib/validation"

/** Subject / customer / description — shared by the create page and the edit dialog. */
export function TicketDetailsFields({
  register,
  errors,
  idPrefix = "t",
  onCustomerChange,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>
  errors: FieldErrors<TicketDetailsErrorKeys>
  idPrefix?: string
  /** Called when name/email change, so a cross-field "customer" error can be cleared. */
  onCustomerChange?: () => void
}) {
  const customerError = !!errors.customer
  return (
    <FieldGroup className="gap-5">
      <Field data-invalid={!!errors.subject}>
        <FieldLabel htmlFor={`${idPrefix}-subject`}>
          Subject <span className="text-destructive">*</span>
        </FieldLabel>
        <Input
          id={`${idPrefix}-subject`}
          placeholder="Short summary of the issue"
          aria-invalid={!!errors.subject}
          {...register("subject")}
        />
        <FieldError errors={[errors.subject]} />
      </Field>

      <div className="space-y-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={!!errors.customerName || customerError}>
            <FieldLabel htmlFor={`${idPrefix}-customerName`}>Customer name</FieldLabel>
            <Input
              id={`${idPrefix}-customerName`}
              placeholder="e.g. Kabir Rao"
              autoComplete="off"
              aria-invalid={!!errors.customerName || customerError}
              {...register("customerName", { onChange: onCustomerChange })}
            />
            <FieldError errors={[errors.customerName]} />
          </Field>
          <Field data-invalid={!!errors.customerEmail || customerError}>
            <FieldLabel htmlFor={`${idPrefix}-customerEmail`}>Customer email</FieldLabel>
            <Input
              id={`${idPrefix}-customerEmail`}
              type="email"
              placeholder="e.g. kabir@example.com"
              autoComplete="off"
              aria-invalid={!!errors.customerEmail || customerError}
              {...register("customerEmail", { onChange: onCustomerChange })}
            />
            <FieldError errors={[errors.customerEmail]} />
          </Field>
        </div>
        {customerError ? (
          <FieldError>{errors.customer?.message}</FieldError>
        ) : (
          <FieldDescription>
            At least one of name or email is required <span className="text-destructive">*</span>
          </FieldDescription>
        )}
      </div>

      <Field data-invalid={!!errors.description}>
        <FieldLabel htmlFor={`${idPrefix}-description`}>
          Description <span className="text-destructive">*</span>
        </FieldLabel>
        <Textarea
          id={`${idPrefix}-description`}
          rows={6}
          className="max-h-80"
          placeholder="What is the customer reporting? Include steps, error messages, order IDs…"
          aria-invalid={!!errors.description}
          {...register("description")}
        />
        <FieldError errors={[errors.description]} />
      </Field>
    </FieldGroup>
  )
}
