import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { 
  addLayerGroupAtom, 
  updateFileAtom, 
  showSnackbarAtom,
  type ImportedFile
} from '../stores/importKMLAtoms'
import { parseKMLFile, isValidKMLFile } from '../services/kmlParser'

// Utility function để yield control back to browser
const yieldToBrowser = (): Promise<void> => {
  return new Promise(resolve => {
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(() => resolve(), 0)
    }
  })
}

// Progress stages với time estimation
const PROGRESS_STAGES = {
  VALIDATION: 5,
  PARSING_START: 15,
  PARSING_CONTENT: 40,
  PROCESSING_GEOMETRIES: 70,
  CALCULATING_BOUNDS: 85,
  FINALIZING: 95,
  COMPLETE: 100
} as const

export function useFileProcessor() {
  const updateFile = useSetAtom(updateFileAtom)
  const addLayerGroup = useSetAtom(addLayerGroupAtom)
  const showSnackbar = useSetAtom(showSnackbarAtom)

  const updateProgress = useCallback((fileId: string, progress: number, status?: ImportedFile['status']) => {
    updateFile(fileId, { 
      progress, 
      status: status || (progress === 100 ? 'success' : 'pending')
    })
  }, [updateFile])

  const processFile = useCallback(async (file: ImportedFile, fileBlob: File, abortSignal?: AbortSignal) => {
    const fileSize = (fileBlob.size / 1024 / 1024).toFixed(2)
    console.log(`[FileProcessor] Processing file: ${file.name} (${fileSize}MB)`)

    try {
      // Check if cancelled before starting
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled')
      }

      // Stage 1: Validation
      updateProgress(file.id, PROGRESS_STAGES.VALIDATION)
      await yieldToBrowser()

      if (!isValidKMLFile(fileBlob)) {
        updateFile(file.id, { 
          status: 'error',
          progress: 0
        })
        showSnackbar(`File ${file.name} không phải định dạng KML/KMZ hợp lệ`)
        return
      }

      // Check cancellation after validation
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled')
      }

      // Stage 2: Start parsing
      updateProgress(file.id, PROGRESS_STAGES.PARSING_START)
      await yieldToBrowser()

      // Stage 3: Parse KML file với progress tracking
      updateProgress(file.id, PROGRESS_STAGES.PARSING_CONTENT)
      
      // Check cancellation before parsing
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled')
      }
      
      // Start parsing với improved error handling
      const parseResult = await parseKMLFile(fileBlob, abortSignal)
      
      // Check cancellation after parsing
      if (abortSignal?.aborted) {
        throw new Error('Operation cancelled')
      }
      
      // Stage 4: Processing geometries
      updateProgress(file.id, PROGRESS_STAGES.PROCESSING_GEOMETRIES)
      await yieldToBrowser()

      if (parseResult.success) {
        // Stage 5: Calculating bounds
        updateProgress(file.id, PROGRESS_STAGES.CALCULATING_BOUNDS)
        await yieldToBrowser()

        // Stage 6: Finalizing
        updateProgress(file.id, PROGRESS_STAGES.FINALIZING)
        await yieldToBrowser()

        // Check cancellation before finalizing
        if (abortSignal?.aborted) {
          throw new Error('Operation cancelled')
        }

        // Add parsed layer group
        addLayerGroup(parseResult.layerGroup)
        
        // Stage 7: Complete
        updateProgress(file.id, PROGRESS_STAGES.COMPLETE, 'success')
        
        // Calculate stats
        const layerCount = parseResult.layerGroup.layers.length
        const featureCount = parseResult.layerGroup.layers.reduce(
          (total, layer) => total + (layer.geometry?.length || 0), 0
        )
        
        showSnackbar(
          `✅ Import thành công ${file.name}: ${layerCount} layer, ${featureCount} features`
        )
        
        console.log(`[FileProcessor] Successfully processed ${file.name}:`, {
          layers: layerCount,
          features: featureCount,
          fileSize: `${fileSize}MB`,
          hasBounds: !!parseResult.layerGroup.bounds
        })
      } else {
        // Handle parsing error
        updateFile(file.id, { status: 'error', progress: 0 })
        showSnackbar(`❌ Lỗi parse ${file.name}: ${parseResult.error}`)
        console.error(`[FileProcessor] Parse error for ${file.name}:`, parseResult.error)
      }

    } catch (error) {
      // Handle cancellation
      if (error instanceof Error && (error.message === 'Operation cancelled' || error.name === 'AbortError')) {
        console.log(`[FileProcessor] Processing cancelled for ${file.name}`)
        updateFile(file.id, { status: 'cancelled', progress: 0 })
        return
      }
      
      // Handle unexpected errors
      updateFile(file.id, { status: 'error', progress: 0 })
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showSnackbar(`❌ Lỗi xử lý file ${file.name}: ${errorMessage}`)
      console.error(`[FileProcessor] Processing error for ${file.name}:`, error)
    }
  }, [updateFile, addLayerGroup, showSnackbar, updateProgress])

  return { processFile }
} 