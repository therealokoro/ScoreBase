import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.email("Please provide a valid email address"),
  password: z.string("A password is required to login")
})

export type LoginInputType = z.infer<typeof LoginSchema>