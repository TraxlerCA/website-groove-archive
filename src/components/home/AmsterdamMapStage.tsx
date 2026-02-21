'use client';

import { useMemo, type KeyboardEvent } from 'react';
import roadsGeoJson from '@/data/amsterdam-roads.json';
import zoneGeoJson from '@/data/amsterdam-ggw-zones.json';
import { getContrastTextColor, type MapZoneConfig, type MapZoneId } from '@/components/home/mapZones';

type Point = [number, number];
type PolygonCoordinates = Point[][];
type MultiPolygonCoordinates = Point[][][];
type LineStringCoordinates = Point[];
type MultiLineStringCoordinates = Point[][];

type ZoneGeometry =
  | { type: 'Polygon'; coordinates: PolygonCoordinates }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonCoordinates };
type RoadGeometry =
  | { type: 'LineString'; coordinates: LineStringCoordinates }
  | { type: 'MultiLineString'; coordinates: MultiLineStringCoordinates };

type ZoneFeature = {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    zoneId: MapZoneId | null;
    active: boolean;
  };
  geometry: ZoneGeometry;
};

type ZoneCollection = {
  type: 'FeatureCollection';
  features: ZoneFeature[];
};

type RoadFeature = {
  type: 'Feature';
  geometry: RoadGeometry;
};

type RoadCollection = {
  type: 'FeatureCollection';
  features: RoadFeature[];
};

type ProjectedZoneFeature = {
  code: string;
  zoneId: MapZoneId | null;
  active: boolean;
  path: string;
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

type AmsterdamMapStageProps = {
  zones: MapZoneConfig[];
  activeZoneId: MapZoneId | null;
  hoveredZoneId: MapZoneId | null;
  onSelect: (zoneId: MapZoneId) => void;
  onHover: (zoneId: MapZoneId | null) => void;
  onClearSelection: () => void;
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 740;
const VIEWBOX_PADDING = 34;
const MAP_BACKGROUND = '#f8fafc';
const ROAD_STROKE = 'rgba(15,23,42,0.12)';
const IDLE_STROKE = 'rgba(255,255,255,0.76)';
const HOVER_STROKE = 'rgba(255,255,255,0.98)';
const DIMMED_STROKE = 'rgba(255,255,255,0.56)';

function forEachPolygonPoint(
  geometry: ZoneGeometry,
  callback: (point: Point) => void,
): void {
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => ring.forEach(callback));
    return;
  }
  geometry.coordinates.forEach(polygon => polygon.forEach(ring => ring.forEach(callback)));
}

function createBounds(): Bounds {
  return {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };
}

function expandBounds(bounds: Bounds, [x, y]: Point): void {
  if (x < bounds.minX) bounds.minX = x;
  if (x > bounds.maxX) bounds.maxX = x;
  if (y < bounds.minY) bounds.minY = y;
  if (y > bounds.maxY) bounds.maxY = y;
}

function getGeometryBounds(geometry: ZoneGeometry): Bounds {
  const bounds = createBounds();
  forEachPolygonPoint(geometry, point => {
    expandBounds(bounds, point);
  });
  return bounds;
}

function pointsMatch(a: Point, b: Point): boolean {
  return Math.abs(a[0] - b[0]) < 1e-12 && Math.abs(a[1] - b[1]) < 1e-12;
}

function normalizeRing(ring: Point[]): Point[] {
  if (ring.length < 2) return ring;
  if (pointsMatch(ring[0], ring[ring.length - 1])) {
    return ring.slice(0, -1);
  }
  return ring;
}

function getRingCentroidAndArea(ring: Point[]): { centroid: Point; area: number } | null {
  const normalized = normalizeRing(ring);
  if (normalized.length < 3) return null;

  let doubleArea = 0;
  let centroidXFactor = 0;
  let centroidYFactor = 0;

  for (let index = 0; index < normalized.length; index += 1) {
    const current = normalized[index];
    const next = normalized[(index + 1) % normalized.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    doubleArea += cross;
    centroidXFactor += (current[0] + next[0]) * cross;
    centroidYFactor += (current[1] + next[1]) * cross;
  }

  const signedArea = doubleArea * 0.5;
  if (Math.abs(signedArea) < 1e-12) return null;

  return {
    centroid: [
      centroidXFactor / (6 * signedArea),
      centroidYFactor / (6 * signedArea),
    ],
    area: Math.abs(signedArea),
  };
}

function getPolygonCentroidAndArea(rings: PolygonCoordinates): { centroid: Point; area: number } | null {
  let weightedX = 0;
  let weightedY = 0;
  let signedAreaSum = 0;

  rings.forEach((ring, index) => {
    const ringResult = getRingCentroidAndArea(ring);
    if (!ringResult) return;
    const ringWeight = index === 0 ? ringResult.area : -ringResult.area;
    weightedX += ringResult.centroid[0] * ringWeight;
    weightedY += ringResult.centroid[1] * ringWeight;
    signedAreaSum += ringWeight;
  });

  if (Math.abs(signedAreaSum) < 1e-12) return null;

  return {
    centroid: [weightedX / signedAreaSum, weightedY / signedAreaSum],
    area: Math.abs(signedAreaSum),
  };
}

function getGeometryCentroidAndArea(
  geometry: ZoneGeometry,
): { centroid: Point; area: number } | null {
  if (geometry.type === 'Polygon') {
    return getPolygonCentroidAndArea(geometry.coordinates);
  }

  let weightedX = 0;
  let weightedY = 0;
  let areaSum = 0;

  geometry.coordinates.forEach(polygon => {
    const polygonResult = getPolygonCentroidAndArea(polygon);
    if (!polygonResult) return;
    weightedX += polygonResult.centroid[0] * polygonResult.area;
    weightedY += polygonResult.centroid[1] * polygonResult.area;
    areaSum += polygonResult.area;
  });

  if (areaSum < 1e-12) return null;

  return {
    centroid: [weightedX / areaSum, weightedY / areaSum],
    area: areaSum,
  };
}

function ringToPath(
  ring: Point[],
  project: (point: Point) => { x: number; y: number },
  closePath: boolean,
): string {
  if (ring.length === 0) return '';
  const commands = ring
    .map((point, index) => {
      const projected = project(point);
      return `${index === 0 ? 'M' : 'L'} ${projected.x.toFixed(2)} ${projected.y.toFixed(2)}`;
    })
    .join(' ');
  return closePath ? `${commands} Z` : commands;
}

function polygonGeometryToPath(
  geometry: ZoneGeometry,
  project: (point: Point) => { x: number; y: number },
): string {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ringToPath(ring, project, true)).join(' ');
  }
  return geometry.coordinates
    .map(polygon => polygon.map(ring => ringToPath(ring, project, true)).join(' '))
    .join(' ');
}

function lineGeometryToPath(
  geometry: RoadGeometry,
  project: (point: Point) => { x: number; y: number },
): string {
  if (geometry.type === 'LineString') {
    return ringToPath(geometry.coordinates, project, false);
  }
  return geometry.coordinates.map(line => ringToPath(line, project, false)).join(' ');
}

function getMapLabelLines(value: string): string[] {
  const cleaned = value.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return ['Zone'];
  const words = cleaned.split(' ').filter(word => word !== '&' && word.toLowerCase() !== 'and');
  const limited = words.slice(0, 4);
  if (limited.length <= 2) return [limited.join(' ')];
  const midpoint = Math.ceil(limited.length / 2);
  return [limited.slice(0, midpoint).join(' '), limited.slice(midpoint).join(' ')];
}

function getHoverPillWidth(label: string): number {
  return Math.max(74, Math.min(260, label.length * 6.4 + 24));
}

export default function AmsterdamMapStage({
  zones,
  activeZoneId,
  hoveredZoneId,
  onSelect,
  onHover,
  onClearSelection,
}: AmsterdamMapStageProps) {
  const zoneCollection = zoneGeoJson as ZoneCollection;
  const roadCollection = roadsGeoJson as RoadCollection;

  const zonesById = useMemo(
    () =>
      zones.reduce<Record<MapZoneId, MapZoneConfig>>((acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      }, {} as Record<MapZoneId, MapZoneConfig>),
    [zones],
  );

  const mapData = useMemo(() => {
    const bounds = createBounds();

    const visibleZoneFeatures = zoneCollection.features.filter(
      feature => feature.properties.active && feature.properties.zoneId,
    );
    const boundsSource = visibleZoneFeatures.length > 0 ? visibleZoneFeatures : zoneCollection.features;

    boundsSource.forEach(feature => {
      forEachPolygonPoint(feature.geometry, point => {
        expandBounds(bounds, point);
      });
    });

    const spanX = Math.max(0.000001, bounds.maxX - bounds.minX);
    const spanY = Math.max(0.000001, bounds.maxY - bounds.minY);
    const usableWidth = VIEWBOX_WIDTH - VIEWBOX_PADDING * 2;
    const usableHeight = VIEWBOX_HEIGHT - VIEWBOX_PADDING * 2;

    const project = ([x, y]: Point) => ({
      x: ((x - bounds.minX) / spanX) * usableWidth + VIEWBOX_PADDING,
      y: ((bounds.maxY - y) / spanY) * usableHeight + VIEWBOX_PADDING,
    });

    const zoneCentroidAccumulators = new Map<MapZoneId, { weightedX: number; weightedY: number; area: number }>();
    const zoneFallbackCenters = new Map<MapZoneId, Point[]>();

    const zoneFeatures: ProjectedZoneFeature[] = zoneCollection.features.map(feature => {
      const path = polygonGeometryToPath(feature.geometry, project);

      if (feature.properties.active && feature.properties.zoneId) {
        const zoneId = feature.properties.zoneId;
        const centroidResult = getGeometryCentroidAndArea(feature.geometry);
        if (centroidResult && centroidResult.area > 1e-12) {
          const existing = zoneCentroidAccumulators.get(zoneId) ?? {
            weightedX: 0,
            weightedY: 0,
            area: 0,
          };
          zoneCentroidAccumulators.set(zoneId, {
            weightedX: existing.weightedX + centroidResult.centroid[0] * centroidResult.area,
            weightedY: existing.weightedY + centroidResult.centroid[1] * centroidResult.area,
            area: existing.area + centroidResult.area,
          });
        } else {
          const featureBounds = getGeometryBounds(feature.geometry);
          const fallbackCenter: Point = [
            (featureBounds.minX + featureBounds.maxX) / 2,
            (featureBounds.minY + featureBounds.maxY) / 2,
          ];
          const existingFallbacks = zoneFallbackCenters.get(zoneId) ?? [];
          zoneFallbackCenters.set(zoneId, [...existingFallbacks, fallbackCenter]);
        }
      }

      return {
        code: feature.properties.code,
        zoneId: feature.properties.zoneId,
        active: feature.properties.active,
        path,
      };
    });

    const zoneLabelPoints: Partial<Record<MapZoneId, { x: number; y: number }>> = {};
    zoneCentroidAccumulators.forEach((accumulator, zoneId) => {
      if (accumulator.area <= 1e-12) return;
      const projected = project([
        accumulator.weightedX / accumulator.area,
        accumulator.weightedY / accumulator.area,
      ]);
      zoneLabelPoints[zoneId] = projected;
    });

    zoneFallbackCenters.forEach((centers, zoneId) => {
      if (zoneLabelPoints[zoneId] || centers.length === 0) return;
      const averageCenter = centers.reduce<Point>(
        (acc, center) => [acc[0] + center[0], acc[1] + center[1]],
        [0, 0],
      );
      const projected = project([
        averageCenter[0] / centers.length,
        averageCenter[1] / centers.length,
      ]);
      zoneLabelPoints[zoneId] = projected;
    });

    const roadPaths = roadCollection.features
      .map(feature => lineGeometryToPath(feature.geometry, project))
      .filter(Boolean);

    const zoneFootprintPaths = zoneFeatures
      .filter(feature => feature.active && feature.zoneId)
      .map(feature => feature.path);

    return {
      zoneFeatures,
      zoneLabelPoints,
      roadPaths,
      zoneFootprintPaths,
    };
  }, [roadCollection.features, zoneCollection.features]);

  const activeZone = activeZoneId ? zonesById[activeZoneId] : null;
  const hasActiveSelection = Boolean(activeZoneId);
  const visibleLabelZoneId = hoveredZoneId;
  const handleZoneKeyDown = (event: KeyboardEvent<SVGPathElement>, zoneId: MapZoneId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(zoneId);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onHover(null);
      onClearSelection();
    }
  };

  return (
    <section className="relative h-full">
      <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-neutral-200/90 bg-[#f8fafc] shadow-[0_16px_40px_rgba(15,23,42,0.14)] sm:rounded-[2rem]">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          aria-label="Amsterdam map with interactive music zones"
          role="img"
          onClick={event => {
            const target = event.target as HTMLElement;
            if (target.dataset.zoneFill === 'true') return;
            onHover(null);
            onClearSelection();
          }}
          onMouseLeave={() => onHover(null)}
          onMouseMove={event => {
            const target = event.target as Element;
            if (target.tagName.toLowerCase() === 'svg') onHover(null);
          }}
        >
          <defs>
            <clipPath id="zone-footprint-clip" clipPathUnits="userSpaceOnUse">
              {mapData.zoneFootprintPaths.map((path, index) => (
                <path key={`zone-footprint-${index}`} d={path} />
              ))}
            </clipPath>
          </defs>

          <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill={MAP_BACKGROUND} />

          <g aria-hidden="true" clipPath="url(#zone-footprint-clip)">
            {mapData.roadPaths.map((path, index) => (
              <path
                key={`road-${index}`}
                d={path}
                fill="none"
                stroke={ROAD_STROKE}
                strokeWidth={0.5}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>

          <g>
            {mapData.zoneFeatures.map(feature => {
              const zoneId = feature.zoneId;
              if (!feature.active || !zoneId) return null;
              const zone = zonesById[zoneId];
              if (!zone) return null;
              const fill = zone.accent;

              return (
                <g key={`${feature.code}-interactive`}>
                  <path
                    d={feature.path}
                    aria-hidden="true"
                    onClick={() => onSelect(zoneId)}
                    onMouseEnter={() => onHover(zoneId)}
                    className="cursor-pointer"
                    fill="none"
                    stroke="rgba(0,0,0,0.001)"
                    strokeWidth={10}
                    vectorEffect="non-scaling-stroke"
                    style={{ pointerEvents: 'stroke' }}
                  />
                  <path
                    key={`${feature.code}-fill`}
                    data-zone-fill="true"
                    d={feature.path}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${zone.displayName} zone`}
                    onClick={() => onSelect(zoneId)}
                    onMouseEnter={() => onHover(zoneId)}
                    onFocus={() => onHover(zoneId)}
                    onBlur={() => onHover(null)}
                    onKeyDown={event => handleZoneKeyDown(event, zoneId)}
                    className="cursor-pointer transition focus-visible:outline-none"
                    fill={fill}
                  />
                </g>
              );
            })}
          </g>

          <g aria-hidden="true" className="pointer-events-none">
            {mapData.zoneFeatures.map(feature => {
              if (!feature.active || !feature.zoneId) return null;
              const zone = zonesById[feature.zoneId];
              if (!zone) return null;

              const isActive = feature.zoneId === activeZoneId;
              const isHovered = feature.zoneId === hoveredZoneId;
              const stroke = isActive
                ? HOVER_STROKE
                : hasActiveSelection
                  ? DIMMED_STROKE
                  : isHovered
                    ? HOVER_STROKE
                    : IDLE_STROKE;

              return (
                <path
                  key={`${feature.code}-boundary`}
                  d={feature.path}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isActive ? 1.55 : isHovered && !hasActiveSelection ? 1.25 : 1}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>

          <g aria-hidden="true" className="pointer-events-none">
            {zones.map(zone => {
              if (visibleLabelZoneId && zone.id !== visibleLabelZoneId) return null;
              const point = mapData.zoneLabelPoints[zone.id];
              if (!point) return null;
              const labelLines = getMapLabelLines(zone.genreLabel);
              const lineHeight = 16.5;
              const firstLineY = point.y - (lineHeight * (labelLines.length - 1)) / 2;
              return (
                <text
                  key={`${zone.id}-label`}
                  x={point.x}
                  y={point.y}
                  textAnchor="middle"
                  className="map-zone-label"
                >
                  {labelLines.map((line, index) => (
                    <tspan
                      key={`${zone.id}-label-line-${index}`}
                      x={point.x}
                      y={firstLineY + index * lineHeight}
                    >
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}
          </g>

          {hoveredZoneId ? (
            (() => {
              const point = mapData.zoneLabelPoints[hoveredZoneId];
              const zone = zonesById[hoveredZoneId];
              if (!point || !zone) return null;
              const pillWidth = getHoverPillWidth(zone.genreLabel);
              const pillHeight = 22;
              const pillRadius = 11;
              return (
                <g
                  data-hover-pill="true"
                  aria-hidden="true"
                  className="pointer-events-none sm:hidden"
                >
                  <rect
                    x={point.x - pillWidth / 2}
                    y={point.y - pillHeight / 2}
                    width={pillWidth}
                    height={pillHeight}
                    rx={pillRadius}
                    ry={pillRadius}
                    fill={zone.accent}
                    stroke="rgba(255,255,255,0.58)"
                    strokeWidth={0.8}
                  />
                  <text
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={8}
                    letterSpacing="0.02em"
                    fill={getContrastTextColor(zone.accent)}
                    fontWeight={600}
                  >
                    {zone.genreLabel}
                  </text>
                </g>
              );
            })()
          ) : null}

          {activeZoneId && activeZone ? (
            <g aria-hidden="true" className="pointer-events-none">
              {mapData.zoneFeatures
                .filter(feature => feature.active && feature.zoneId === activeZoneId)
                .map(feature => (
                  <path
                    key={`${feature.code}-pulse`}
                    d={feature.path}
                    className="map-zone-pulse"
                    fill="none"
                    stroke={activeZone.accent}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
            </g>
          ) : null}
        </svg>

      </div>

      <style jsx>{`
        .map-zone-pulse {
          animation: map-zone-pulse 2.2s ease-out infinite;
        }
        .map-zone-label {
          font-family: var(--font-urbanist), ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
            'Segoe UI', sans-serif;
          font-size: 15.8px;
          letter-spacing: 0.012em;
          fill: rgba(255, 255, 255, 0.97);
          font-weight: 650;
          text-rendering: geometricPrecision;
          filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
        }
        @media (max-width: 420px) {
          .map-zone-label {
            font-size: 16.8px;
          }
        }
        @keyframes map-zone-pulse {
          0% {
            opacity: 0.8;
            stroke-width: 1.5;
          }
          100% {
            opacity: 0;
            stroke-width: 5;
          }
        }
      `}</style>
    </section>
  );
}
