import { Box, Typography } from "@mui/material";
import { UploadArea } from "./upload-area";

interface ProjectImportingProps {
  projectId?: string
}

export function ProjectImporting({ projectId }: ProjectImportingProps) {
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
            <UploadArea projectId={projectId} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}