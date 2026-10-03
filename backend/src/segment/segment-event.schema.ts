import { z } from 'zod';

const identifier = z.string().trim().min(1).max(255);

export const segmentEventSchema = z.object({
  type: z.literal('identify'),
  userId: identifier,

  context: z.object({
    personas: z.object({
      computation_class: z.literal('audience'),
      computation_id: identifier,
      computation_key: identifier,
    }),
  }),

  traits: z
    .object({
      name: z.string().trim().min(1).max(255).nullish(),
      email: z.string().email().max(320).nullish(),
      phone: z
        .string()
        .regex(/^\+[1-9]\d{1,14}$/)
        .nullish(),
    })
    .catchall(z.unknown()),
});