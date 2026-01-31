/**
 * Zod schemas for pre-registration validation
 */

import { z } from 'zod';

/**
 * Schema for creating a new pre-registration
 * Used by admin when registering a new member
 */
export const createPreRegistrationSchema = z.object({
  member_id: z.string().uuid('ID do membro inválido'),
  send_method: z.enum(['whatsapp', 'sms']).default('whatsapp'),
  notes: z.string().optional(),
});

export type CreatePreRegistrationInput = z.infer<
  typeof createPreRegistrationSchema
>;

/**
 * Schema for pre-registration login
 * Used by members attempting to login with temporary credentials
 */
export const preRegistrationLoginSchema = z.object({
  phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Formato de telefone inválido'),
  temporary_password: z
    .string()
    .min(8, 'Senha inválida')
    .max(20, 'Senha inválida'),
});

export type PreRegistrationLoginInput = z.infer<
  typeof preRegistrationLoginSchema
>;

/**
 * Schema for resending credentials
 * Admin resends the same password to member
 */
export const resendCredentialsSchema = z.object({
  pre_registration_id: z.string().uuid('ID de pré-registro inválido'),
  send_method: z.enum(['whatsapp', 'sms']).default('whatsapp'),
  notes: z.string().optional(),
});

export type ResendCredentialsInput = z.infer<typeof resendCredentialsSchema>;

/**
 * Schema for regenerating password
 * Admin generates a new password for member
 */
export const regeneratePasswordSchema = z.object({
  pre_registration_id: z.string().uuid('ID de pré-registro inválido'),
  send_method: z.enum(['whatsapp', 'sms']).default('whatsapp'),
  notes: z.string().optional(),
});

export type RegeneratePasswordInput = z.infer<
  typeof regeneratePasswordSchema
>;

/**
 * Schema for setting permanent password (after first login)
 * Used by member to replace temporary password
 */
export const setPermanentPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(12, 'Senha deve ter pelo menos 12 caracteres')
      .max(128, 'Senha muito longa')
      .regex(/[A-Z]/, 'Senha deve conter letra maiúscula')
      .regex(/[a-z]/, 'Senha deve conter letra minúscula')
      .regex(/\d/, 'Senha deve conter número'),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Senhas não conferem',
    path: ['confirm_password'],
  });

export type SetPermanentPasswordInput = z.infer<
  typeof setPermanentPasswordSchema
>;

/**
 * Schema for listing pending registrations (admin)
 */
export const listPendingRegistrationsSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sort: z
    .enum(['created_at', 'first_accessed_at', 'send_count'])
    .default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  only_expired: z.boolean().default(false),
});

export type ListPendingRegistrationsInput = z.infer<
  typeof listPendingRegistrationsSchema
>;

/**
 * Schema for member details from pre-registration
 */
export const preRegistrationMemberSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string(),
  phone: z.string(),
  role: z.enum(['admin', 'member']),
  pre_registered: z.boolean(),
});

export type PreRegistrationMember = z.infer<
  typeof preRegistrationMemberSchema
>;
