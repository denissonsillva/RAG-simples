import { RefreshCw, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { documentsCopy } from '@/lib/copy'

interface ActionProps {
  label: string
  /** Quando desabilitado, explica o porquê no tooltip e no nome acessível. */
  disabledReason?: string
  disabled?: boolean
  onClick: () => void
  icon: ReactNode
  destructive?: boolean
}

function IconAction({ label, disabledReason, disabled, onClick, icon, destructive }: ActionProps) {
  const explained = disabled && disabledReason
  return (
    <Tooltip>
      {/* Botão desabilitado não recebe foco nem mouse; o span leva a dica para teclado e mouse. */}
      <TooltipTrigger render={<span className="inline-flex" tabIndex={disabled ? 0 : undefined} />}>
        <Button
          variant="ghost"
          className={destructive ? 'size-11 hover:bg-destructive/10 hover:text-destructive' : 'size-11'}
          size="icon"
          aria-label={explained ? `${label}. ${disabledReason}` : label}
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{explained ? disabledReason : label}</TooltipContent>
    </Tooltip>
  )
}

interface Props {
  name: string
  isOwner: boolean
  processing: boolean
  onReprocess: () => void
  onDelete: () => void
}

export function DocumentActions({ name, isOwner, processing, onReprocess, onDelete }: Props) {
  return (
    <div className="flex shrink-0 items-center">
      <IconAction
        label={`Processar de novo "${name}"`}
        disabled={!isOwner || processing}
        disabledReason={!isOwner ? documentsCopy.onlyOwnerReprocess : 'Este documento já está sendo processado.'}
        onClick={onReprocess}
        icon={<RefreshCw className="size-5" aria-hidden />}
      />
      <IconAction
        label={`Excluir "${name}"`}
        disabled={!isOwner}
        disabledReason={documentsCopy.onlyOwnerDelete}
        onClick={onDelete}
        icon={<Trash2 className="size-5" aria-hidden />}
        destructive
      />
    </div>
  )
}
