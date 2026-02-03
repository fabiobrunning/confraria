'use client'

import { useEffect } from 'react'
import { useSidebarState } from '@/hooks/use-sidebar-state'

/**
 * Syncs sidebar collapsed state to the layout container's data attribute
 * This allows CSS to respond to sidebar state changes dynamically
 */
export function SidebarStateSync() {
  const { isCollapsed, isMounted } = useSidebarState()

  useEffect(() => {
    if (!isMounted) return

    // Find the layout container and update its data attribute
    const container = document.querySelector('[data-sidebar-state]')
    if (container) {
      container.setAttribute('data-sidebar-state', isCollapsed ? 'collapsed' : 'expanded')
    }
  }, [isCollapsed, isMounted])

  return null
}
