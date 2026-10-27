import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useBlocker, useNavigate } from 'react-router-dom'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import type { ChunkStrategy } from '@/services'
import { ChunkingFields } from './ChunkingFields'
import { FileDropzone } from './FileDropzone'
import { useUploadDocument } from './hooks'
import {
  ACCEPTED_EXTENSIONS,
  LEGACY_EXTENSIONS,
  chunkPresets,
  presetOverlap,
  uploadSchema,
  validateFile,
  type ChunkPreset,
  type UploadFormValues,
} from './schemas'

export function UploadPage() {
  const navigate = useNavigate()
  const upload = useUploadDocument()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [strategy, setStrategy] = useState<ChunkStrategy>(chunkPresets[0].strategy)
  const sent = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { chunkSize: chunkPresets[0].chunkSize, overlap: presetOverlap(chunkPresets[0]) },
  })

  // Há algo a perder enquanto existe um arquivo escolhido que ainda não foi enviado.
  // `sent` é lido na hora da navegação (não do último render), para o redirecionamento após o envio passar.
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      file !== null && !sent.current && currentLocation.pathname !== nextLocation.pathname,
  )

  const hasFile = file !== null
  useEffect(() => {
    if (!hasFile) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasFile])

  const onPresetSelect = (preset: ChunkPreset) => {
    setStrategy(preset.strategy)
    setValue('chunkSize', preset.chunkSize, { shouldValidate: true })
    setValue('overlap', presetOverlap(preset), { shouldValidate: true })
  }

  const onFile = (next: File | null) => {
    setFile(next)
    setFileError(next ? validateFile(next) : null)
  }

  const onSubmit = handleSubmit((values) => {
    const error = validateFile(file)
    setFileError(error)
    if (error || !file) return
    upload.mutate(
      { file, chunking: { strategy, ...values } },
      {
        onSuccess: () => {
          sent.current = true
          toast.success(`“${file.name}” foi enviado. Estamos preparando o documento para a busca.`)
          navigate('/documentos')
        },
        onError: () => toast.error('Não conseguimos enviar o documento. Confira sua conexão e tente de novo.'),
      },
    )
  })

  return (
    <>
      <PageHeader
        title="Enviar documento"
        description="Escolha o arquivo e diga como o texto deve ser dividido para a busca."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-8" noValidate>
            <section className="space-y-3" aria-labelledby="file-title">
              <h2 id="file-title" className="text-lg font-semibold">
                1. Escolha o arquivo
              </h2>
              <FileDropzone
                file={file}
                onFile={onFile}
                accept={[...ACCEPTED_EXTENSIONS, ...Object.keys(LEGACY_EXTENSIONS)].map((e) => `.${e}`).join(',')}
                error={fileError}
              />
            </section>

            <section>
              <ChunkingFields
                strategy={strategy}
                onStrategyChange={setStrategy}
                chunkSize={watch('chunkSize')}
                overlap={watch('overlap')}
                onPresetSelect={onPresetSelect}
                register={register}
                errors={errors}
              />
            </section>

            {upload.isPending && (
              <div className="space-y-2" role="status">
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Spinner /> Enviando seu arquivo… Não feche esta página.
                </p>
                <Progress value={null} aria-label="Enviando o arquivo" />
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/documentos')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upload.isPending}>
                {upload.isPending ? (
                  <>
                    <Spinner /> Enviando…
                  </>
                ) : (
                  'Enviar documento'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <AlertDialog open={blocker.state === 'blocked'} onOpenChange={(open) => !open && blocker.reset?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem enviar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você escolheu um arquivo, mas ele ainda não foi enviado. Se sair agora, vai precisar escolhê-lo de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ficar aqui</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => blocker.proceed?.()}>
              Sair sem enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
