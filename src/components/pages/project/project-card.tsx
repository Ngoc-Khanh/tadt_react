import { routes } from "@/config";
import { type IProjectResponse } from "@/constants/interfaces";
import {
  AutorenewOutlined,
  Cancel,
  CheckCircle,
  HelpOutline,
  Pause,
  PlayArrow,
  Schedule,
  Visibility,
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Link } from "react-router-dom";

// Helper: Màu trạng thái
const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
  switch (status) {
    case 'Hoàn thành': return 'success';
    case 'Đã hủy': return 'error';
    case 'Chờ xử lý': return 'warning';
    case 'Đang xử lý': return 'info';
    case 'Đã tạm dừng': return 'default';
    case 'Đang thực hiện': return 'info';
    default: return 'default';
  }
};
// Helper: Icon trạng thái
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Đang thực hiện': return <AutorenewOutlined fontSize="small" />;
    case 'Hoàn thành': return <CheckCircle fontSize="small" />;
    case 'Đã hủy': return <Cancel fontSize="small" />;
    case 'Chờ xử lý': return <Schedule fontSize="small" />;
    case 'Đang xử lý': return <PlayArrow fontSize="small" />;
    case 'Đã tạm dừng': return <Pause fontSize="small" />;
    default: return <HelpOutline fontSize="small" />;
  }
};
// Helper: Màu progress
const getProgressColor = (progress: number): 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  if (progress >= 80) return 'success';
  if (progress >= 60) return 'primary';
  if (progress >= 40) return 'info';
  if (progress >= 20) return 'warning';
  return 'error';
};
// Helper: Format ngày
const formatDate = (dateString: string) => {
  if (!dateString) return '--';
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? '--' : d.toLocaleDateString('vi-VN');
};

export const ProjectCard = ({ project }: { project: IProjectResponse }) => {
  const theme = useTheme();
  const statusColor = getStatusColor(project.trang_thai);
  const progressColor = getProgressColor(project.tien_do_thuc_te);
  const statusIcon = getStatusIcon(project.trang_thai);

  return (
    <Card
      sx={{
        width: '100%',
        minHeight: 320,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: theme.shadows[1],
      }}
    >
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pb: 1 }}>
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '3.2em',
          }}
        >
          {project.ten_du_an}
        </Typography>
        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tiến độ thực tế
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {project.tien_do_thuc_te}%
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, project.tien_do_thuc_te))}
            color={progressColor}
            sx={{ height: 8, borderRadius: 4, bgcolor: alpha(theme.palette.grey[300], 0.3) }}
          />
        </Box>
        {/* Info */}
        <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
          <Paper
            variant="outlined"
            sx={{ p: 1.5, bgcolor: alpha(theme.palette.grey[50], 0.5), borderRadius: 2 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Trạng thái:
              </Typography>
              <Chip
                icon={statusIcon}
                label={project.trang_thai}
                color={statusColor}
                size="small"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            </Stack>
          </Paper>
          <Paper
            variant="outlined"
            sx={{ p: 1.5, bgcolor: alpha(theme.palette.grey[50], 0.5), borderRadius: 2 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Cập nhật:
              </Typography>
              <Typography variant="body2" fontWeight="medium">
                {formatDate(project.ngay_cap_nhat)}
              </Typography>
            </Stack>
          </Paper>
        </Stack>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Link to={routes.projectDetail(project.project_id)} style={{ textDecoration: 'none', flexGrow: 1 }}>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Visibility />}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 1.2 }}
          >
            Xem chi tiết
          </Button>
        </Link>
      </CardActions>
    </Card>
  );
};