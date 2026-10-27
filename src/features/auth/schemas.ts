import { z } from 'zod'

const email = z
  .string()
  .min(1, 'Digite seu e-mail.')
  .email('Esse e-mail não parece certo. Confira se tem o @ e o final, como .com.')

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Digite sua senha.'),
})

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Digite seu nome.'),
    email,
    password: z.string().min(6, 'Use pelo menos 6 caracteres na senha.'),
    confirmPassword: z.string().min(1, 'Digite a senha de novo para confirmar.'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas estão diferentes. Digite a mesma nas duas.',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
