import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '@/components/layout/FormField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Spinner } from '@/components/ui/spinner'
import { EmailConfirmationRequiredError } from '@/services'
import { signupSchema, type SignupValues } from './schemas'
import { useAuth } from './useAuth'

export function SignupPage() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null)

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
      // Cadastro feito: falta só abrir o link do e-mail. Isso é uma boa notícia, não um erro.
      if (e instanceof EmailConfirmationRequiredError) setConfirmEmail(e.email)
      else setError(e instanceof Error ? e.message : 'Não conseguimos criar a conta agora. Tente de novo.')
    }
  })

  if (confirmEmail) {
    return (
      <div className="space-y-6">
        <Alert variant="success">
          <AlertTitle>Quase lá!</AlertTitle>
          <AlertDescription className="text-foreground">
            Enviamos um link para <strong className="break-all">{confirmEmail}</strong>. Abra o e-mail e toque no link
            para entrar. Se não encontrar, olhe também a caixa de spam.
          </AlertDescription>
        </Alert>
        <Link to="/login" className={buttonVariants({ size: 'lg', className: 'w-full' })}>
          Ir para Entrar
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold">Criar sua conta</h1>
        <p className="text-muted-foreground">Leva menos de um minuto. Depois é só enviar documentos e fazer perguntas.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField id="name" label="Seu nome" error={errors.name?.message}>
          <Input id="name" autoComplete="name" placeholder="Maria Souza" {...register('name')} />
        </FormField>
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
        <FormField id="password" label="Crie uma senha" hint="Use pelo menos 6 caracteres." error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" {...register('password')} />
        </FormField>
        <FormField id="confirmPassword" label="Repita a senha" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" {...register('confirmPassword')} />
        </FormField>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-foreground">{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner /> Criando conta…
            </>
          ) : (
            'Criar conta'
          )}
        </Button>
      </form>

      <p className="text-center text-muted-foreground">
        Já tem conta?{' '}
        <Link to="/login" className="inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  )
}
