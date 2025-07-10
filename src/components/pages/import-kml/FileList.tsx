import {
  clearAllFilesAtom,
  filesAtom,
  removeFileAtom
} from '@/stores/importKMLAtoms'
import { Check, Clear, Delete, Description, Error } from '@mui/icons-material'
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  Paper,
  Typography
} from '@mui/material'
import { useAtom, useSetAtom } from 'jotai'

export function FileList() {
  const [files] = useAtom(filesAtom)
  const removeFile = useSetAtom(removeFileAtom)
  const clearAllFiles = useSetAtom(clearAllFilesAtom)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (files.length === 0) {
    return null
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          Files đã tải ({files.length})
        </Typography>
        <Button
          size="small"
          onClick={() => clearAllFiles()}
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
              </Box>
              
              {file.status === 'success' && (
                <Chip icon={<Check />} label="OK" color="success" size="small" />
              )}
              
              {file.status === 'error' && (
                <Chip icon={<Error />} label="Lỗi" color="error" size="small" />
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
    </Box>
  )
} 