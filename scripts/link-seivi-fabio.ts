// Script para vincular Seivi ao Fabio
// Executar: npx tsx scripts/link-seivi-fabio.ts

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 1. Buscar Fabio
  const { data: fabio, error: fabioError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .ilike('full_name', '%fabio%')
    .single()

  if (fabioError || !fabio) {
    console.error('Erro ao buscar Fabio:', fabioError)
    return
  }
  console.log('Fabio encontrado:', fabio)

  // 2. Buscar Seivi
  const { data: seivi, error: seiviError } = await supabase
    .from('companies')
    .select('id, name')
    .ilike('name', '%seivi%')
    .single()

  if (seiviError || !seivi) {
    console.error('Erro ao buscar Seivi:', seiviError)
    return
  }
  console.log('Seivi encontrada:', seivi)

  // 3. Verificar se vinculo ja existe
  const { data: existing } = await supabase
    .from('member_companies')
    .select('id')
    .eq('member_id', fabio.id)
    .eq('company_id', seivi.id)
    .single()

  if (existing) {
    console.log('Vinculo ja existe!')
    return
  }

  // 4. Criar vinculo
  const { data: link, error: linkError } = await supabase
    .from('member_companies')
    .insert({
      member_id: fabio.id,
      company_id: seivi.id
    })
    .select()
    .single()

  if (linkError) {
    console.error('Erro ao criar vinculo:', linkError)
    return
  }

  console.log('Vinculo criado com sucesso:', link)
}

main()
