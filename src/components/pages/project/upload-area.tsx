import { CloudUpload, CheckCircle, Error as ErrorIcon } from "@mui/icons-material"
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from "@mui/material"
import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { useSetAtom, useAtom } from "jotai"
import {
  addLayerGroupAtom,
  addSuccessfulFileAtom,
  layerGroupsAtom,
  setShouldFitBoundsAtom
} from "@/stores/importKMLAtoms"
import { parseKMLFile, validateKMLFile } from "@/lib/kml-parser"
import { LeafletMap } from "./leaflet-map"

interface FileProcessResult {
  file: File
  status: 'processing' | 'success' | 'error'
  error?: string
  layerGroupId?: string
}

export function UploadArea() {
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [fileResults, setFileResults] = useState<FileProcessResult[]>([])
  const dragCounter = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Atoms
  const addLayerGroup = useSetAtom(addLayerGroupAtom)
  const addSuccessfulFile = useSetAtom(addSuccessfulFileAtom)
  const [layerGroups] = useAtom(layerGroupsAtom)
  const setShouldFitBounds = useSetAtom(setShouldFitBoundsAtom)

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragActive(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    dragCounter.current = 0

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files))
    }
    // Reset input để có thể upload cùng file lại
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleFiles = useCallback(async (files: File[]) => {
    setIsProcessing(true)
    setFileResults([])

    const initialResults: FileProcessResult[] = files.map(file => ({
      file,
      status: 'processing'
    }))
    setFileResults(initialResults)

    // Process từng file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      try {
        // Validate file
        const validation = validateKMLFile(file)
        if (!validation.isValid) {
          throw new Error(validation.error)
        }

        // Parse file
        const layerGroup = await parseKMLFile(file)

        // Add to store
        addLayerGroup(layerGroup)
        addSuccessfulFile({
          id: `file-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          layerGroupId: layerGroup.id
        })

        // Auto fit bounds cho layer mới
        if (layerGroup.bounds) {
          setShouldFitBounds(layerGroup.bounds)
        }

        // Update result
        setFileResults(prev => prev.map((result, index) =>
          index === i
            ? { ...result, status: 'success', layerGroupId: layerGroup.id }
            : result
        ))

      } catch (error) {
        console.error(`[UploadArea] Error processing file ${file.name}:`, error)

        // Update result with error
        setFileResults(prev => prev.map((result, index) =>
          index === i
            ? {
              ...result,
              status: 'error',
              error: error instanceof Error ? error.message : 'Lỗi không xác định'
            }
            : result
        ))
      }
    }

    setIsProcessing(false)
  }, [addLayerGroup, addSuccessfulFile, setShouldFitBounds])

  const onButtonClick = useCallback(() => {
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }, [isProcessing])

  const hasResults = fileResults.length > 0
  const successCount = fileResults.filter(r => r.status === 'success').length
  const errorCount = fileResults.filter(r => r.status === 'error').length

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          bgcolor: dragActive ? 'primary.50' : 'transparent',
          p: 6,
          textAlign: 'center',
          cursor: isProcessing ? 'wait' : 'pointer',
          transition: 'all 0.2s ease',
          mb: 3,
          opacity: isProcessing ? 0.8 : 1,
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50'
          }
        }}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".kml,.kmz"
          onChange={handleChange}
          style={{ display: 'none' }}
          disabled={isProcessing}
        />

        {isProcessing ? (
          <Box display="flex" flexDirection="column" alignItems="center">
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Đang xử lý file...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Vui lòng đợi trong giây lát
            </Typography>
          </Box>
        ) : (
          <>
            <CloudUpload
              sx={{
                fontSize: 64,
                color: dragActive ? 'primary.main' : 'grey.400',
                mb: 2
              }}
            />
            <Typography variant="h6" gutterBottom>
              {dragActive ? 'Thả file vào đây' : 'Kéo thả file vào đây'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Chấp nhận file .kml và .kmz (tối đa 50MB)
            </Typography>
          </>
        )}
      </Paper>

      {/* Progress & Results */}
      {hasResults && (
        <Paper sx={{ p: 3 }}>
          {isProcessing && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                  Tiến độ xử lý
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {fileResults.filter(r => r.status !== 'processing').length} / {fileResults.length}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={(fileResults.filter(r => r.status !== 'processing').length / fileResults.length) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Summary */}
          {!isProcessing && (
            <Box sx={{ mb: 2 }}>
              {successCount > 0 && (
                <Alert severity="success" sx={{ mb: 1 }}>
                  Đã xử lý thành công {successCount} file. Xem preview bản đồ bên dưới.
                </Alert>
              )}
              {errorCount > 0 && (
                <Alert severity="error">
                  {errorCount} file gặp lỗi khi xử lý
                </Alert>
              )}
            </Box>
          )}

          {/* File List */}
          <List dense>
            {fileResults.map((result, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  {result.status === 'processing' && (
                    <CircularProgress size={20} />
                  )}
                  {result.status === 'success' && (
                    <CheckCircle color="success" />
                  )}
                  {result.status === 'error' && (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={result.file.name}
                  secondary={
                    result.status === 'error'
                      ? result.error
                      : `${(result.file.size / 1024 / 1024).toFixed(2)} MB`
                  }
                  secondaryTypographyProps={{
                    color: result.status === 'error' ? 'error' : 'text.secondary'
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Map Preview */}
      {layerGroups.length > 0 && (
        <Paper sx={{ mt: 3 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="h6" color="primary">
              Preview Bản đồ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dữ liệu KML/KMZ đã được tải lên
            </Typography>
          </Box>
          <Box sx={{ height: 400 }}>
            <LeafletMap
              layerGroups={layerGroups}
              height="100%"
            />
          </Box>
        </Paper>
      )}
    </Box>
  )
}