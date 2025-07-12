import { useFileProcessor } from '@/hooks/useFileProcessor'
import { addFilesAtom, dragActiveAtom, showSnackbarAtom, cancelFileAtom, type ImportedFile } from '@/stores/importKMLAtoms'
import { CloudUpload, Cancel } from '@mui/icons-material'
import { Button, Paper, Typography, CircularProgress, Box, LinearProgress, Chip } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useCallback, useState, useMemo } from 'react'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ACCEPTED_EXTENSIONS = ['kml', 'kmz']
const MAX_CONCURRENT_UPLOADS = 2 // Limit concurrent uploads to prevent overload
const LARGE_FILE_THRESHOLD = 10 * 1024 * 1024 // 10MB

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

interface QueueItem {
  file: ImportedFile
  blob: File
  priority: number // Based on file size (smaller files first)
  abortController: AbortController // For cancellation
}

export function UploadArea() {
  const [dragActive, setDragActive] = useAtom(dragActiveAtom)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingCount, setProcessingCount] = useState(0)
  const [queueLength, setQueueLength] = useState(0)
  const [currentProcessingFiles, setCurrentProcessingFiles] = useState<Set<string>>(new Set())
  const addFiles = useSetAtom(addFilesAtom)
  const showSnackbar = useSetAtom(showSnackbarAtom)
  const cancelFile = useSetAtom(cancelFileAtom)
  const { processFile } = useFileProcessor()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)
  const processingQueue = useRef<QueueItem[]>([])
  const activeProcesses = useRef<Set<string>>(new Set())
  const abortControllers = useRef<Map<string, AbortController>>(new Map())

  // Optimized drag handlers
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

  // Enhanced file validation
  const validateFile = useCallback((file: File): string | null => {
    const extension = file.name.toLowerCase().split('.').pop()
    
    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      return `File "${file.name}" không đúng định dạng. Chỉ chấp nhận .kml và .kmz`
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 50MB`
    }
    
    if (file.size === 0) {
      return `File "${file.name}" rỗng hoặc không thể đọc được`
    }
    
    return null
  }, [])

  // Cancel a specific file
  const handleCancelFile = useCallback((fileId: string) => {
    console.log(`[UploadArea] Cancelling file: ${fileId}`)
    
    // Cancel via AbortController if processing
    const abortController = abortControllers.current.get(fileId)
    if (abortController) {
      abortController.abort()
      abortControllers.current.delete(fileId)
    }
    
    // Remove from queue if waiting
    processingQueue.current = processingQueue.current.filter(item => item.file.id !== fileId)
    
    // Update atom state
    cancelFile(fileId)
    
    // Update local state
    setCurrentProcessingFiles(prev => {
      const newSet = new Set(prev)
      newSet.delete(fileId)
      return newSet
    })
    
    showSnackbar(`Đã hủy upload file`)
  }, [cancelFile, showSnackbar])

  // Cancel all uploads
  const handleCancelAll = useCallback(() => {
    console.log('[UploadArea] Cancelling all uploads')
    
    // Cancel all active processes
    abortControllers.current.forEach((controller, fileId) => {
      controller.abort()
      cancelFile(fileId)
    })
    abortControllers.current.clear()
    
    // Clear queue
    processingQueue.current = []
    
    // Reset states
    setIsProcessing(false)
    setProcessingCount(0)
    setQueueLength(0)
    setCurrentProcessingFiles(new Set())
    activeProcesses.current.clear()
    
    showSnackbar('Đã hủy tất cả upload')
  }, [cancelFile, showSnackbar])

  // Process a single file from queue
  const processSingleFile = useCallback(async (queueItem: QueueItem) => {
    const { file, blob, abortController } = queueItem
    
    try {
      // Check if cancelled before processing
      if (abortController.signal.aborted) {
        return
      }
      
      activeProcesses.current.add(file.id)
      setProcessingCount(prev => prev + 1)
      setCurrentProcessingFiles(prev => new Set(prev).add(file.id))
      
      // Store abort controller for this file
      abortControllers.current.set(file.id, abortController)
      
      await processFile(file, blob, abortController.signal)
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log(`[UploadArea] File processing aborted: ${file.name}`)
        return
      }
      
      console.error(`[UploadArea] Error processing file ${file.name}:`, error)
      showSnackbar(`Lỗi xử lý file ${file.name}`)
    } finally {
      activeProcesses.current.delete(file.id)
      abortControllers.current.delete(file.id)
      setProcessingCount(prev => prev - 1)
      setCurrentProcessingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(file.id)
        return newSet
      })
    }
  }, [processFile, showSnackbar])

  // Enhanced queue processing with concurrency control
  const processFileQueue = useCallback(async () => {
    if (processingQueue.current.length === 0) {
      setIsProcessing(false)
      setQueueLength(0)
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Process files with concurrency control
      while (processingQueue.current.length > 0) {
        setQueueLength(processingQueue.current.length)
        
        // Wait if we've reached max concurrent uploads
        while (activeProcesses.current.size >= MAX_CONCURRENT_UPLOADS) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        // Sort queue by priority (smaller files first)
        processingQueue.current.sort((a, b) => a.priority - b.priority)
        
        // Get next item to process
        const queueItem = processingQueue.current.shift()
        if (queueItem && !queueItem.abortController.signal.aborted) {
          // Process without await to allow concurrent processing
          processSingleFile(queueItem).catch(error => {
            console.error('[UploadArea] Queue processing error:', error)
          })
        }
        
        // Small delay to prevent overwhelming the system
        await yieldToBrowser()
      }
      
      // Wait for all active processes to complete
      while (activeProcesses.current.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
    } catch (error) {
      console.error('[UploadArea] Queue processing error:', error)
      showSnackbar('Có lỗi xảy ra khi xử lý hàng đợi file')
    } finally {
      setIsProcessing(false)
      setQueueLength(0)
      setProcessingCount(0)
      setCurrentProcessingFiles(new Set())
    }
  }, [processSingleFile, showSnackbar])

  // Enhanced file handling with better UX
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

    // Show processing status for large files
    const largeFiles = validFiles.filter(f => f.size > LARGE_FILE_THRESHOLD)
    if (largeFiles.length > 0) {
      showSnackbar(`Đang xử lý ${largeFiles.length} file lớn, vui lòng chờ...`)
    }

    // Tạo ImportedFile objects với priority
    const newFiles: ImportedFile[] = validFiles.map((file, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'pending',
      progress: 0,
      cancelled: false
    }))

    // Add files to store ngay lập tức để user thấy feedback
    addFiles(newFiles)
    
    // Thêm vào queue với priority (smaller files first)
    newFiles.forEach((importedFile, index) => {
      const priority = validFiles[index].size // Smaller files get processed first
      const abortController = new AbortController()
      
      processingQueue.current.push({
        file: importedFile,
        blob: validFiles[index],
        priority,
        abortController
      })
    })

    // Yield control before starting queue processing
    await yieldToBrowser()
    
    // Bắt đầu xử lý queue
    if (!isProcessing) {
      processFileQueue()
    }
  }, [validateFile, showSnackbar, addFiles, processFileQueue, isProcessing])

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
    opacity: isProcessing ? 0.8 : 1,
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {processingCount > 0 && `${processingCount} file đang xử lý`}
            {queueLength > 0 && ` • ${queueLength} file đang chờ`}
          </Typography>
          
          {/* Cancel Controls */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Cancel />}
              onClick={handleCancelAll}
              color="error"
            >
              Hủy tất cả
            </Button>
          </Box>
          
          {/* Current Processing Files */}
          {currentProcessingFiles.size > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mb: 2 }}>
              {Array.from(currentProcessingFiles).map(fileId => (
                <Chip
                  key={fileId}
                  label={`File ${fileId.split('-')[0]}`}
                  size="small"
                  variant="outlined"
                  deleteIcon={<Cancel />}
                  onDelete={() => handleCancelFile(fileId)}
                />
              ))}
            </Box>
          )}
          
          {queueLength > 0 && (
            <Box sx={{ width: '100%', maxWidth: 300, mt: 1 }}>
              <LinearProgress variant="indeterminate" />
            </Box>
          )}
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