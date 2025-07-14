import { Alert, Box, Container, Typography, useTheme } from "@mui/material";

interface ProjectErrorProps {
  error: Error;
}

export const ProjectError = ({ error }: ProjectErrorProps) => {
  const theme = useTheme();
  
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
  )
}