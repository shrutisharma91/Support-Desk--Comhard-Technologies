"use client"

import { UserAvatar } from "@/components/common/user-avatar"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUsers } from "@/hooks/use-api"
import { cn } from "@/lib/utils"

/** value: "none" for unassigned, otherwise the user id as a string. */
export function AssigneeSelect({
  value,
  onChange,
  disabled,
  id,
  className,
  currentUserId,
}: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  id?: string
  className?: string
  currentUserId?: number
}) {
  const users = useUsers()
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled || users.isLoading}>
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={users.isLoading ? "Loading agents…" : "Unassigned"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Unassigned</span>
        </SelectItem>
        {users.data?.length ? <SelectSeparator /> : null}
        {users.data?.map((u) => (
          <SelectItem key={u.id} value={String(u.id)}>
            <UserAvatar name={u.name} className="size-5" />
            {u.name}
            {u.id === currentUserId ? <span className="text-xs text-muted-foreground">(you)</span> : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
