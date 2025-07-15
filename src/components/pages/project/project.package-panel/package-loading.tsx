import { Box, CircularProgress, Drawer } from '@mui/material';

interface PackageLoadingProps {
  open: boolean;
  onClose: () => void;
}

export function PackageLoading({ open, onClose }: PackageLoadingProps) {
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
      <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    </Drawer>
  )
}