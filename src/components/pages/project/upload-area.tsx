import {
  CloudUpload,
  Description,
  Clear,
  Delete,
  Check,
  Error as ErrorIcon
} from "@mui/icons-material"
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Button,
  Chip,
  IconButton
} from "@mui/material"
import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from "react"
import { useSetAtom, useAtom } from "jotai"
import {
  addLayerGroupAtom,
  addSuccessfulFileAtom,
  layerGroupsAtom,
  setShouldFitBoundsAtom,
  clearAllDataAtom
} from "@/stores/importKMLAtoms"
import { parseKMLFile, validateKMLFile } from "@/lib/kml-parser"
import { calculateBoundsWithPadding } from "@/lib/get-lat-lags-from-geom"
import { LeafletMap } from "./leaflet-map"

interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  status: 'pending' | 'processing' | 'success' | 'error'
  progress: number
  error?: string
  layerGroupId?: string
}

export function UploadArea() {
  const [dragActive, setDragActive] = useState<boolean>(false)
  const [files, setFiles] = useState<UploadFile[]>([])
  const [showMap, setShowMap] = useState<boolean>(false)
  const dragCounter = useRef<number>(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Atoms
  const addLayerGroup = useSetAtom(addLayerGroupAtom)
  const addSuccessfulFile = useSetAtom(addSuccessfulFileAtom)
  const [layerGroups] = useAtom(layerGroupsAtom)
  const setShouldFitBounds = useSetAtom(setShouldFitBoundsAtom)
  const clearAllData = useSetAtom(clearAllDataAtom)

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

  // Thêm file vào danh sách (chưa xử lý)
  const handleFiles = useCallback((newFiles: File[]) => {
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

  // Xóa 1 file
  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  // Xóa tất cả
  const clearAllFiles = useCallback(() => {
    setFiles([])
  }, [])

  // Format size
  const formatFileSize = useCallback((size: number) => {
    return `${(size / 1024 / 1024).toFixed(2)} MB`
  }, [])

  // Xử lý import khi bấm nút
  const handleImport = useCallback(async () => {
    // Lấy tất cả file pending và success để xử lý lại
    const filesToProcess = files.filter(f => f.status === 'pending' || f.status === 'success')
    if (filesToProcess.length === 0) return

    // Xóa tất cả dữ liệu cũ nếu có file success để xử lý lại
    const hasSuccessFiles = files.some(f => f.status === 'success')
    if (hasSuccessFiles) {
      clearAllData()
    }

    // Cập nhật trạng thái processing cho tất cả file cần xử lý
    setFiles(prev =>
      prev.map(f =>
        (f.status === 'pending' || f.status === 'success')
          ? { ...f, status: 'processing', progress: 0, error: undefined }
          : f
      )
    )

    // Xử lý từng file
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i]

      try {
        // Validate file
        const validation = validateKMLFile(file.file)
        if (!validation.isValid) {
          throw new Error(validation.error || 'File không hợp lệ')
        }

        // Parse file
        const layerGroup = await parseKMLFile(file.file)

        // Add to store
        addLayerGroup(layerGroup)
        addSuccessfulFile({
          id: file.id,
          name: file.name,
          size: file.size,
          layerGroupId: layerGroup.id
        })

        // Auto fit bounds cho layer mới với padding phù hợp
        if (layerGroup.bounds) {
          const paddedBounds = calculateBoundsWithPadding(layerGroup.bounds, 0.1)
          setShouldFitBounds(paddedBounds)
        }

        // Update progress thành công
        setFiles(prev =>
          prev.map(f =>
            f.id === file.id
              ? { ...f, status: 'success', progress: 100, layerGroupId: layerGroup.id }
              : f
          )
        )

      } catch (error) {
        console.error(`[UploadArea] Error processing file ${file.name}:`, error)

        // Update progress lỗi
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

    // Hiển thị bản đồ sau khi xử lý xong
    setShowMap(true)
  }, [files, addLayerGroup, addSuccessfulFile, setShouldFitBounds, clearAllData])

  const onButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Nếu đang hiển thị bản đồ
  if (showMap) {
    return (
      <Box sx={{ width: '100%', height: '100%' }}>
        <Paper 
          elevation={2}
          sx={{ 
            mt: 2,
            height: 'calc(100vh - 200px)', // Chiều cao cố định tránh overflow
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <Box 
            sx={{ 
              p: 3, 
              borderBottom: 1, 
              borderColor: 'divider', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexShrink: 0,
              bgcolor: 'background.paper'
            }}
          >
            <Box>
              <Typography variant="h5" color="primary" fontWeight="bold">
                Preview Bản đồ
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {layerGroups.length} layer đã được tải lên thành công
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CloudUpload />}
              onClick={() => setShowMap(false)}
              sx={{ 
                ml: 2,
                minWidth: '140px',
                borderRadius: 2
              }}
            >
              Quay lại Upload
            </Button>
          </Box>
          
          {/* Map Container */}
          <Box 
            sx={{ 
              flexGrow: 1,
              position: 'relative',
              overflow: 'hidden',
              '& .leaflet-container': {
                height: '100%',
                width: '100%',
                zIndex: 1
              }
            }}
          >
            <LeafletMap layerGroups={layerGroups} />
          </Box>
        </Paper>
      </Box>
    )
  }

  return (
    <Box>
      {/* Upload Area */}
      <Paper
        variant="outlined"
        sx={{
          border: '2px dashed',
          borderColor: dragActive ? 'primary.main' : 'grey.300',
          bgcolor: dragActive ? 'primary.50' : 'transparent',
          p: 6,
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          mb: 3,
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
        />

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
      </Paper>

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Files đã tải ({files.length})
              </Typography>
              <Button
                size="small"
                onClick={clearAllFiles}
                startIcon={<Clear />}
              >
                Xóa tất cả
              </Button>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {files.map((file) => (
                <Paper key={file.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Description
                      color={file.status === 'success' ? 'success' :
                        file.status === 'error' ? 'error' : 'action'}
                    />

                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(file.size)}
                      </Typography>

                      {file.status === 'pending' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={file.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {file.progress}%
                          </Typography>
                        </Box>
                      )}

                      {file.status === 'processing' && (
                        <Box sx={{ mt: 1 }}>
                          <LinearProgress
                            variant="indeterminate"
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            Đang xử lý...
                          </Typography>
                        </Box>
                      )}

                      {file.status === 'error' && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                          {file.error}
                        </Typography>
                      )}
                    </Box>

                    {file.status === 'success' && (
                      <Chip icon={<Check />} label="OK" color="success" size="small" />
                    )}

                    {file.status === 'error' && (
                      <Chip icon={<ErrorIcon />} label="Lỗi" color="error" size="small" />
                    )}

                    <IconButton
                      size="small"
                      onClick={() => removeFile(file.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>

            {/* Import Button */}
            <Button
              variant="contained"
              color="primary"
              disabled={files.length === 0 || files.some(f => f.status === 'processing')}
              onClick={handleImport}
              sx={{ mt: 2 }}
            >
              Import
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  )
}