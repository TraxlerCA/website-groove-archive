'use client';

import { useMemo } from 'react';
import geojson from '@/data/amsterdam-ggw-zones.json';
import type { MapZoneConfig, MapZoneId } from '@/components/home/mapZones';

type Point = [number, number];
type PolygonCoordinates = Point[][];
type Geometry =
  | { type: 'Polygon'; coordinates: PolygonCoordinates }
  | { type: 'MultiPolygon'; coordinates: PolygonCoordinates[] };

type GeoFeature = {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    zoneId: MapZoneId | null;
    active: boolean;
  };
  geometry: Geometry;
};

type GeoCollection = {
  type: 'FeatureCollection';
  features: GeoFeature[];
};

type ProjectedFeature = {
  code: string;
  name: string;
  zoneId: MapZoneId | null;
  active: boolean;
  path: string;
};

type AmsterdamMapStageProps = {
  zones: MapZoneConfig[];
  activeZoneId: MapZoneId | null;
  onSelect: (zoneId: MapZoneId) => void;
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 740;
const VIEWBOX_PADDING = 34;
const LABEL_OFFSETS: Partial<Record<MapZoneId, { dx: number; dy: number }>> = {
  canal_glow: { dx: -24, dy: -6 },
  festival_peak: { dx: 10, dy: -8 },
  spiegel_funk: { dx: -20, dy: -16 },
  beton_tunnel: { dx: -18, dy: -14 },
  ndsm_fracture: { dx: 18, dy: -8 },
  jordaan_jack: { dx: -22, dy: 14 },
  amstel_rush: { dx: 20, dy: -10 },
  polder_drift: { dx: -10, dy: 18 },
  dam_pop_up: { dx: -16, dy: 12 },
  oost_dauw: { dx: 24, dy: 12 },
  nacht_ferry: { dx: 18, dy: 4 },
};

function forEachPoint(geometry: Geometry, callback: (point: Point) => void): void {
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => ring.forEach(callback));
    return;
  }
  geometry.coordinates.forEach(polygon => polygon.forEach(ring => ring.forEach(callback)));
}

function ringToPath(
  ring: Point[],
  project: (point: Point) => { x: number; y: number },
): string {
  if (ring.length === 0) return '';
  return `${ring
    .map((point, index) => {
      const projected = project(point);
      return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
    })
    .join(' ')} Z`;
}

function geometryToPath(
  geometry: Geometry,
  project: (point: Point) => { x: number; y: number },
): string {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ringToPath(ring, project)).join(' ');
  }
  return geometry.coordinates
    .map(polygon => polygon.map(ring => ringToPath(ring, project)).join(' '))
    .join(' ');
}

export default function AmsterdamMapStage({
  zones,
  activeZoneId,
  onSelect,
}: AmsterdamMapStageProps) {
  const geometry = geojson as GeoCollection;
  const zonesById = useMemo(
    () =>
      zones.reduce<Record<MapZoneId, MapZoneConfig>>((acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      }, {} as Record<MapZoneId, MapZoneConfig>),
    [zones],
  );

  const mapData = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    geometry.features.forEach(feature => {
      forEachPoint(feature.geometry, ([x, y]) => {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      });
    });

    const spanX = Math.max(0.000001, maxX - minX);
    const spanY = Math.max(0.000001, maxY - minY);
    const usableWidth = VIEWBOX_WIDTH - VIEWBOX_PADDING * 2;
    const usableHeight = VIEWBOX_HEIGHT - VIEWBOX_PADDING * 2;

    const project = ([x, y]: Point) => ({
      x: ((x - minX) / spanX) * usableWidth + VIEWBOX_PADDING,
      y: ((maxY - y) / spanY) * usableHeight + VIEWBOX_PADDING,
    });

    const zoneCentroids = new Map<MapZoneId, { sumX: number; sumY: number; count: number }>();
    const projectedFeatures: ProjectedFeature[] = geometry.features.map(feature => {
      const path = geometryToPath(feature.geometry, project);
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      forEachPoint(feature.geometry, point => {
        const projected = project(point);
        sumX += projected.x;
        sumY += projected.y;
        count += 1;
      });

      if (feature.properties.active && feature.properties.zoneId) {
        const existing = zoneCentroids.get(feature.properties.zoneId) || {
          sumX: 0,
          sumY: 0,
          count: 0,
        };
        zoneCentroids.set(feature.properties.zoneId, {
          sumX: existing.sumX + sumX,
          sumY: existing.sumY + sumY,
          count: existing.count + count,
        });
      }

      return {
        code: feature.properties.code,
        name: feature.properties.name,
        zoneId: feature.properties.zoneId,
        active: feature.properties.active,
        path,
      };
    });

    const zoneLabelPoints: Partial<Record<MapZoneId, { x: number; y: number }>> = {};
    zoneCentroids.forEach((value, key) => {
      zoneLabelPoints[key] = {
        x: value.sumX / value.count,
        y: value.sumY / value.count,
      };
    });

    return {
      features: projectedFeatures,
      zoneLabelPoints,
    };
  }, [geometry.features]);

  return (
    <section className="relative h-full">
      <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-black/80 bg-[#f6f6f6] shadow-[0_20px_50px_rgba(0,0,0,0.18)] sm:rounded-[2rem]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(175deg,#fafafa_0%,#f3f3f3_100%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-35">
          <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="h-full w-full" aria-hidden="true">
            <defs>
              <pattern id="paper-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 0 15 L 30 15 M 15 0 L 15 30" stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#paper-grid)" />
          </svg>
        </div>

        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          aria-label="Amsterdam map with interactive music zones"
          role="img"
        >
          <g>
            {mapData.features.map(feature => {
              const zoneId = feature.zoneId;
              if (!feature.active || !zoneId) return null;
              const zone = zoneId ? zonesById[zoneId] : null;
              const interactive = feature.active && Boolean(zone);
              const active = interactive && zoneId === activeZoneId;
              return (
                <path
                  key={`${feature.code}-fill`}
                  d={feature.path}
                  onClick={interactive && zoneId ? () => onSelect(zoneId) : undefined}
                  className={interactive ? 'cursor-pointer transition' : 'cursor-default transition'}
                  fill={active ? 'rgba(15,15,15,0.88)' : 'rgba(22,22,22,0.2)'}
                >
                  <title>{interactive ? feature.name : `${feature.name} (inactive)`}</title>
                </path>
              );
            })}
          </g>
          {activeZoneId ? (
            <g aria-hidden="true">
              {mapData.features
                .filter(feature => feature.active && feature.zoneId === activeZoneId)
                .map(feature => {
                  if (!feature.zoneId) return null;
                  return (
                    <path
                      key={`${feature.code}-highlight`}
                      d={feature.path}
                      fill="none"
                      stroke="rgba(255,255,255,0.95)"
                      strokeWidth={2.2}
                      vectorEffect="non-scaling-stroke"
                      opacity={1}
                    />
                  );
                })}
            </g>
          ) : null}
          <g aria-hidden="true" className="pointer-events-none">
            {mapData.features.map(feature => {
              if (!feature.active || !feature.zoneId) return null;
              const interactive = Boolean(zonesById[feature.zoneId]);
              const active = interactive && feature.zoneId === activeZoneId;
              return (
                <path
                  key={`${feature.code}-boundary`}
                  d={feature.path}
                  fill="none"
                  stroke={
                    active
                      ? 'rgba(255,255,255,0.95)'
                      : 'rgba(0,0,0,0.82)'
                  }
                  strokeWidth={active ? 1.7 : 1.2}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>
        </svg>

        <div className="absolute inset-0">
          {zones.map(zone => {
            const point = mapData.zoneLabelPoints[zone.id];
            if (!point) return null;
            const offset = LABEL_OFFSETS[zone.id] || { dx: 0, dy: 0 };
            const active = zone.id === activeZoneId;
            return (
              <button
                key={zone.id}
                type="button"
                onClick={() => onSelect(zone.id)}
                aria-label={`${zone.displayName}, ${zone.genreLabel}`}
                className={[
                  'absolute max-w-[11rem] rounded-full border px-2.5 py-1 text-center text-[0.58rem] leading-tight font-semibold tracking-[0.02em] transition focus-visible:outline-none focus-visible:ring-4',
                  'focus-visible:ring-black/20',
                  active
                    ? 'border-black bg-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)]'
                    : 'border-black/60 bg-white/92 text-neutral-900 hover:border-black hover:bg-white',
                ].join(' ')}
                style={{
                  left: `${(point.x / VIEWBOX_WIDTH) * 100}%`,
                  top: `${(point.y / VIEWBOX_HEIGHT) * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  marginLeft: `${offset.dx}px`,
                  marginTop: `${offset.dy}px`,
                }}
              >
                {zone.displayName}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
}
