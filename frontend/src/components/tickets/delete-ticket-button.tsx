"use client"

import { Trash2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { useDeleteTicket } from "@/hooks/use-api"
import { errorMessage } from "@/lib/api/client"
import type { Ticket } from "@/lib/types"

/** Admin-only. Deleting cascades to replies, notes and history on the server (no orphans). */
export function DeleteTicketButton({ ticket }: { ticket: Ticket }) {
  const [open, setOpen] = React.useState(false)
  const del = useDeleteTicket()
  const router = useRouter()

  async function onConfirm() {
    try {
      await del.mutateAsync(ticket.id)
      toast.success(`Ticket #${ticket.id} deleted`)
      setOpen(false)
      router.push("/tickets")
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the ticket"))
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
          <Trash2Icon /> Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete ticket #{ticket.id}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes “{ticket.subject}” along with its {ticket.messageCount} repl
            {ticket.messageCount === 1 ? "y/note" : "ies/notes"} and full activity history. This can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={del.isPending}>Cancel</AlertDialogCancel>
          <Button variant="destructive" onClick={onConfirm} disabled={del.isPending}>
            {del.isPending ? <Spinner /> : <Trash2Icon />}
            Delete ticket
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
