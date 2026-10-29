"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { HeadsetIcon, LogInIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useAuth } from "@/components/auth/auth-provider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { errorMessage } from "@/lib/api/client"

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
type Values = z.infer<typeof schema>

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@demo.local", password: "admin123" },
  { label: "Agent", email: "riya@demo.local", password: "agent123" },
]

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/"
}

export function LoginForm() {
  const { login, status } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const next = safeNext(params.get("next"))
  const [formError, setFormError] = React.useState<string | null>(null)

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } })
  const { errors, isSubmitting } = form.formState

  React.useEffect(() => {
    if (status === "authenticated") router.replace(next)
  }, [status, router, next])

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values.email, values.password)
      router.replace(next)
    } catch (err) {
      setFormError(errorMessage(err, "Sign in failed"))
    }
  })

  return (
    <Card className="relative w-full max-w-sm shadow-lg">
      <CardHeader className="items-center text-center">
        <div className="mx-auto mb-2 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <HeadsetIcon className="size-5" />
        </div>
        <CardTitle className="text-xl">Sign in to Support Desk</CardTitle>
        <CardDescription>Use your agent account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup className="gap-4">
            {formError ? (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <Field data-invalid={!!errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@company.com"
                aria-invalid={!!errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field data-invalid={!!errors.password}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                {...form.register("password")}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner /> : <LogInIcon />}
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <div className="flex w-full items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" /> Demo accounts <Separator className="flex-1" />
        </div>
        <div className="grid w-full grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((a) => (
            <Button
              key={a.email}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto flex-col items-start gap-0 py-2"
              onClick={() => {
                form.setValue("email", a.email, { shouldValidate: true })
                form.setValue("password", a.password, { shouldValidate: true })
              }}
            >
              <span className="font-medium">{a.label}</span>
              <span className="text-[11px] font-normal text-muted-foreground">{a.email}</span>
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
