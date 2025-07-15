import type { UploadFile } from "@/hooks/useUploadFiles"
import { CloudUpload, Error as ErrorIcon } from "@mui/icons-material"
import { Box, Button, CircularProgress, Typography } from "@mui/material"

interface FileListActionsProps {
  files: UploadFile[]
  onImport: () => void
  isImporting: boolean
}

export function FileListActions({ files, onImport, isImporting }: FileListActionsProps) {
  const pendingFiles = files.filter(f => f.status === 'pending')
  const errorFiles = files.filter(f => f.status === 'error')
  const successFiles = files.filter(f => f.status === 'success')
  
  const canImport = pendingFiles.length > 0 || errorFiles.length > 0
  const hasSuccessFiles = successFiles.length > 0

  const getButtonText = () => {
    if (isImporting) return 'Đang import...'
    if (hasSuccessFiles && pendingFiles.length === 0 && errorFiles.length === 0) return 'Import hoàn tất'
    return `Import ${canImport ? pendingFiles.length + errorFiles.length : 0} file`
  }

  const getButtonVariant = () => {
    if (hasSuccessFiles && !canImport) return 'outlined'
    return 'contained'
  }

  return (
    <Box
      sx={{
        p: 2,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'grey.50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Box>
        {errorFiles.length > 0 && (
          <Typography
            variant="caption"
            color="error"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <ErrorIcon fontSize="small" />
            {errorFiles.length} file có lỗi. Nhấn Import để thử lại.
          </Typography>
        )}
        
        {isImporting && (
          <Typography
            variant="caption"
            color="primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            Đang xử lý {pendingFiles.length + errorFiles.length} file...
          </Typography>
        )}
      </Box>

      <Button
        variant={getButtonVariant()}
        color="primary"
        onClick={onImport}
        disabled={!canImport && !hasSuccessFiles}
        startIcon={
          isImporting ? (
            <CircularProgress size={16} color="inherit" />
          ) : (
            <CloudUpload />
          )
        }
        sx={{ minWidth: '140px' }}
      >
        {getButtonText()}
      </Button>
    </Box>
  )
}