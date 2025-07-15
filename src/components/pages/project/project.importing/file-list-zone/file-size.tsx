import { Typography } from "@mui/material"

interface FileSizeProps {
  size: number
}

export function FileSize({ size }: FileSizeProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ whiteSpace: 'nowrap' }}
    >
      {formatFileSize(size)}
    </Typography>
  )
}