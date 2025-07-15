import { CloudUpload } from "@mui/icons-material"
import { Box, Button, Typography } from "@mui/material"

interface MapHeaderProps {
  totalLayers: number
  onBack: () => void
}

export function MapHeader({ totalLayers, onBack }: MapHeaderProps) {
  return (
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
          {totalLayers} layer đã được tải lên thành công
        </Typography>
      </Box>

      <Button
        variant="outlined"
        color="primary"
        startIcon={<CloudUpload />}
        onClick={onBack}
        sx={{
          ml: 2,
          minWidth: '140px',
          borderRadius: 2
        }}
      >
        Quay lại Upload
      </Button>
    </Box>
  )
}