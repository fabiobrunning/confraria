import { createClient } from '@/lib/supabase/server'

type ActivityAction =
  | 'member.create'
  | 'member.update'
  | 'member.delete'
  | 'member.generate_password'
  | 'pre_registration.create'
  | 'pre_registration.regenerate_password'
  | 'pre_registration.resend_credentials'
  | 'company.create'
  | 'company.delete'
  | 'group.create'
  | 'group.delete'
  | 'draw.execute'
  | 'prospect.update'

interface LogActivityParams {
  userId: string
  action: ActivityAction
  entityType: string
  entityId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}

/**
 * Log an activity to the activity_logs table.
 * Fire-and-forget — errors are logged but don't propagate.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await createClient()

    await (supabase as any)
      .from('activity_logs')
      .insert({
        user_id: params.userId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        metadata: params.metadata || {},
        ip_address: params.ipAddress || null,
      })
  } catch (error) {
    // Fire-and-forget: don't break the main flow
    console.error('[ActivityLog] Failed to log activity:', error)
  }
}
