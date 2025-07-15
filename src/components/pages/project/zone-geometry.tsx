import type { IMapMockGeometry } from '@/constants/mock';
import React from 'react';
import { Polygon, Polyline, Popup } from 'react-leaflet';
import { ZonePopup } from './zone-popup';

interface ZoneGeometryProps {
  zoneId: string;
  zoneName: string;
  packageCount: number;
  geometry: IMapMockGeometry[];
  selectedZone: string | null;
  onZoneClick: (zoneId: string) => void;
}

export const ZoneGeometry: React.FC<ZoneGeometryProps> = React.memo(({
  zoneId,
  zoneName,
  packageCount,
  geometry,
  selectedZone,
  onZoneClick
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderGeometry = (geom: any, idx: number) => {
    const commonProps = {
      key: `zone-${zoneId}-geom-${idx}`,
      positions: geom.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]),
      pathOptions: { color: "#0EA5E9", weight: 4 },
      eventHandlers: { click: () => onZoneClick(zoneId) }
    };

    const popupContent = selectedZone === zoneId ? (
      <Popup>
        <ZonePopup zoneName={zoneName} packageCount={packageCount} />
      </Popup>
    ) : null;

    if (geom.type === "LineString") {
      return (
        <Polyline {...commonProps}>
          {popupContent}
        </Polyline>
      );
    }
    if (geom.type === "Polygon") {
      return (
        <Polygon {...commonProps}>
          {popupContent}
        </Polygon>
      );
    }
    return null;
  };

  return <>{geometry?.map(renderGeometry)}</>;
}); 