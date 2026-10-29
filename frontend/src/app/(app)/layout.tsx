"use client"

import { HeadsetIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { AppSidebar, SidebarSkeletonFallback } from "@/components/layout/app-sidebar"
import { HeaderBreadcrumb } from "@/components/layout/header-breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(pathname && pathname !== "/" ? `/login?next=${encodeURIComponent(pathname)}` : "/login")
    }
  }, [status, router, pathname])

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-3 text-muted-foreground">
        <HeadsetIcon className="size-6" />
        <div className="flex items-center gap-2 text-sm">
          <Spinner /> Loading workspace…
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <React.Suspense fallback={<SidebarSkeletonFallback />}>
        <AppSidebar />
      </React.Suspense>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <HeaderBreadcrumb />
        </header>
        <div className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
