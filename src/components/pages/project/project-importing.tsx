import { UploadArea } from "@/components/pages/project/project.importing";
import { Box, Typography } from "@mui/material";

export function ProjectImporting() {
  return (
    <Box className="h-full p-6">
      <Box className="h-full flex gap-3">
        <Box className="flex-1">
          <Box className="h-full flex flex-col">
            {/* Header */}
            <Box className="mb-4">
              <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
                Import KML/KMZ Files
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tải lên các file KML hoặc KMZ để hiển thị trên bản đồ
              </Typography>
            </Box>

            {/* Upload Area */}
            <UploadArea />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}