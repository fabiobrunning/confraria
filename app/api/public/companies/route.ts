import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/public/companies — sem autenticação, usado na home pública
export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, website, instagram')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [], {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
