"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function HeaderBreadcrumb() {
  const pathname = usePathname()
  const crumbs: { label: string; href?: string }[] = []

  if (pathname === "/") crumbs.push({ label: "Dashboard" })
  else if (pathname === "/settings") crumbs.push({ label: "Settings" })
  else if (pathname.startsWith("/tickets")) {
    const rest = pathname.split("/").filter(Boolean).slice(1)
    if (rest.length === 0) crumbs.push({ label: "Tickets" })
    else {
      crumbs.push({ label: "Tickets", href: "/tickets" })
      crumbs.push({ label: rest[0] === "new" ? "New ticket" : `#${rest[0]}` })
    }
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((c, i) => (
          <React.Fragment key={c.label}>
            {i > 0 ? <BreadcrumbSeparator /> : null}
            <BreadcrumbItem>
              {c.href ? (
                <BreadcrumbLink asChild>
                  <Link href={c.href}>{c.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{c.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
