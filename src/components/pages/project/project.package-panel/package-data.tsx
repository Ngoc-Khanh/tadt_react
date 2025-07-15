import { Close as CloseIcon } from '@mui/icons-material';
import { Alert, Box, Drawer, IconButton, Typography } from '@mui/material';

interface PackageDataProps {
  open: boolean;
  onClose: () => void;
}

export function PackageData({ open, onClose }: PackageDataProps) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 600,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            Chi tiết gói
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Alert severity="info">
          Vui lòng chọn một gói thầu để xem chi tiết
        </Alert>
      </Box>
    </Drawer>
  )
}