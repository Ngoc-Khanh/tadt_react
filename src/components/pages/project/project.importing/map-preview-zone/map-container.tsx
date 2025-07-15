import type { LayerGroup } from "@/stores"
import { Box } from "@mui/material"
import { LeafletMap } from "./leaflet-map"

interface MapContainerProps {
  layerGroups: LayerGroup[]
}

export function MapContainer({ layerGroups }: MapContainerProps) {
  return (
    <Box
      sx={{
        flexGrow: 1,
        position: 'relative',
        overflow: 'hidden',
        '& .leaflet-container': {
          height: '100%',
          width: '100%',
          zIndex: 1
        }
      }}
    >
      <LeafletMap layerGroups={layerGroups} />
    </Box>
  )
}