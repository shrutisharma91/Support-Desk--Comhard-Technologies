"use client"

import {
  AlarmClockIcon,
  CircleAlertIcon,
  HeadsetIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  PlusIcon,
  SettingsIcon,
  SunIcon,
  TimerOffIcon,
  UserIcon,
  UserXIcon,
  ChevronsUpDownIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { UserAvatar } from "@/components/common/user-avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useDashboardStats } from "@/hooks/use-api"

type View = { label: string; href: string; icon: React.ElementType; match: Record<string, string>; count?: number; tone?: string }

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const stats = useDashboardStats()
  const s = stats.data

  const views: View[] = [
    { label: "Assigned to me", href: "/tickets?assignee=me", icon: UserIcon, match: { assignee: "me" } },
    { label: "Unassigned", href: "/tickets?assignee=unassigned&status=OPEN,IN_PROGRESS,WAITING_ON_CUSTOMER", icon: UserXIcon, match: { assignee: "unassigned" }, count: s?.unassigned },
    { label: "Urgent", href: "/tickets?priority=URGENT&status=OPEN,IN_PROGRESS,WAITING_ON_CUSTOMER", icon: CircleAlertIcon, match: { priority: "URGENT" }, count: s?.urgent, tone: "text-red-600 dark:text-red-400" },
    { label: "Overdue", href: "/tickets?overdue=1&sort=created&order=asc", icon: AlarmClockIcon, match: { overdue: "1" }, count: s?.overdue, tone: "text-red-600 dark:text-red-400" },
    { label: "SLA breached", href: "/tickets?sla=1&sort=created&order=asc", icon: TimerOffIcon, match: { sla: "1" }, count: s?.slaBreached, tone: "text-orange-600 dark:text-orange-400" },
  ]

  const onTickets = pathname === "/tickets"
  const activeView = onTickets ? views.find((v) => Object.entries(v.match).every(([k, val]) => searchParams.get(k) === val)) : undefined

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <HeadsetIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold">Support Desk</span>
                  <span className="truncate text-xs text-muted-foreground">Customer support</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem className="mt-1">
            <SidebarMenuButton asChild tooltip="New ticket" className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
              <Link href="/tickets/new">
                <PlusIcon />
                <span>New ticket</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"} tooltip="Dashboard">
                  <Link href="/">
                    <LayoutDashboardIcon />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={(onTickets && !activeView) || (pathname.startsWith("/tickets/") && pathname !== "/tickets/new")}
                  tooltip="All tickets"
                >
                  <Link href="/tickets">
                    <InboxIcon />
                    <span>All tickets</span>
                  </Link>
                </SidebarMenuButton>
                {s ? <SidebarMenuBadge>{s.total}</SidebarMenuBadge> : null}
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Views</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {views.map((v) => (
                <SidebarMenuItem key={v.label}>
                  <SidebarMenuButton asChild isActive={activeView?.label === v.label} tooltip={v.label}>
                    <Link href={v.href}>
                      <v.icon className={v.tone} />
                      <span>{v.label}</span>
                    </Link>
                  </SidebarMenuButton>
                  {v.count ? <SidebarMenuBadge className={v.tone}>{v.count}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
                  <Link href="/settings">
                    <SettingsIcon />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                  <UserAvatar name={user?.name} className="size-8 text-xs" />
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
                <DropdownMenuLabel className="flex items-center justify-between gap-2 font-normal">
                  <span className="truncate text-sm font-medium">{user?.name}</span>
                  <Badge variant={user?.role === "ADMIN" ? "default" : "secondary"}>
                    {user?.role === "ADMIN" ? "Admin" : "Agent"}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <SunIcon className="size-4 dark:hidden" />
                    <MoonIcon className="hidden size-4 dark:block" />
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                      <DropdownMenuRadioItem value="light"><SunIcon /> Light</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark"><MoonIcon /> Dark</DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="system"><MonitorIcon /> System</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout()
                    router.replace("/login")
                  }}
                >
                  <LogOutIcon /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function SidebarSkeletonFallback() {
  return <div className="hidden w-64 shrink-0 border-r bg-sidebar md:block" />
}

