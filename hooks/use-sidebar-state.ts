'use client'

import { useState, useEffect } from 'react'

/**
 * Hook to manage sidebar collapse state
 * Persists state in localStorage for better UX
 */
export function useSidebarState() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) {
      setIsCollapsed(saved === 'true')
    }
    setIsMounted(true)
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newState = !prev
      localStorage.setItem('sidebar-collapsed', String(newState))
      return newState
    })
  }

  return {
    isCollapsed,
    toggleCollapse,
    isMounted,
  }
}
