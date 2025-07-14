import { ProjectCard } from "@/components/pages/project/project-card";
import { useProjects } from "@/services/hooks";
import {
  Alert,
  Box,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
  useTheme
} from "@mui/material";

export default function ProjectPage() {
  const { data: projects, isLoading, error } = useProjects();
  const theme = useTheme();

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={60} />
          <Typography color="text.secondary">Đang tải dự án...</Typography>
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Container maxWidth="sm">
          <Alert
            severity="error"
            sx={{
              p: 3,
              borderRadius: 3,
              boxShadow: theme.shadows[3],
            }}
          >
            <Typography variant="h6" gutterBottom>
              Có lỗi xảy ra
            </Typography>
            <Typography variant="body2">{error.message}</Typography>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: "grey.50" }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {projects && projects.length > 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: { xs: 2, md: 4 },
              alignItems: 'stretch',
              pb: 6,
            }}
          >
            {projects.map((project) => (
              <Box
                key={project.project_id}
                sx={{
                  flex: '1 1 300px',
                  maxWidth: { xs: '100%', sm: '48%', md: '31%', lg: '23%' },
                  minWidth: 260,
                  display: 'flex',
                }}
              >
                <ProjectCard project={project} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Paper
              elevation={2}
              sx={{
                p: 6,
                maxWidth: 400,
                mx: "auto",
                borderRadius: 4,
              }}
            >
              <Typography variant="h1" sx={{ fontSize: "4rem", mb: 2 }}>
                📁
              </Typography>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Chưa có dự án
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hiện tại chưa có dự án nào trong hệ thống.
              </Typography>
            </Paper>
          </Box>
        )}
      </Container>
    </Box>
  );
}