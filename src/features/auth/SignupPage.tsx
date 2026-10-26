import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '@/components/layout/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { signupSchema, type SignupValues } from './schemas'
import { useAuth } from './useAuth'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema) })

  const onSubmit = handleSubmit(async ({ name, email, password }) => {
    setError(null)
    try {
      await signUp({ name, email, password })
      navigate('/documentos', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível criar a conta.')
    }
  })

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Criar conta</h1>
        <p className="text-sm text-muted-foreground">Leva menos de um minuto.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField id="name" label="Nome" error={errors.name?.message}>
          <Input id="name" autoComplete="name" {...register('name')} />
        </FormField>
        <FormField id="email" label="E-mail" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
        </FormField>
        <FormField id="password" label="Senha" error={errors.password?.message}>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
        </FormField>
        <FormField id="confirmPassword" label="Confirmar senha" error={errors.confirmPassword?.message}>
          <Input id="confirmPassword" type="password" autoComplete="new-password" {...register('confirmPassword')} />
        </FormField>

        {error && (
          <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/login" className="font-medium text-foreground underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  )
}
