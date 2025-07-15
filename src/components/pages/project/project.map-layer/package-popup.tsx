import { Box, Button, Chip, LinearProgress, Typography } from '@mui/material';
import React from 'react';

interface PackagePopupProps {
  packageName: string;
  status: string;
  statusColor: { color: string; label: string };
  progress: number;
  onViewDetails: () => void;
}

export const PackagePopup: React.FC<PackagePopupProps> = React.memo(({
  packageName,
  status,
  statusColor,
  progress,
  onViewDetails
}) => (
  <Box sx={{ minWidth: 280, maxWidth: 320 }}>
    <Typography variant="h6" component="h3" gutterBottom>
      {packageName}
    </Typography>

    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Trạng thái: {status}
    </Typography>

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Chip
        label={statusColor.label}
        size="small"
        sx={{
          backgroundColor: statusColor.color,
          color: 'white',
          fontWeight: 'medium'
        }}
      />
    </Box>

    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Tiến độ
        </Typography>
        <Typography variant="caption" color="primary" fontWeight="bold">
          {progress}%
        </Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={progress}
        sx={{
          height: 8,
          borderRadius: 4,
          backgroundColor: 'grey.200',
          '& .MuiLinearProgress-bar': {
            backgroundColor: statusColor.color,
            borderRadius: 4
          }
        }}
      />
    </Box>

    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={onViewDetails}
        sx={{ fontWeight: 'medium' }}
      >
        Xem chi tiết
      </Button>
    </Box>
  </Box>
));