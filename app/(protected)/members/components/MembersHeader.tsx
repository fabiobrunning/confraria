'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserPlus, Users } from 'lucide-react'

interface MembersHeaderProps {
  isAdmin: boolean
  totalMembers: number
}

export function MembersHeader({ isAdmin, totalMembers }: MembersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Membros
          </h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {totalMembers} {totalMembers === 1 ? 'membro ativo' : 'membros ativos'}
        </p>
      </div>

      {isAdmin && (
        <Button asChild>
          <Link href="/pre-register">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Membro
          </Link>
        </Button>
      )}
    </div>
  )
}
