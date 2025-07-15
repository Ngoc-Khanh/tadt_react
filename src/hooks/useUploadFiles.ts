import { calculateBoundsWithPadding } from "@/lib/get-lat-lags-from-geom"
import { parseKMLFile, validateKMLFile } from "@/lib/kml-parser"
import { addLayerGroupAtom, addSuccessfulFileAtom, clearAllDataAtom, setShouldFitBoundsAtom } from "@/stores/importKMLAtoms"
import { useSetAtom } from "jotai"
import { useCallback, useState } from "react"

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  status: 'pending' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
  layerGroupId?: string
}

export function useUploadFiles() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isImporting, setIsImporting] = useState(false)

  const addLayerGroup = useSetAtom(addLayerGroupAtom)
  const addSuccessfulFile = useSetAtom(addSuccessfulFileAtom)
  const setShouldFitBounds = useSetAtom(setShouldFitBoundsAtom)
  const clearAllData = useSetAtom(clearAllDataAtom)

  const addFiles = useCallback((newFiles: File[]) => {
    const mapped: UploadFile[] = newFiles.map((file, idx) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${idx}`,
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
    }))
    setFiles(prev => [...prev, ...mapped])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  const importFiles = useCallback(async () => {
    const filesToProcess = files.filter(f => f.status === 'pending' || f.status === 'success')
    if (filesToProcess.length === 0) return

    setIsImporting(true)

    const hasSuccessFiles = files.some(f => f.status === 'success')
    if (hasSuccessFiles) {
      clearAllData()
    }

    setFiles(prev =>
      prev.map(f =>
        (f.status === 'pending' || f.status === 'success')
          ? { ...f, status: 'processing', progress: 0, error: undefined }
          : f
      )
    )

    for (const file of filesToProcess) {
      try {
        const validation = validateKMLFile(file.file)
        if (!validation.isValid) {
          throw new Error(validation.error || 'File không hợp lệ')
        }

        const layerGroup = await parseKMLFile(file.file)
        addLayerGroup(layerGroup)
        addSuccessfulFile({
          id: file.id,
          name: file.name,
          size: file.size,
          layerGroupId: layerGroup.id
        })

        if (layerGroup.bounds) {
          const paddedBounds = calculateBoundsWithPadding(layerGroup.bounds, 0.1)
          setShouldFitBounds(paddedBounds)
        }

        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'success', progress: 100, layerGroupId: layerGroup.id }
              : f
          )
        )
      } catch (error) {
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? {
                ...f,
                status: 'error',
                progress: 100,
                error: error instanceof Error ? error.message : String(error)
              }
              : f
          )
        )
      }
    }

    setIsImporting(false)
  }, [files, addLayerGroup, addSuccessfulFile, setShouldFitBounds, clearAllData])

  return {
    files,
    isImporting,
    addFiles,
    removeFile,
    clearAll,
    importFiles
  }
}