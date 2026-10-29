"use client"

import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"

import { setUnauthorizedHandler, tokenStore } from "@/lib/api/client"
import { authApi } from "@/lib/api/endpoints"
import type { UserSummary } from "@/lib/types"

type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthContextValue {
  user: UserSummary | null
  status: AuthStatus
  isAdmin: boolean
  login: (email: string, password: string) => Promise<UserSummary>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserSummary | null>(null)
  const [status, setStatus] = React.useState<AuthStatus>("loading")
  const router = useRouter()
  const pathname = usePathname()
  const qc = useQueryClient()
  const pathRef = React.useRef(pathname)
  React.useEffect(() => {
    pathRef.current = pathname
  }, [pathname])

  const logout = React.useCallback(() => {
    tokenStore.clear()
    setUser(null)
    setStatus("unauthenticated")
    qc.clear()
  }, [qc])

  // Restore session on first load.
  React.useEffect(() => {
    const controller = new AbortController()
    const restore = tokenStore.get() ? authApi.me(controller.signal) : Promise.reject(new Error("No saved session"))
    restore
      .then((u) => {
        setUser(u)
        setStatus("authenticated")
      })
      .catch((err) => {
        if ((err as Error)?.name === "AbortError") return
        tokenStore.clear()
        setStatus("unauthenticated")
      })
    return () => controller.abort()
  }, [])

  // Any 401 from the API (expired token, deleted user) → back to login.
  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      logout()
      const next = pathRef.current && pathRef.current !== "/login" ? `?next=${encodeURIComponent(pathRef.current)}` : ""
      router.replace(`/login${next}`)
    })
    return () => setUnauthorizedHandler(null)
  }, [logout, router])

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    tokenStore.set(res.token)
    setUser(res.user)
    setStatus("authenticated")
    return res.user
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, status, isAdmin: user?.role === "ADMIN", login, logout }),
    [user, status, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
