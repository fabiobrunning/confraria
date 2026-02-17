import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logActivity } from '@/lib/activity-log'

// Whitelist of fields that can be updated on a member profile
const updateMemberSchema = z.object({
  full_name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  instagram: z.string().optional().nullable(),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_complement: z.string().optional().nullable(),
  address_neighborhood: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().optional().nullable(),
  address_cep: z.string().optional().nullable(),
  pre_registered: z.boolean().optional(),
}).strict()

// PUT - Update member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const adminProfile = profileData as { role: string } | null

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    // Validate and whitelist fields to prevent mass assignment
    const validation = updateMemberSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Update profile with only whitelisted fields
    const { data: profile, error } = await (supabase
      .from('profiles') as any)
      .update(validation.data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      profile,
      message: 'Member updated successfully',
    })
  } catch (error) {
    console.error('Error updating member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete member
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const adminProfile = profileData as { role: string } | null

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if member has quotas
    const { count: quotasCount } = await supabase
      .from('quotas')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', id)

    if (quotasCount && quotasCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete member with existing quotas' },
        { status: 400 }
      )
    }

    // Soft delete: set deleted_at instead of hard delete
    const { error: profileError } = await (supabase
      .from('profiles') as any)
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (profileError) {
      throw profileError
    }

    // Log activity
    await logActivity({
      userId: user.id,
      action: 'member.delete',
      entityType: 'profile',
      entityId: id,
    })

    return NextResponse.json({
      message: 'Member deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting member:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
