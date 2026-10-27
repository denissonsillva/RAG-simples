import { FileText, RefreshCw, Trash2, Upload } from 'lucide-react'
import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { fileTypeLabel, formatBytes, formatDate } from '@/lib/format'
import type { Document } from '@/services'
import { useAuth } from '@/features/auth/useAuth'
import { useDeleteDocument, useDocuments, useReprocessDocument } from './hooks'
import { StatusBadge } from './StatusBadge'

export function DocumentsPage() {
  const { data, isLoading, isError, refetch } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const reprocessDocument = useReprocessDocument()
  const { user } = useAuth()
  const [toDelete, setToDelete] = useState<Document | null>(null)

  const reprocess = ({ id, name }: Document) =>
    reprocessDocument.mutate(id, {
      onSuccess: () => toast.success(`Reprocessando "${name}".`),
      onError: (e) => toast.error(e.message),
    })

  const confirmDelete = () => {
    if (!toDelete) return
    const { id, name } = toDelete
    setToDelete(null)
    deleteDocument.mutate(id, {
      onSuccess: () => toast.success(`"${name}" foi excluído.`),
      onError: () => toast.error('Não foi possível excluir o documento.'),
    })
  }

  return (
    <>
      <PageHeader
        title="Documentos"
        description="Todos os documentos enviados pela equipe. Qualquer pessoa logada pode ver e buscar neles."
        actions={
          <Link to="/documentos/novo" className={buttonVariants()}>
            <Upload aria-hidden />
            Enviar documento
          </Link>
        }
      />

      {isLoading && (
        <div className="space-y-2" aria-busy="true" aria-label="Carregando documentos">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-11 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="mb-3 text-sm text-destructive">Não foi possível carregar os documentos.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
          <FileText className="size-8 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">Nenhum documento ainda. Envie o primeiro.</p>
          <Link to="/documentos/novo" className={buttonVariants()}>
            Enviar documento
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Enviado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-20">
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="max-w-64 truncate font-medium" title={doc.name}>
                    {doc.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{fileTypeLabel(doc.name)}</Badge>
                  </TableCell>
                  <TableCell>{formatBytes(doc.sizeBytes)}</TableCell>
                  <TableCell>{doc.status === 'ready' ? doc.chunkCount : '—'}</TableCell>
                  <TableCell>{doc.uploadedBy}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell>
                    <StatusBadge status={doc.status} error={doc.error} />
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Reprocessar ${doc.name}`}
                      title={doc.uploadedById === user?.id ? 'Reprocessar' : 'Só quem enviou pode reprocessar'}
                      disabled={doc.uploadedById !== user?.id || doc.status === 'processing'}
                      onClick={() => reprocess(doc)}
                    >
                      <RefreshCw aria-hidden />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Excluir ${doc.name}`}
                      title={doc.uploadedById === user?.id ? 'Excluir' : 'Só quem enviou pode excluir'}
                      disabled={doc.uploadedById !== user?.id}
                      onClick={() => setToDelete(doc)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              "{toDelete?.name}" e seus chunks serão removidos para todos os usuários. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
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
