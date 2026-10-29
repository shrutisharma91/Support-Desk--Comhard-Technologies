"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LockIcon, SaveIcon, TimerIcon } from "lucide-react"
import * as React from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { useAuth } from "@/components/auth/auth-provider"
import { ErrorState } from "@/components/common/states"
import { UserAvatar } from "@/components/common/user-avatar"
import { PageHeader } from "@/components/layout/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { useSettings, useUpdateSettings, useUsers } from "@/hooks/use-api"
import { errorMessage } from "@/lib/api/client"
import { applyServerErrors } from "@/lib/form-errors"

const schema = z.object({
  slaHours: z.coerce
    .number({ message: "Enter a number of hours" })
    .int("Use whole hours")
    .min(1, "Minimum is 1 hour")
    .max(168, "Maximum is 168 hours (7 days)"),
})
type FormIn = z.input<typeof schema>
type FormOut = z.output<typeof schema>

function SlaCard() {
  const { isAdmin } = useAuth()
  const settings = useSettings()
  const save = useUpdateSettings()
  const form = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema), defaultValues: { slaHours: 4 } })
  const { errors, isSubmitting, isDirty } = form.formState

  React.useEffect(() => {
    if (settings.data) form.reset({ slaHours: settings.data.slaHours })
  }, [settings.data, form])

  const onSubmit = form.handleSubmit(async (v) => {
    try {
      const res = await save.mutateAsync({ slaHours: v.slaHours })
      form.reset({ slaHours: res.slaHours })
      toast.success(`First-response target set to ${res.slaHours}h`)
    } catch (err) {
      if (!applyServerErrors(err, form.setError, ["slaHours"])) toast.error(errorMessage(err, "Couldn't save settings"))
    }
  })

  return (
    <Card>
      <form onSubmit={onSubmit} noValidate>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TimerIcon className="size-4 text-muted-foreground" /> Response-time target (SLA)
          </CardTitle>
          <CardDescription>
            A ticket is flagged <span className="font-medium text-orange-700 dark:text-orange-400">SLA breached</span> when
            it has no public reply within this many hours of being created. Separate from the fixed 24h overdue rule.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!isAdmin ? (
            <Alert>
              <LockIcon />
              <AlertDescription>Only admins can change the SLA target.</AlertDescription>
            </Alert>
          ) : null}
          {settings.isLoading ? (
            <Skeleton className="h-16 w-48" />
          ) : settings.isError ? (
            <ErrorState error={settings.error} onRetry={() => settings.refetch()} className="py-4" />
          ) : (
            <Field data-invalid={!!errors.slaHours} className="max-w-xs">
              <FieldLabel htmlFor="slaHours">First response within</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="slaHours"
                  type="number"
                  min={1}
                  max={168}
                  step={1}
                  inputMode="numeric"
                  className="w-28"
                  disabled={!isAdmin}
                  aria-invalid={!!errors.slaHours}
                  {...form.register("slaHours")}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <FieldError errors={[errors.slaHours]} />
              <FieldDescription>Between 1 and 168 hours.</FieldDescription>
            </Field>
          )}
        </CardContent>
        {isAdmin ? (
          <CardFooter className="justify-end border-t pt-6">
            <Button type="submit" disabled={isSubmitting || !isDirty || settings.isLoading}>
              {isSubmitting ? <Spinner /> : <SaveIcon />}
              Save
            </Button>
          </CardFooter>
        ) : null}
      </form>
    </Card>
  )
}

function TeamCard() {
  const users = useUsers()
  const { user } = useAuth()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
        <CardDescription>Agents who can be assigned tickets.</CardDescription>
      </CardHeader>
      <CardContent>
        {users.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : users.isError ? (
          <ErrorState error={users.error} onRetry={() => users.refetch()} className="py-4" />
        ) : (
          <ul className="divide-y">
            {users.data?.map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <UserAvatar name={u.name} className="size-8 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.name} {u.id === user?.id ? <span className="text-muted-foreground">(you)</span> : null}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role === "ADMIN" ? "Admin" : "Agent"}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function SettingsView() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Settings" description="Workspace configuration and team." />
      <SlaCard />
      <TeamCard />
    </div>
  )
}
