import { useSetAtom } from 'jotai'
import { useCallback } from 'react'
import { 
  addLayerGroupAtom, 
  updateFileAtom, 
  showSnackbarAtom,
  type ImportedFile
} from '../stores/importKMLAtoms'
import { parseKMLFile, isValidKMLFile } from '../services/kmlParser'

export function useFileProcessor() {
  const updateFile = useSetAtom(updateFileAtom)
  const addLayerGroup = useSetAtom(addLayerGroupAtom)
  const showSnackbar = useSetAtom(showSnackbarAtom)

  const processFile = useCallback(async (file: ImportedFile, fileBlob: File) => {
    // Validate file type
    if (!isValidKMLFile(fileBlob)) {
      updateFile(file.id, { 
        status: 'error',
        progress: 0
      })
      showSnackbar(`File ${file.name} không phải định dạng KML/KMZ hợp lệ`)
      return
    }

    const updateProgress = (progress: number) => {
      updateFile(file.id, { 
        progress, 
        status: progress === 100 ? 'success' : 'pending' 
      })
    }

    try {
      // Start processing
      updateProgress(10)
      console.log(`[FileProcessor] Processing file: ${file.name}`)

      // Parse KML file
      updateProgress(30)
      const parseResult = await parseKMLFile(fileBlob)
      
      updateProgress(70)

      if (parseResult.success) {
        // Add parsed layer group
        addLayerGroup(parseResult.layerGroup)
        updateProgress(100)
        
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
          bounds: parseResult.layerGroup.bounds
        })
      } else {
        // Handle parsing error
        updateFile(file.id, { status: 'error' })
        showSnackbar(`❌ Lỗi parse ${file.name}: ${parseResult.error}`)
        console.error(`[FileProcessor] Parse error for ${file.name}:`, parseResult.error)
      }

    } catch (error) {
      // Handle unexpected errors
      updateFile(file.id, { status: 'error' })
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      showSnackbar(`❌ Lỗi xử lý file ${file.name}: ${errorMessage}`)
      console.error(`[FileProcessor] Processing error for ${file.name}:`, error)
    }
  }, [updateFile, addLayerGroup, showSnackbar])

  return { processFile }
} 