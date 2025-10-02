import { z } from 'zod';

// Schema para autenticação
export const authSchema = z.object({
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido. Use: (00) 00000-0000'),
  password: z
    .string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(50, 'Senha deve ter no máximo 50 caracteres'),
});

// Schema para perfil de membro
export const memberProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido'),
  instagram: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith('@'), {
      message: 'Instagram deve começar com @'
    }),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  cep: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{5}-?\d{3}$/.test(val), {
      message: 'CEP deve ter o formato 00000-000'
    }),
});

// Schema para empresa
export const companySchema = z.object({
  name: z
    .string()
    .min(2, 'Nome da empresa deve ter pelo menos 2 caracteres')
    .max(200, 'Nome da empresa deve ter no máximo 200 caracteres'),
  cnpj: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(val), {
      message: 'CNPJ deve ter o formato 00.000.000/0000-00'
    }),
  description: z
    .string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .optional(),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(val), {
      message: 'Formato de telefone inválido'
    }),
  instagram: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith('@'), {
      message: 'Instagram deve começar com @'
    }),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  cep: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{5}-?\d{3}$/.test(val), {
      message: 'CEP deve ter o formato 00000-000'
    }),
});

// Schema para grupo de consórcio
export const consortiumGroupSchema = z.object({
  description: z
    .string()
    .min(3, 'Descrição deve ter pelo menos 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  total_quotas: z
    .number()
    .min(1, 'Deve ter pelo menos 1 cota')
    .max(1000, 'Máximo de 1000 cotas permitidas'),
  quota_value: z
    .number()
    .min(0.01, 'Valor da cota deve ser maior que zero')
    .max(999999.99, 'Valor da cota muito alto'),
  duration_months: z
    .number()
    .min(1, 'Duração deve ser de pelo menos 1 mês')
    .max(240, 'Duração máxima de 240 meses (20 anos)'),
});

// Schema para alteração de senha
export const passwordChangeSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(50, 'Nova senha deve ter no máximo 50 caracteres'),
  confirmPassword: z
    .string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Schema para pré-cadastro
export const preRegisterSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido'),
  role: z.enum(['member', 'admin'], {
    errorMap: () => ({ message: 'Tipo de usuário inválido' })
  }),
});

// Tipos TypeScript derivados dos schemas
export type AuthFormData = z.infer<typeof authSchema>;
export type MemberProfileFormData = z.infer<typeof memberProfileSchema>;
export type CompanyFormData = z.infer<typeof companySchema>;
export type ConsortiumGroupFormData = z.infer<typeof consortiumGroupSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type PreRegisterFormData = z.infer<typeof preRegisterSchema>;