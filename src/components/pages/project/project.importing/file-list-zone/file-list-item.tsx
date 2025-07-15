import type { UploadFile } from "@/hooks/useUploadFiles"
import { Delete } from "@mui/icons-material"
import { Box, Chip, IconButton, LinearProgress, Tooltip, Typography } from "@mui/material"
import { FileSize } from "./file-size"
import { FileStatusIcon } from "./file-status-icon"

interface FileListItemProps {
  file: UploadFile
  onRemove: () => void
  disabled?: boolean
}

export function FileListItem({ file, onRemove, disabled }: FileListItemProps) {
  const getStatusColor = () => {
    switch (file.status) {
      case 'success': return 'success'
      case 'error': return 'error'
      case 'processing': return 'primary'
      default: return 'default'
    }
  }

  const getStatusText = () => {
    switch (file.status) {
      case 'success': return 'Thành công'
      case 'error': return 'Lỗi'
      case 'processing': return 'Đang xử lý...'
      default: return 'Chờ xử lý'
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        '&:last-child': {
          borderBottom: 0
        },
        bgcolor: file.status === 'error' ? 'error.50' : 'transparent'
      }}
    >
      <FileStatusIcon status={file.status} />

      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Typography
            variant="body2"
            fontWeight="medium"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flexGrow: 1
            }}
          >
            {file.name}
          </Typography>
          
          <FileSize size={file.size} />
          
          <Chip
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
            variant="outlined"
          />
        </Box>

        {file.status === 'processing' && (
          <LinearProgress
            variant="determinate"
            value={file.progress}
            sx={{ mt: 1, height: 4, borderRadius: 2 }}
          />
        )}

        {file.error && (
          <Typography
            variant="caption"
            color="error"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {file.error}
          </Typography>
        )}
      </Box>

      <Tooltip title="Xóa file">
        <IconButton
          onClick={onRemove}
          disabled={disabled}
          size="small"
          color="error"
        >
          <Delete />
        </IconButton>
      </Tooltip>
    </Box>
  )
}