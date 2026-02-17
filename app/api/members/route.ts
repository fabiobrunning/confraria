import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-response'
import { logActivity } from '@/lib/activity-log'

// GET - List all members
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create new member (pre-registration)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const adminProfile = profileData as { role: string } | null

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { full_name, phone, role } = body

    if (!full_name || !phone || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate temporary password (6 digits)
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString()

    // Clean phone number (remove formatting)
    const cleanPhone = phone.replace(/\D/g, '')
    const email = `${cleanPhone}@confraria.local`

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
      },
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('Failed to create user')
    }

    // Create profile
    const { data: profile, error: profileError } = await (supabase
      .from('profiles') as any)
      .insert({
        id: authData.user.id,
        full_name,
        phone,
        role,
        pre_registered: true,
      })
      .select()
      .single()

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw profileError
    }

    // Log activity
    await logActivity({
      userId: session.user.id,
      action: 'member.create',
      entityType: 'profile',
      entityId: authData.user.id,
      metadata: { full_name, phone, role },
    })

    return NextResponse.json({
      profile,
      tempPassword,
      message: 'Member created successfully',
    })
  } catch (error) {
    return apiError(500, 'Erro ao criar membro', error)
  }
}
