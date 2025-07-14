import { Box, Typography } from "@mui/material";

export default function ProjectDetailPage() {
  return (
    <Box sx={{ height: '100%', p: 3 }}>
      <Box sx={{ height: '100%', display: 'flex', gap: 3 }}>
        <Box sx={{ flex: '1 1 70%' }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Import KML/KMZ Files
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tải lên các file KML hoặc KMZ để hiển thị trên bản đồ
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}