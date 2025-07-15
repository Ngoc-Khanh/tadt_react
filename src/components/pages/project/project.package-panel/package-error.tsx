import { Close as CloseIcon } from '@mui/icons-material';
import { Alert, Box, Drawer, IconButton, Typography } from '@mui/material';

interface PackageErrorProps {
  open: boolean;
  onClose: () => void;
  error: Error;
}

export function PackageError({ open, onClose, error }: PackageErrorProps) {
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
        <Alert severity="error">
          {error.message || 'Không thể tải dữ liệu gói thầu'}
        </Alert>
      </Box>
    </Drawer>
  )
}