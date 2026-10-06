import { z } from 'zod'

const EnvSchema = z
  .object({
    VITE_API_URL: z.string().url().optional(),
    VITE_RAZORPAY_KEY_ID: z.string().min(1).optional(),
  })
  .passthrough()

export const env = EnvSchema.parse(import.meta.env)

