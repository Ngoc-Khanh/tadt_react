import { Typography } from '@mui/material';
import React from 'react';

interface ZonePopupProps {
  zoneName: string;
  packageCount: number;
}

export const ZonePopup: React.FC<ZonePopupProps> = React.memo(({ zoneName, packageCount }) => (
  <div className="flex flex-col gap-1 min-w-[200px]">
    <Typography
      variant="h6"
      className="font-bold text-primary-700"
      sx={{ mb: 0.5, fontSize: 18, lineHeight: 1.2 }}
    >
      {zoneName}
    </Typography>
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-600 font-semibold text-base shadow-sm">
        {packageCount}
      </span>
      <Typography
        variant="body2"
        className="text-gray-600"
        sx={{ fontSize: 15 }}
      >
        Gói thầu
      </Typography>
    </div>
  </div>
)); 