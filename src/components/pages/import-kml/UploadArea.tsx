import { useFileProcessor } from '@/hooks/useFileProcessor'
import { addFilesAtom, dragActiveAtom, showSnackbarAtom, type ImportedFile } from '@/stores/importKMLAtoms'
import { CloudUpload } from '@mui/icons-material'
import { Button, Paper, Typography } from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useCallback } from 'react'

export function UploadArea() {
  const [dragActive, setDragActive] = useAtom(dragActiveAtom)
  const addFiles = useSetAtom(addFilesAtom)
  const showSnackbar = useSetAtom(showSnackbarAtom)
  const { processFile } = useFileProcessor()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = useCallback((fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(file => {
      const extension = file.name.toLowerCase().split('.').pop()
      return extension === 'kml' || extension === 'kmz'
    })

    if (validFiles.length === 0) {
      showSnackbar('Chỉ chấp nhận file .kml hoặc .kmz')
      return
    }

    const newFiles: ImportedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'pending',
      progress: 0
    }))

    addFiles(newFiles)
    
    // Process each file với file blob thực tế
    newFiles.forEach((importedFile, index) => {
      const fileBlob = validFiles[index]
      processFile(importedFile, fileBlob)
    })
  }, [addFiles, showSnackbar, processFile])

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
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
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
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
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        sx={{ mt: 2, mb: 2 }}
      >
        hoặc chọn file
      </Button>
      <Typography variant="body2" color="text.secondary">
        Chấp nhận file .kml và .kmz (tối đa 50MB)
      </Typography>
    </Paper>
  )
} 