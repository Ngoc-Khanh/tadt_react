import { ProjectError, ProjectLoading } from "@/components/pages/project";
import { ProjectCard } from "@/components/pages/project/project-card";
import { useProjects } from "@/services/hooks";
import { Box, Container, Paper, Typography } from "@mui/material";

export default function ProjectPage() {
  const { data: projects, isLoading, error } = useProjects();

  if (isLoading) return <ProjectLoading />

  if (error) return <ProjectError error={error} />

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