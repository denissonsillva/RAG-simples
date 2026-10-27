import { cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FormFieldProps {
  id: string
  label: string
  /** Explicação curta sempre visível abaixo do campo. */
  hint?: ReactNode
  error?: string
  children: ReactNode
}

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  // O campo aponta para a dica e para o erro; com erro, também fica marcado como inválido.
  const field = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(error ? { 'aria-invalid': true } : {}),
      })
    : children

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {field}
      {hint && (
        <p id={hintId} className="text-[0.8125rem] text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
