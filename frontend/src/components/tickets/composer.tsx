"use client"

import { GlobeIcon, LockIcon, SendIcon, StickyNoteIcon } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/common/kbd"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useAddMessage } from "@/hooks/use-api"
import { errorMessage } from "@/lib/api/client"
import type { MessageType, Ticket } from "@/lib/types"
import { cn } from "@/lib/utils"
import { MESSAGE_MAX } from "@/lib/validation"

export function Composer({ ticket }: { ticket: Ticket }) {
  const [mode, setMode] = React.useState<MessageType>("REPLY")
  const [body, setBody] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)
  const add = useAddMessage(ticket.id)
  const isNote = mode === "NOTE"
  const trimmed = body.trim()
  const tooLong = body.length > MESSAGE_MAX
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  async function submit() {
    if (!trimmed) {
      setError(isNote ? "Write a note before saving" : "Write a reply before sending")
      textareaRef.current?.focus()
      return
    }
    if (tooLong) {
      setError(`Keep it under ${MESSAGE_MAX} characters`)
      return
    }
    setError(null)
    try {
      await add.mutateAsync({ type: mode, body: trimmed })
      setBody("")
      toast.success(isNote ? "Internal note added" : "Reply sent")
    } catch (err) {
      setError(errorMessage(err, isNote ? "Couldn't save the note" : "Couldn't send the reply"))
    }
  }

  return (
    <div
      className={cn(
        "rounded-lg border shadow-xs transition-colors",
        isNote ? "border-dashed border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10" : "bg-card",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as MessageType); setError(null) }}>
          <TabsList>
            <TabsTrigger value="REPLY" className="gap-1.5">
              <GlobeIcon /> Public reply
            </TabsTrigger>
            <TabsTrigger value="NOTE" className="gap-1.5 data-[state=active]:text-amber-800 dark:data-[state=active]:text-amber-200">
              <LockIcon /> Internal note
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <p className={cn("text-xs", isNote ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground")}>
          {isNote ? "Only visible to your team" : `Visible to ${ticket.customerName ?? ticket.customerEmail ?? "the customer"}`}
        </p>
      </div>
      <div className="p-3">
        <Textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void submit()
            }
          }}
          rows={4}
          aria-label={isNote ? "Write an internal note" : "Write a reply to the customer"}
          aria-invalid={!!error}
          placeholder={isNote ? "Add context for your team — the customer won't see this." : "Write a reply to the customer…"}
          className={cn("min-h-24 resize-y border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 dark:bg-transparent")}
          disabled={add.isPending}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2">
        <div className="text-xs">
          {error ? (
            <span role="alert" className="text-destructive">{error}</span>
          ) : (
            <span className={cn("text-muted-foreground", tooLong && "text-destructive")}>
              {body.length > MESSAGE_MAX * 0.8 ? `${body.length}/${MESSAGE_MAX} · ` : ""}
              <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> to {isNote ? "save" : "send"}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => void submit()}
          disabled={add.isPending}
          className={cn(isNote && "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500 dark:text-amber-950 dark:hover:bg-amber-400")}
        >
          {add.isPending ? <Spinner /> : isNote ? <StickyNoteIcon /> : <SendIcon />}
          {isNote ? "Add note" : "Send reply"}
        </Button>
      </div>
    </div>
  )
}
