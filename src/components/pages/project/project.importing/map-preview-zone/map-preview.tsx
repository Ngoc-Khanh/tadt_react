import { useMapPreviewData } from "@/hooks/useMapPreviewData";
import { Box, Paper } from "@mui/material";
import { MapHeader } from "./map-header";
import { MapContainer } from "./map-container";

interface MapPreviewProps {
  onBack: () => void;
}

export function MapPreview({ onBack }: MapPreviewProps) {
  const { layerGroups, totalLayers } = useMapPreviewData()

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Paper
        elevation={2}
        sx={{
          mt: 2,
          height: 'calc(100vh - 200px)',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <MapHeader
          totalLayers={totalLayers}
          onBack={onBack}
        />
        <MapContainer layerGroups={layerGroups} />
      </Paper>
    </Box>
  );
}
