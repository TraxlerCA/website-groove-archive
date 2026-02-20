'use client';

import { useMemo } from 'react';
import geojson from '@/data/amsterdam-ggw-zones.json';
import type { MapZoneConfig, MapZoneId } from '@/components/home/mapZones';

type Point = [number, number];
type PolygonCoordinates = Point[][];
type Geometry =
  | { type: 'Polygon'; coordinates: PolygonCoordinates }
  | { type: 'MultiPolygon'; coordinates: PolygonCoordinates[] };
type ReferenceKind = 'water' | 'road' | 'canal';

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

type ReferenceLine = {
  id: string;
  label: string;
  kind: ReferenceKind;
  points: Point[];
};

type ProjectedReferenceLine = {
  id: string;
  label: string;
  kind: ReferenceKind;
  path: string;
  labelPoint: { x: number; y: number };
};

type ReferenceLandmark = {
  id: string;
  label: string;
  point: Point;
};

type ProjectedReferenceLandmark = {
  id: string;
  label: string;
  x: number;
  y: number;
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

const REFERENCE_LINES: ReferenceLine[] = [
  {
    id: 'het-ij',
    label: 'Het IJ',
    kind: 'water',
    points: [
      [4.803, 52.3926],
      [4.84, 52.3918],
      [4.875, 52.3917],
      [4.91, 52.3922],
      [4.946, 52.3933],
      [4.982, 52.3946],
      [5.015, 52.3957],
    ],
  },
  {
    id: 'amstel',
    label: 'Amstel',
    kind: 'water',
    points: [
      [4.914, 52.395],
      [4.909, 52.387],
      [4.904, 52.378],
      [4.899, 52.369],
      [4.896, 52.36],
      [4.893, 52.351],
      [4.891, 52.342],
      [4.889, 52.333],
      [4.887, 52.324],
    ],
  },
  {
    id: 'a10-sw',
    label: 'A10 Ring',
    kind: 'road',
    points: [
      [4.808, 52.386],
      [4.826, 52.374],
      [4.844, 52.362],
      [4.863, 52.351],
      [4.884, 52.341],
      [4.906, 52.333],
      [4.93, 52.329],
      [4.954, 52.329],
    ],
  },
  {
    id: 'a10-east',
    label: 'A10 Ring',
    kind: 'road',
    points: [
      [4.954, 52.329],
      [4.974, 52.338],
      [4.99, 52.352],
      [4.999, 52.368],
      [4.998, 52.384],
      [4.987, 52.398],
      [4.968, 52.405],
      [4.945, 52.405],
    ],
  },
  {
    id: 'a10-nw',
    label: 'A10 Ring',
    kind: 'road',
    points: [
      [4.945, 52.405],
      [4.922, 52.401],
      [4.899, 52.397],
      [4.876, 52.393],
      [4.852, 52.39],
      [4.829, 52.389],
      [4.808, 52.386],
    ],
  },
  {
    id: 'gracht-outer',
    label: 'Canal Belt',
    kind: 'canal',
    points: [
      [4.883, 52.377],
      [4.878, 52.372],
      [4.879, 52.366],
      [4.885, 52.362],
      [4.894, 52.361],
      [4.902, 52.364],
      [4.906, 52.369],
      [4.904, 52.374],
      [4.897, 52.377],
      [4.889, 52.378],
      [4.883, 52.377],
    ],
  },
  {
    id: 'gracht-mid',
    label: 'Canal Belt',
    kind: 'canal',
    points: [
      [4.886, 52.375],
      [4.882, 52.371],
      [4.883, 52.367],
      [4.889, 52.364],
      [4.896, 52.364],
      [4.901, 52.366],
      [4.903, 52.37],
      [4.901, 52.373],
      [4.895, 52.375],
      [4.889, 52.376],
      [4.886, 52.375],
    ],
  },
  {
    id: 'gracht-inner',
    label: 'Canal Belt',
    kind: 'canal',
    points: [
      [4.888, 52.3735],
      [4.885, 52.3704],
      [4.887, 52.3678],
      [4.891, 52.3662],
      [4.896, 52.3662],
      [4.899, 52.3678],
      [4.9, 52.3705],
      [4.897, 52.3728],
      [4.892, 52.3737],
      [4.888, 52.3735],
    ],
  },
];

const REFERENCE_LANDMARKS: ReferenceLandmark[] = [
  { id: 'centraal', label: 'Centraal', point: [4.9003, 52.378] },
  { id: 'dam', label: 'Dam', point: [4.8922, 52.3731] },
  { id: 'museumplein', label: 'Museumplein', point: [4.8813, 52.3579] },
  { id: 'ndsm', label: 'NDSM', point: [4.8946, 52.4022] },
  { id: 'arena', label: 'Arena', point: [4.9418, 52.3146] },
  { id: 'schiphol', label: 'Schiphol', point: [4.7634, 52.3105] },
];

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

function lineToPath(
  line: Point[],
  project: (point: Point) => { x: number; y: number },
): string {
  if (line.length === 0) return '';
  return line
    .map((point, index) => {
      const projected = project(point);
      return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
    })
    .join(' ');
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

    const referenceLines: ProjectedReferenceLine[] = REFERENCE_LINES.map(line => {
      const midpoint = line.points[Math.floor(line.points.length / 2)];
      return {
        id: line.id,
        label: line.label,
        kind: line.kind,
        path: lineToPath(line.points, project),
        labelPoint: project(midpoint),
      };
    });

    const referenceLandmarks: ProjectedReferenceLandmark[] = REFERENCE_LANDMARKS.map(landmark => {
      const point = project(landmark.point);
      return {
        id: landmark.id,
        label: landmark.label,
        x: point.x,
        y: point.y,
      };
    });

    return {
      features: projectedFeatures,
      zoneLabelPoints,
      referenceLines,
      referenceLandmarks,
    };
  }, [geometry.features]);

  return (
    <section className="relative">
      <div className="relative aspect-[16/10] min-h-[390px] overflow-hidden rounded-[2rem] border border-black/80 bg-[#f6f6f6] shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
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
            {mapData.referenceLines.map(line => {
              const stroke =
                line.kind === 'water'
                  ? 'rgba(0,0,0,0.35)'
                  : line.kind === 'canal'
                    ? 'rgba(0,0,0,0.3)'
                    : 'rgba(0,0,0,0.45)';
              const strokeWidth = line.kind === 'water' ? 1.6 : line.kind === 'canal' ? 1.05 : 1.25;
              const strokeDasharray = line.kind === 'road' ? '6 6' : undefined;
              return (
                <path
                  key={line.id}
                  d={line.path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
            {mapData.referenceLines
              .filter(line => line.kind !== 'canal')
              .map(line => (
                <text
                  key={`${line.id}-label`}
                  x={line.labelPoint.x + 6}
                  y={line.labelPoint.y - 4}
                  fontSize="9"
                  fill="rgba(0,0,0,0.6)"
                  letterSpacing="0.08em"
                >
                  {line.label.toUpperCase()}
                </text>
              ))}
            {mapData.referenceLandmarks.map(landmark => (
              <g key={landmark.id}>
                <circle
                  cx={landmark.x}
                  cy={landmark.y}
                  r={2.2}
                  fill="rgba(0,0,0,0.78)"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={0.8}
                />
                <text
                  x={landmark.x + 4}
                  y={landmark.y - 3}
                  fontSize="8.5"
                  fill="rgba(0,0,0,0.68)"
                  letterSpacing="0.05em"
                >
                  {landmark.label}
                </text>
              </g>
            ))}
          </g>
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
