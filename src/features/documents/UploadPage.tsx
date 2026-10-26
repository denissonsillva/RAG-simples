import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { ChunkStrategy } from '@/services'
import { ChunkingFields } from './ChunkingFields'
import { FileDropzone } from './FileDropzone'
import { useUploadDocument } from './hooks'
import {
  ACCEPTED_EXTENSIONS,
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
          toast.success(`"${file.name}" enviado. O processamento começou.`)
          navigate('/documentos')
        },
        onError: () => toast.error('Não foi possível enviar o documento.'),
      },
    )
  })

  return (
    <>
      <PageHeader
        title="Enviar documento"
        description="Escolha o arquivo e defina como ele será dividido em chunks."
      />
      <Card className="max-w-3xl">
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6" noValidate>
            <div className="space-y-1.5">
              <FileDropzone
                file={file}
                onFile={onFile}
                accept={ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(',')}
                invalid={fileError !== null}
              />
              {fileError && (
                <p role="alert" className="text-xs text-destructive">
                  {fileError}
                </p>
              )}
            </div>

            <ChunkingFields
              strategy={strategy}
              onStrategyChange={setStrategy}
              chunkSize={watch('chunkSize')}
              overlap={watch('overlap')}
              onPresetSelect={onPresetSelect}
              register={register}
              errors={errors}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/documentos')}>
                Cancelar
              </Button>
              <Button type="submit" disabled={upload.isPending}>
                {upload.isPending ? 'Enviando…' : 'Enviar documento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}
