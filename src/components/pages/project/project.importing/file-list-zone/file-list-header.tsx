import { Clear } from "@mui/icons-material"
import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material"

interface FileListHeaderProps {
  totalFiles: number
  successCount: number
  errorCount: number
  onClearAll: () => void
  isImporting: boolean
}

export function FileListHeader({ totalFiles, successCount, errorCount, onClearAll, isImporting }: FileListHeaderProps) {
  return (
    <Box
      sx={{
        p: 2,
        borderBottom: 1,
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: 'grey.50'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle1" fontWeight="medium">
          Danh sách file ({totalFiles})
        </Typography>

        {successCount > 0 && (
          <Chip
            label={`${successCount} thành công`}
            color="success"
            size="small"
            variant="outlined"
          />
        )}

        {errorCount > 0 && (
          <Chip
            label={`${errorCount} lỗi`}
            color="error"
            size="small"
            variant="outlined"
          />
        )}
      </Box>

      <Tooltip title="Xóa tất cả">
        <IconButton
          onClick={onClearAll}
          disabled={isImporting}
          size="small"
          color="error"
        >
          <Clear />
        </IconButton>
      </Tooltip>
    </Box>
  )
}