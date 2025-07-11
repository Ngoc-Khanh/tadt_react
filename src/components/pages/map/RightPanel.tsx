import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import SearchIcon from '@mui/icons-material/Search';
import LinkIcon from '@mui/icons-material/Link';

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function RightPanel({ open, onClose }: RightPanelProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        height: '100%',
        width: { xs: '100%', sm: 400, md: 600, lg: 700, xl: 800 },
        bgcolor: 'background.paper',
        overflowY: 'auto',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        opacity: open ? 1 : 0,
        transition: theme.transitions.create(['transform', 'opacity'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 1300,
        boxShadow: 3,
      }}
    >
      <Box display="flex" justifyContent="flex-end">
        <IconButton onClick={onClose}>
          {theme.direction === 'ltr' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      <Typography fontSize={12} color="text.secondary" mb={0.5}>
        Entity Features
      </Typography>
      <Typography variant="h6" fontWeight={600}>
        Polygon_001
      </Typography>
      <Typography fontSize={12} color="gray" mt={0.5}>
        Tòa nhà
      </Typography>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={2}
        p={1}
        borderRadius={2}
        bgcolor="#f5f6fa"
      >
        <Box textAlign="center">
          <Typography fontWeight={700}>1</Typography>
          <Typography fontSize={12} color="text.secondary">Gói thầu</Typography>
        </Box>
        <Box textAlign="center">
          <Typography fontWeight={700}>24.500.000.000 ₫</Typography>
          <Typography fontSize={12} color="text.secondary">Tổng ngân sách</Typography>
        </Box>
        <Box textAlign="center">
          <Typography fontWeight={700}>0/1</Typography>
          <Typography fontSize={12} color="text.secondary">Hoàn thành</Typography>
        </Box>
        <Box textAlign="center">
          <Typography fontWeight={700}>65%</Typography>
          <Typography fontSize={12} color="text.secondary">Tiến độ TB</Typography>
        </Box>
      </Box>

      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={600}>Danh sách gói thầu (1)</Typography>
        <Button
          startIcon={<LinkIcon />}
          variant="contained"
          size="small"
          sx={{ textTransform: 'none' }}
        >
          Liên kết thêm
        </Button>
      </Box>

      <Box mt={1}>
        <TextField
          fullWidth
          size="small"
          placeholder="Tìm kiếm gói thầu"
          InputProps={{
            endAdornment: <SearchIcon fontSize="small" />,
          }}
        />
      </Box>

      <Box
        mt={2}
        p={1}
        border="1px solid #e0e0e0"
        borderRadius={1}
        bgcolor="#fafafa"
      >
        <Stack spacing={0.5}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography fontSize={12} color="primary" fontWeight={600}>
              G01
            </Typography>
            <Typography fontSize={12} color="green" fontWeight={500}>
              Đang thực hiện
            </Typography>
          </Box>
          <Typography fontSize={13} fontWeight={500}>
            Gói thầu xây dựng hạ tầng kỹ thuật
          </Typography>
          <Typography fontSize={11} color="gray">
            Xây dựng hệ thống đường giao thông, cấp thoát nước...
          </Typography>
          <Box mt={0.5}>
            <LinearProgress variant="determinate" value={65} />
            <Box display="flex" justifyContent="space-between">
              <Typography fontSize={10} color="gray">Tiến độ</Typography>
              <Typography fontSize={10} color="gray">65%</Typography>
            </Box>
          </Box>
          <Box mt={0.5} display="flex" justifyContent="space-between">
            <Typography fontSize={12} color="gray">
              Ngân sách
            </Typography>
            <Typography fontSize={12} fontWeight={600}>
              24.500.000.000 ₫
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
} 