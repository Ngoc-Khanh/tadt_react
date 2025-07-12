import type { IMapResponse } from '@/constants/interfaces';
import type { LayerGroup, PackageAssignment } from '@/stores/importKMLAtoms';
import { selectedFeaturesForMapAtom } from '@/stores/importKMLAtoms';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useAtom } from 'jotai';
import { memo } from 'react';
import { TbCurrentLocation, TbFileImport, TbInfoCircle, TbZoomScan } from "react-icons/tb";

type MapRenderData = {
  layerGroups: LayerGroup[]
  assignments: PackageAssignment[]
  projectInfo: IMapResponse | null
  importedAt: string
}

interface AccordionUsageProps {
  onLayerClick: () => void;
  mapRenderData?: MapRenderData | null;
  onZoomToLayer?: (layerId: string) => void;
}

const AccordionUsage = memo(function AccordionUsage({
  onLayerClick,
  mapRenderData,
  onZoomToLayer
}: AccordionUsageProps) {
  // Get selected features from atom
  const [selectedFeatures] = useAtom(selectedFeaturesForMapAtom);

  // Fallback UI when no data imported
  if (!mapRenderData || !mapRenderData.layerGroups.length) {
    return (
      <Box sx={{
        p: 3,
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <TbFileImport className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Chưa có dữ liệu
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Vui lòng import file KML để xem các layer và thông tin chi tiết
        </Typography>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          p: 2,
          bgcolor: 'info.50',
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'info.200'
        }}>
          <TbInfoCircle className="w-4 h-4 text-blue-500" />
          <Typography variant="caption" color="info.main">
            Hỗ trợ định dạng: KML, KMZ
          </Typography>
        </Box>
      </Box>
    );
  }

  // Count selected features per layer
  const getSelectedFeatureCount = (layerId: string) => {
    return selectedFeatures.filter(feature => feature.layerId === layerId).length;
  };

  // Handle zoom to layer
  const handleZoomToLayer = (layerId: string) => {
    onZoomToLayer?.(layerId);
  };

  return (
    <div>
      {mapRenderData.layerGroups.map((group, index) => {
        const assignedPackages = mapRenderData.assignments.filter(a =>
          a.groupId === group.id
        ) || [];

        return (
          <Accordion key={group.id} defaultExpanded={index === 0}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}-content`}
              id={`panel${index}-header`}
            >
              <div className="flex items-center justify-between w-full mr-4">
                <Typography component="span" variant="subtitle2" fontWeight="medium">
                  {group.name}
                </Typography>
                {assignedPackages.length > 0 && (
                  <Chip
                    label={`${assignedPackages.length} gói thầu`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </div>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 1 }}>
              {group.layers.map((layer) => {
                const hasLineString = layer.geometry.some(geom => geom.type === 'LineString');
                const selectedCount = getSelectedFeatureCount(layer.id);

                return (
                  <Box key={layer.id} sx={{ mb: 0.5 }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 1,
                      borderRadius: 1,
                      bgcolor: selectedCount > 0 ? 'success.50' : 'transparent',
                      border: selectedCount > 0 ? '1px solid' : '1px solid transparent',
                      borderColor: selectedCount > 0 ? 'success.main' : 'transparent'
                    }}>
                      {/* Layer info */}
                      <Button
                        onClick={onLayerClick}
                        className="flex w-full justify-between items-center"
                        sx={{
                          color: 'text.primary',
                          p: 1,
                          borderRadius: 1,
                          textTransform: 'none',
                          flexGrow: 1,
                          '&:hover': {
                            bgcolor: 'action.hover'
                          }
                        }}
                      >
                        <TbZoomScan className='w-5 h-5' />
                        <div className="flex flex-col flex-1 mx-2 gap-0.5">
                          <Typography variant="body2" fontWeight="medium" className="text-left">
                            {layer.name} {hasLineString && <Chip label="LineString" size="small" color="info" variant="outlined" sx={{ ml: 1 }} />}
                            {selectedCount > 0 && <Chip label={`${selectedCount} đã chọn`} size="small" color="success" variant="filled" sx={{ ml: 1 }} />}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" className="text-left">
                            {assignedPackages.find(a => a.layerId === layer.id)?.packageName || 'Chưa gán gói thầu'}
                          </Typography>
                        </div>
                      </Button>

                      {/* Zoom to layer button */}
                      {hasLineString && (
                        <Button
                          onClick={() => handleZoomToLayer(layer.id)}
                          variant="outlined"
                          size="small"
                          sx={{
                            minWidth: 'auto',
                            p: 0.5,
                            ml: 1
                          }}
                        >
                          <TbCurrentLocation className='w-4 h-4' />
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </div>
  );
});

export default AccordionUsage; 