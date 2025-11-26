'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from './use-toast'

/**
 * Hook to check if the current user is an admin
 * @param redirectNonAdmin If true, redirects non-admin users to dashboard
 * @param showToast If true, shows a toast message for non-admin users
 * @returns An object with admin status and loading state
 */
export function useAdmin(redirectNonAdmin = false, showToast = false) {
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true)

      // Check if user is authenticated
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        if (redirectNonAdmin) {
          router.push('/auth')
        }
        setLoading(false)
        return
      }

      // Check if user is admin
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single()

      const data = profileData as { role: string } | null
      const userIsAdmin = data?.role === 'admin'
      setIsAdmin(userIsAdmin)

      // Redirect if not admin and redirectNonAdmin is true
      if (!userIsAdmin && redirectNonAdmin) {
        if (showToast) {
          toast({
            title: 'Acesso negado',
            description: 'Apenas administradores podem acessar esta pagina',
            variant: 'destructive',
          })
        }
        router.push('/dashboard')
      }

      setLoading(false)
    }

    checkAdmin()
  }, [router, redirectNonAdmin, showToast, toast, supabase])

  return { isAdmin, loading }
}
