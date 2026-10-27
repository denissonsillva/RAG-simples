import { FileText, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { FileTypeIcon } from '@/components/ui/file-type-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/features/auth/useAuth'
import { documentsCopy, friendlyDocumentError } from '@/lib/copy'
import { formatBytes, formatDate } from '@/lib/format'
import type { Document, DocumentStatus } from '@/services'
import { DocumentActions } from './DocumentActions'
import { useDeleteDocument, useDocuments, useReprocessDocument } from './hooks'
import { StatusBadge } from './StatusBadge'

export function DocumentsPage() {
  const { data, isLoading, isError, refetch } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const reprocessDocument = useReprocessDocument()
  const { user } = useAuth()
  const [toDelete, setToDelete] = useState<Document | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const lastStatus = useRef<Map<string, DocumentStatus>>(new Map())

  // Avisa leitores de tela quando um documento muda de situação (a lista se atualiza sozinha).
  useEffect(() => {
    if (!data) return
    const previous = lastStatus.current
    for (const d of data) {
      const before = previous.get(d.id)
      if (before && before !== d.status) setAnnouncement(documentsCopy.announce(d.name, d.status))
    }
    lastStatus.current = new Map(data.map((d) => [d.id, d.status]))
  }, [data])

  const reprocess = ({ id, name }: Document) =>
    reprocessDocument.mutate(id, {
      onSuccess: () => toast.success(documentsCopy.reprocessOk(name)),
      onError: () => toast.error(documentsCopy.reprocessError),
    })

  const confirmDelete = () => {
    if (!toDelete) return
    const { id, name } = toDelete
    setToDelete(null)
    deleteDocument.mutate(id, {
      onSuccess: () => toast.success(documentsCopy.deleteOk(name)),
      onError: () => toast.error(documentsCopy.deleteError),
    })
  }

  const hasDocuments = !!data && data.length > 0

  return (
    <>
      <PageHeader
        title={documentsCopy.title}
        description={documentsCopy.description}
        actions={
          hasDocuments && (
            <Link to="/documentos/novo" className={buttonVariants()}>
              <Upload aria-hidden />
              Enviar documento
            </Link>
          )
        }
      />

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Carregando documentos">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription className="text-foreground">{documentsCopy.loadError}</AlertDescription>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </Alert>
      )}

      {data && data.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed bg-card p-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-brand-soft text-primary">
            <FileText className="size-7" aria-hidden />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-medium">{documentsCopy.empty.title}</h2>
            <p className="text-muted-foreground">{documentsCopy.empty.body}</p>
          </div>
          <Link to="/documentos/novo" className={buttonVariants({ size: 'lg' })}>
            <Upload aria-hidden />
            Enviar documento
          </Link>
        </div>
      )}

      {hasDocuments && (
        <ul className="divide-y overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10">
          {data.map((doc) => {
            const isOwner = doc.uploadedById === user?.id
            return (
              <li key={doc.id} className="px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:flex-nowrap">
                  <FileTypeIcon name={doc.name} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="truncate font-medium" title={doc.name}>
                      {doc.name}
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums sm:truncate">
                      {formatBytes(doc.sizeBytes)} · enviado por {doc.uploadedBy} · {formatDate(doc.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.status === 'ready' && (
                      <span className="hidden text-sm text-muted-foreground tabular-nums sm:inline">
                        {doc.chunkCount} {doc.chunkCount === 1 ? 'trecho' : 'trechos'}
                      </span>
                    )}
                    <StatusBadge status={doc.status} />
                  </div>
                  <DocumentActions
                    name={doc.name}
                    isOwner={isOwner}
                    processing={doc.status === 'processing'}
                    onReprocess={() => reprocess(doc)}
                    onDelete={() => setToDelete(doc)}
                  />
                </div>
                {doc.status === 'failed' && (
                  <Alert variant="destructive" className="mt-3 sm:ml-14">
                    <AlertDescription className="text-foreground">{friendlyDocumentError(doc.error)}</AlertDescription>
                  </Alert>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{documentsCopy.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>{toDelete && documentsCopy.deleteBody(toDelete.name)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
