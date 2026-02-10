import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { ProspectInsert } from '@/lib/supabase/types';

// Validacao com Zod
const prospectSchema = z.object({
  first_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  last_name: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone invalido'),
  email: z.string().email('E-mail invalido'),
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres'),
  business_sector: z.string().min(2, 'Setor deve ter pelo menos 2 caracteres'),
  how_found_us: z.enum(['instagram', 'linkedin', 'referral', 'google', 'event', 'other']),
  has_networking_experience: z.boolean(),
  networking_experience: z.string().optional(),
});

export type ProspectData = z.infer<typeof prospectSchema>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados
    const validationResult = prospectSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados invalidos',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Criar cliente Supabase
    const supabase = await createClient();

    const insertData: ProspectInsert = {
      full_name: `${data.first_name} ${data.last_name}`.trim(),
      phone: data.phone,
      email: data.email,
      company_name: data.company_name,
      business_sector: data.business_sector,
      how_found_us: data.how_found_us,
      has_networking_experience: data.has_networking_experience,
      networking_experience: data.networking_experience || null,
      status: 'new',
    };

    // Type assertion needed: generated types resolve insert as 'never' for prospects
    const { data: prospect, error } = await supabase
      .from('prospects')
      .insert(insertData as never)
      .select('id')
      .single();

    if (error) {
      console.error('Erro ao inserir prospect:', error);

      // Verificar se eh erro de duplicidade (email ja existe)
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'Este e-mail ja esta cadastrado. Entraremos em contato em breve!'
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { success: false, error: 'Erro ao salvar dados. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Cadastro realizado com sucesso!',
        data: { id: (prospect as { id: string } | null)?.id }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Metodo nao permitido' },
    { status: 405 }
  );
}
