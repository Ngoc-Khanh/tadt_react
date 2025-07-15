import { ProjectError, ProjectImporting, ProjectMainMap, ProjectLoading } from "@/components/pages/project";
import { routes } from "@/config";
import { useProjectDetail } from "@/hooks";
import { KeyboardArrowLeft, Layers, Map } from "@mui/icons-material";
import { Box, Button, Chip, IconButton, Paper, Tooltip, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function ProjectDetailPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const { data: project, isLoading, error } = useProjectDetail(projectId!)
  const [isImporting, setIsImporting] = useState<boolean>(false)

  if (isImporting) return <ProjectImporting projectId={projectId} />

  if (isLoading) return <ProjectLoading />
  if (error) return <ProjectError error={error} />

  return (
    <Box className="flex flex-col bg-gray-50">
      {/* Enhanced Header */}
      <Paper
        elevation={1}
        className="flex items-center justify-between p-4 m-4 rounded-xl bg-white shadow"
      >
        <Box className="flex items-center gap-2">
          <IconButton
            onClick={() => navigate(routes.root)}
            sx={{
              bgcolor: 'primary.50',
              color: 'primary.main',
              '&:hover': { bgcolor: 'primary.100' }
            }}
          >
            <KeyboardArrowLeft />
          </IconButton>

          <Box>
            <Box className="flex items-center gap-1">
              <Map color="primary" />
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {project?.ten_du_an}
              </Typography>
            </Box>
            <Box className="flex flex-wrap gap-1">
              <Chip
                label={`${project?.trang_thai}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
        </Box>

        <Box className="flex gap-2 p-2">
          <Tooltip title="Import dữ liệu vào bản đồ chính">
            <Button
              startIcon={<Layers />}
              variant="outlined"
              size="small"
              sx={{
                px: 3,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
              onClick={() => setIsImporting(true)}
            >
              Thêm dữ liệu vào bản đồ
            </Button>
          </Tooltip>
        </Box>
      </Paper>

      <Box className="flex-grow flex gap-2 px-2 pb-2 h-[750px] min-h-0">
        <Paper
          elevation={2}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            transition: 'margin-right 0.3s ease-in-out',
          }}
        >
          <Box sx={{ position: 'relative', height: '100%' }}>
            <ProjectMainMap projectId={projectId!} />
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}