import { useFileProcessor } from '@/hooks/useFileProcessor'
import { addFilesAtom, dragActiveAtom, showSnackbarAtom, type ImportedFile } from '@/stores/importKMLAtoms'
import { CloudUpload } from '@mui/icons-material'
import { Button, Paper, Typography, CircularProgress, Box } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useCallback, useState, useMemo } from 'react'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_EXTENSIONS = ['kml', 'kmz']

export function UploadArea() {
  const [dragActive, setDragActive] = useAtom(dragActiveAtom)
  const [isProcessing, setIsProcessing] = useState(false)
  const addFiles = useSetAtom(addFilesAtom)
  const showSnackbar = useSetAtom(showSnackbarAtom)
  const { processFile } = useFileProcessor()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const processingQueue = useRef<Array<{ file: ImportedFile; blob: File }>>([])

  // Debounced drag handlers để tránh re-render liên tục
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true)
    }
  }, [setDragActive])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) {
      setDragActive(false)
    }
  }, [setDragActive])

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
      handleFiles(e.dataTransfer.files)
    }
  }, [setDragActive])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
    // Reset input để có thể upload cùng file lại
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  // Validate file trước khi xử lý
  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.toLowerCase().split('.').pop()
    
    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      return `File "${file.name}" không đúng định dạng. Chỉ chấp nhận .kml và .kmz`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 50MB`
    }
    
    return null
  }, [])

  // Xử lý files bất đồng bộ để tránh lag UI
  const processFileQueue = useCallback(async () => {
    if (processingQueue.current.length === 0 || isProcessing) return
    
    setIsProcessing(true)
    
    try {
      // Xử lý từng file một cách tuần tự để tránh overload
      while (processingQueue.current.length > 0) {
        const item = processingQueue.current.shift()
        if (item) {
          // Dùng setTimeout để yield control về browser và tránh blocking UI
          await new Promise(resolve => setTimeout(resolve, 10))
          await processFile(item.file, item.blob)
        }
      }
    } catch (error) {
      console.error('[UploadArea] Error processing files:', error)
      showSnackbar('Có lỗi xảy ra khi xử lý file')
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, processFile, showSnackbar])

  const handleFiles = useCallback(async (fileList: FileList) => {
    const files = Array.from(fileList)
    const validationErrors: string[] = []
    const validFiles: File[] = []

    // Validate tất cả files trước
    files.forEach(file => {
      const error = validateFile(file)
      if (error) {
        validationErrors.push(error)
      } else {
        validFiles.push(file)
      }
    })

    // Hiển thị lỗi validation nếu có
    if (validationErrors.length > 0) {
      showSnackbar(validationErrors.join('\n'))
    }

    if (validFiles.length === 0) return

    // Tạo ImportedFile objects với ID tối ưu hơn
    const newFiles: ImportedFile[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'pending',
      progress: 0
    }))

    // Add files to store ngay lập tức để user thấy feedback
    addFiles(newFiles)
    
    // Thêm vào queue để xử lý bất đồng bộ
    newFiles.forEach((importedFile, index) => {
      processingQueue.current.push({
        file: importedFile,
        blob: validFiles[index]
      })
    })

    // Bắt đầu xử lý queue
    processFileQueue()
  }, [validateFile, showSnackbar, addFiles, processFileQueue])

  const onButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  // Memoize style objects để tránh re-render
  const paperStyles = useMemo(() => ({
    border: '2px dashed',
    borderColor: dragActive ? 'primary.main' : 'grey.300',
    bgcolor: dragActive ? 'primary.50' : 'transparent',
    p: 6,
    textAlign: 'center' as const,
    cursor: isProcessing ? 'wait' : 'pointer',
    transition: 'all 0.2s ease',
    mb: 3,
    opacity: isProcessing ? 0.7 : 1,
    '&:hover': {
      borderColor: 'primary.main',
      bgcolor: 'primary.50'
    }
  }), [dragActive, isProcessing])

  const iconStyles = useMemo(() => ({
    fontSize: 64,
    color: dragActive ? 'primary.main' : 'grey.400',
    mb: 2
  }), [dragActive])

  return (
    <Paper
      variant="outlined"
      sx={paperStyles}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={!isProcessing ? onButtonClick : undefined}
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
            Vui lòng chờ trong giây lát
          </Typography>
        </Box>
      ) : (
        <>
          <CloudUpload sx={iconStyles} />
          <Typography variant="h6" gutterBottom>
            {dragActive ? 'Thả file vào đây' : 'Kéo thả file vào đây'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            sx={{ mt: 2, mb: 2 }}
            disabled={isProcessing}
          >
            hoặc chọn file
          </Button>
          <Typography variant="body2" color="text.secondary">
            Chấp nhận file .kml và .kmz (tối đa 50MB)
          </Typography>
        </>
      )}
    </Paper>
  )
} 