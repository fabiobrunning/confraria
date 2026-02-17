const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load .env.local only if env vars not already set
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
}

function secureRandomInt(max) {
  return crypto.randomBytes(4).readUInt32BE(0) % max;
}

function generatePassword(len = 12) {
  const up = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lo = 'abcdefghijklmnopqrstuvwxyz';
  const nu = '0123456789';
  const all = up + lo + nu;
  const pw = [
    up[secureRandomInt(up.length)],
    lo[secureRandomInt(lo.length)],
    nu[secureRandomInt(nu.length)],
  ];
  for (let i = 3; i < len; i++) pw.push(all[secureRandomInt(all.length)]);
  for (let i = pw.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [pw[i], pw[j]] = [pw[j], pw[i]];
  }
  return pw.join('');
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('Buscando membros pré-cadastrados...\n');

  // Strategy 1: Check pre_registration_attempts table
  const { data: pending } = await supabase
    .from('pre_registration_attempts')
    .select('id, member_id, profiles!member_id(id, full_name, phone)')
    .is('first_accessed_at', null)
    .gt('expiration_date', new Date().toISOString());

  // Strategy 2: Find all profiles with pre_registered = true (main source)
  const { data: preRegistered, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, phone, pre_registered')
    .eq('pre_registered', true)
    .is('deleted_at', null);

  if (profileErr) {
    console.error('Erro ao buscar profiles:', profileErr);
    return;
  }

  // Merge: all pre_registered profiles (may or may not have a pre_registration_attempts record)
  const memberIds = new Set();
  const members = [];

  if (preRegistered) {
    for (const p of preRegistered) {
      if (!memberIds.has(p.id)) {
        memberIds.add(p.id);
        members.push(p);
      }
    }
  }

  if (pending) {
    for (const att of pending) {
      const m = Array.isArray(att.profiles) ? att.profiles[0] : att.profiles;
      if (m && !memberIds.has(m.id)) {
        memberIds.add(m.id);
        members.push(m);
      }
    }
  }

  if (members.length === 0) {
    console.log('Nenhum membro pré-cadastrado encontrado.');
    return;
  }

  console.log(`Encontrados: ${members.length} membro(s) pré-cadastrado(s)\n`);

  const results = [];
  for (const member of members) {
    const newPw = generatePassword(12);

    // 1. Sync to Supabase Auth (plaintext — Auth hashes internally)
    const { error: authErr } = await supabase.auth.admin.updateUserById(
      member.id,
      { password: newPw }
    );

    if (authErr) {
      results.push({ name: member.full_name, phone: member.phone, status: 'error', error: authErr.message });
      continue;
    }

    // 2. Create/update pre_registration_attempts record
    const hash = await bcrypt.hash(newPw, 12);

    // Check if record already exists
    const { data: existing } = await supabase
      .from('pre_registration_attempts')
      .select('id')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase.from('pre_registration_attempts').update({
        temporary_password_hash: hash,
        password_generated_at: new Date().toISOString(),
        access_attempts: 0,
        locked_until: null,
        expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      // Find an admin to use as created_by
      const { data: admin } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      if (admin) {
        await supabase.from('pre_registration_attempts').insert({
          member_id: member.id,
          created_by_admin_id: admin.id,
          temporary_password_hash: hash,
          send_method: 'whatsapp',
          send_count: 1,
          last_sent_at: new Date().toISOString(),
        });
      }
    }

    results.push({ name: member.full_name, phone: member.phone, newPassword: newPw, status: 'success' });
  }

  console.log('=== RESULTADOS ===\n');
  for (const r of results) {
    if (r.status === 'success') {
      console.log(`OK  ${r.name} | ${r.phone} | Senha: ${r.newPassword}`);
    } else {
      console.log(`ERR ${r.name || '?'} | ${r.error}`);
    }
  }

  const ok = results.filter(r => r.status === 'success').length;
  const fail = results.filter(r => r.status === 'error').length;
  console.log(`\nTotal: ${ok} sucesso, ${fail} erro(s)`);
}

main().catch(console.error);
