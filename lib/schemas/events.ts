import { z } from 'zod'

export const createEventSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  description: z.string().min(1, 'Descrição é obrigatória'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Hora deve estar no formato HH:MM'),
  deadline: z.string().datetime({ message: 'Deadline deve ser uma data/hora válida ISO 8601' }),
  confirmation_limit: z.number().int().min(1, 'Limite deve ser pelo menos 1'),
})

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(['active', 'cancelled']).optional(),
})

export const confirmAttendanceSchema = z.object({
  user_phone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato de telefone inválido. Use: (00) 00000-0000'),
  confirmed_count: z.number().int().min(1).max(4, 'Máximo de 4 pessoas'),
})
