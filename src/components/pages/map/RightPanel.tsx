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
import type { ImportedLayerData } from '@/services/assignment.api';

interface RightPanelProps {
  open: boolean;
  onClose: () => void;
  importedData?: ImportedLayerData | null;
}

export default function RightPanel({ open, onClose, importedData }: RightPanelProps) {
  const theme = useTheme();

  // Calculate stats from imported data
  const stats = importedData ? {
    packageCount: importedData.assignments.length,
    totalFeatures: importedData.layer_groups.reduce((total, group) => 
      total + group.layers.reduce((layerTotal, layer) => 
        layerTotal + (layer.geometry?.length || 0), 0
      ), 0
    ),
    assignedFeatures: importedData.assignments.length,
  } : {
    packageCount: 1,
    totalFeatures: 1,
    assignedFeatures: 0,
  };

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
        {importedData ? 'Imported Data Features' : 'Entity Features'}
      </Typography>
      <Typography variant="h6" fontWeight={600}>
        {importedData?.project_name || 'Polygon_001'}
      </Typography>
      <Typography fontSize={12} color="gray" mt={0.5}>
        {importedData ? `Import ID: ${importedData.import_id}` : 'Tòa nhà'}
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
          <Typography fontWeight={700}>{stats.packageCount}</Typography>
          <Typography fontSize={12} color="text.secondary">Gói thầu</Typography>
        </Box>
        <Box textAlign="center">
          <Typography fontWeight={700}>{stats.totalFeatures}</Typography>
          <Typography fontSize={12} color="text.secondary">Tổng Features</Typography>
        </Box>
        <Box textAlign="center">
          <Typography fontWeight={700}>{stats.assignedFeatures}/{stats.totalFeatures}</Typography>
          <Typography fontSize={12} color="text.secondary">Đã gán gói</Typography>
        </Box>
        <Box textAlign="center">
          <Typography fontWeight={700}>
            {stats.totalFeatures > 0 ? Math.round((stats.assignedFeatures / stats.totalFeatures) * 100) : 0}%
          </Typography>
          <Typography fontSize={12} color="text.secondary">Tiến độ gán</Typography>
        </Box>
      </Box>

      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography fontWeight={600}>
          Danh sách gói thầu ({stats.packageCount})
        </Typography>
        {importedData && (
          <Button
            startIcon={<LinkIcon />}
            variant="contained"
            size="small"
            sx={{ textTransform: 'none' }}
          >
            Xem chi tiết
          </Button>
        )}
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

      {/* Package List */}
      {importedData && importedData.assignments.length > 0 ? (
        <Stack spacing={1} mt={2}>
          {importedData.assignments.map((assignment) => (
            <Box
              key={assignment.id}
              p={1}
              border="1px solid #e0e0e0"
              borderRadius={1}
              bgcolor="#fafafa"
            >
              <Stack spacing={0.5}>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography fontSize={12} color="primary" fontWeight={600}>
                    {assignment.packageId}
                  </Typography>
                  <Typography fontSize={12} color="green" fontWeight={500}>
                    Đã gán
                  </Typography>
                </Box>
                <Typography fontSize={13} fontWeight={500}>
                  {assignment.packageName}
                </Typography>
                <Typography fontSize={11} color="gray">
                  Layer: {assignment.layerName} • Group: {assignment.groupName}
                </Typography>
                <Typography fontSize={11} color="gray">
                  LineString ID: {assignment.lineStringId}
                </Typography>
                <Box mt={0.5} display="flex" justifyContent="space-between">
                  <Typography fontSize={12} color="gray">
                    Gán lúc
                  </Typography>
                  <Typography fontSize={12} fontWeight={600}>
                    {new Date(assignment.timestamp).toLocaleString('vi-VN')}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      ) : (
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
      )}
    </Box>
  );
} 