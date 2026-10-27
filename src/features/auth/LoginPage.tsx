import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FormField } from '@/components/layout/FormField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'
import { loginSchema, type LoginValues } from './schemas'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const from = (location.state as { from?: string } | null)?.from ?? '/documentos'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await signIn(values)
      navigate(from, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não conseguimos entrar agora. Tente de novo.')
    }
  })

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold">Entrar na sua conta</h1>
        <p className="text-muted-foreground">Use seu e-mail e sua senha para enviar e buscar documentos.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField id="email" label="E-mail" error={errors.email?.message}>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            autoCapitalize="none"
            placeholder="voce@exemplo.com"
            {...register('email')}
          />
        </FormField>
        <FormField id="password" label="Senha" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" {...register('password')} />
        </FormField>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-foreground">{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner /> Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <p className="text-center text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4">
          Criar conta
        </Link>
      </p>
    </div>
  )
}
