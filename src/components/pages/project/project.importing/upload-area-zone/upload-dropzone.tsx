import { useDragAndDrop } from "@/hooks/useDragAndDrop"
import { CloudUpload } from "@mui/icons-material"
import { Paper, Typography } from "@mui/material"
import { useCallback, useRef } from "react"

interface UploadDropzoneProps {
  onFilesAdded: (files: File[]) => void
}

export function UploadDropzone({ onFilesAdded }: UploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { dragActive, dragHandlers } = useDragAndDrop(onFilesAdded)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (e.target.files?.length) {
      onFilesAdded(Array.from(e.target.files))
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFilesAdded])

  const onButtonClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

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
      {...dragHandlers}
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
  )
}