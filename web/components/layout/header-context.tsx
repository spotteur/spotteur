'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { type NavigationType } from '@/lib/type/app'

type HeaderContextValue = {
  breadcrumbs: React.ReactNode | null
  setBreadcrumbs: (node: React.ReactNode | null) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  navigations: NavigationType[] | null
  setNavigations: (navigations: NavigationType[] | null) => void
}

const HeaderContext = createContext<HeaderContextValue | null>(null)

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumbs, setBreadcrumbs] = useState<React.ReactNode | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [navigations, setNavigations] = useState<NavigationType[] | null>(null)

  const value = useMemo(
    () => ({ breadcrumbs, setBreadcrumbs, isLoading, setIsLoading, navigations, setNavigations }),
    [breadcrumbs, isLoading, navigations],
  )

  return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}

export function useHeaderContext() {
  const ctx = useContext(HeaderContext)
  if (!ctx) {
    throw new Error('useHeaderContext must be used within HeaderProvider')
  }
  return ctx
}

export function useHeaderBreadcrumbs(node: React.ReactNode | null, isLoading?: boolean) {
  const { setBreadcrumbs, setIsLoading } = useHeaderContext()

  useEffect(() => {
    setBreadcrumbs(node)
    if (isLoading !== undefined) {
      setIsLoading(isLoading)
    }

    return () => {
      setBreadcrumbs(null)
      setIsLoading(false)
    }
  }, [node, isLoading, setBreadcrumbs, setIsLoading])
}

export function useHeaderNavigations(navigations?: NavigationType[]) {
  const { setNavigations } = useHeaderContext()

  useEffect(() => {
    if (navigations) {
      return setNavigations(navigations)
    }
  }, [navigations, setNavigations])
}
