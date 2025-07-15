import { useMockDetailPackage } from '@/hooks';
import { Close as CloseIcon } from '@mui/icons-material';
import { Alert, Box, Card, CardContent, CircularProgress, Divider, Drawer, Grid, IconButton, LinearProgress, List, ListItem, ListItemText, Typography } from '@mui/material';
import React from 'react';

interface PackageDetailPanelProps {
  open: boolean;
  onClose: () => void;
  packageId?: string | null;
}

export const PackageDetailPanel: React.FC<PackageDetailPanelProps> = ({
  open,
  onClose,
  packageId
}) => {
  const { data: packageData, isLoading, error } = useMockDetailPackage(packageId || '');

  if (isLoading) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 600,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Drawer>
    );
  }

  if (error) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 600,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              Chi tiết gói
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Alert severity="error">
            {error.message || 'Không thể tải dữ liệu gói thầu'}
          </Alert>
        </Box>
      </Drawer>
    );
  }

  if (!packageData) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': {
            width: 600,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" fontWeight="bold">
              Chi tiết gói
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Alert severity="info">
            Vui lòng chọn một gói thầu để xem chi tiết
          </Alert>
        </Box>
      </Drawer>
    );
  }

  // Xử lý dữ liệu
  const actualProgress = packageData.tien_do_thuc_te || 0;
  const plannedProgress = packageData.tien_do_ke_hoach || 0;
  const getStatusInfo = () => {
    if (actualProgress >= 100) return { label: 'Hoàn thành', color: '#22C55E' };
    if (actualProgress >= plannedProgress) return { label: 'Đúng tiến độ', color: '#0EA5E9' };
    if (actualProgress > 0) return { label: 'Chậm tiến độ', color: '#FACC15' };
    return { label: 'Chưa bắt đầu', color: '#9CA3AF' };
  };
  const statusColor = getStatusInfo();
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa xác định';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return dateString;
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDrawer-paper': {
          width: 600,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 4, height: '100%', overflow: 'auto', bgcolor: '#fafbfc' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="primary.main">
              {packageData.ten_goi_thau}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: statusColor.color, fontWeight: 600 }}>
              {statusColor.label}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {/* Thông tin chi tiết */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ID Gói thầu
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {packageData.package_id}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Ngày bắt đầu kế hoạch
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(packageData.ngay_bd_ke_hoach)}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Ngày kết thúc kế hoạch
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {formatDate(packageData.ngay_kt_ke_hoach)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tiến độ thực tế
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" color="primary" fontWeight={700}>
                    {actualProgress.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={actualProgress}
                    sx={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: 'grey.200', '& .MuiLinearProgress-bar': { backgroundColor: statusColor.color, borderRadius: 5 } }}
                  />
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Tiến độ kế hoạch
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h6" color="warning.main" fontWeight={700}>
                    {plannedProgress.toFixed(1)}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={plannedProgress}
                    sx={{ flex: 1, height: 10, borderRadius: 5, backgroundColor: 'grey.200', '& .MuiLinearProgress-bar': { backgroundColor: 'warning.main', borderRadius: 5 } }}
                  />
                </Box>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Chênh lệch tiến độ
                </Typography>
                <Typography variant="h6" color={actualProgress >= plannedProgress ? 'success.main' : 'error.main'} fontWeight={700}>
                  {(actualProgress - plannedProgress).toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Danh sách gói thầu */}
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Danh sách gói thầu liên quan
            </Typography>
            {packageData.danh_sach_goi_thau && packageData.danh_sach_goi_thau.length > 0 ? (
              <List dense>
                {packageData.danh_sach_goi_thau.map((item, idx) => (
                  <ListItem key={idx} sx={{ pl: 0 }}>
                    <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">Không có dữ liệu</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Drawer>
  );
};
