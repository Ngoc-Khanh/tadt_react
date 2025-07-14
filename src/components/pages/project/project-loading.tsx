import { Box, CircularProgress, Stack, Typography } from "@mui/material"

export const ProjectLoading = () => {
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
  )
}