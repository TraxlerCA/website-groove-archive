'use client';

import { useId, useMemo } from 'react';
import geojson from '@/data/amsterdam-ggw-zones.json';
import {
  CONTEXT_LANDMARKS,
  CONTEXT_ROAD_LINES,
  CONTEXT_WATER_LINES,
} from '@/components/home/mapContext';
import type { MapZoneConfig, MapZoneId } from '@/components/home/mapZones';
import type { MapVisualVariant } from '@/components/home/mapVisualVariants';

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

type ProjectedLine = {
  id: string;
  family: string;
  label?: string;
  path: string;
};

type ProjectedLandmark = {
  id: string;
  name: string;
  x: number;
  y: number;
};

type AmsterdamMapStageProps = {
  zones: MapZoneConfig[];
  activeZoneId: MapZoneId | null;
  hoveredZoneId: MapZoneId | null;
  onSelect: (zoneId: MapZoneId) => void;
  onHover: (zoneId: MapZoneId | null) => void;
  onClearSelection: () => void;
  variant?: MapVisualVariant;
};

const VIEWBOX_WIDTH = 1000;
const VIEWBOX_HEIGHT = 740;
const VIEWBOX_PADDING = 34;
const HEATMAP_HOT = '#FF9D2E';

type MapVariantTheme = {
  baseBackground: string;
  frameBorder: string;
  shadow: string;
  surfaceGradient: string;
  gridStroke: string;
  gridOpacity: number;
  inactiveFill: string;
  randomIdleFill: string;
  randomIdleShadow: string;
  randomActiveShadow: string;
  boundaryStroke: string;
  randomBoundaryStroke: string;
  highlightStroke: string;
  visibleWaterFamilies: string[];
  waterLineStroke: string;
  waterLineWidth: number;
  waterLineOpacity: number;
  roadStroke: string;
  roadWidth: number;
  roadOpacity: number;
  roadDashArray: string;
  showLandmarks: boolean;
  showLandmarkLabels: boolean;
  landmarkDotFill: string;
  landmarkDotStroke: string;
  landmarkLabelColor: string;
  landmarkLabelHalo: string;
};

const BASE_THEME: Omit<
  MapVariantTheme,
  'visibleWaterFamilies' | 'showLandmarks' | 'showLandmarkLabels'
> = {
  baseBackground: '#f6f6f6',
  frameBorder: 'rgba(0,0,0,0.8)',
  shadow: '0 20px 50px rgba(0,0,0,0.18)',
  surfaceGradient: 'linear-gradient(175deg,#fafafa 0%,#f2f2f2 100%)',
  gridStroke: 'rgba(0,0,0,0.06)',
  gridOpacity: 0.35,
  inactiveFill: 'rgba(22,22,22,0.2)',
  randomIdleFill: 'rgba(22,22,22,0.28)',
  randomIdleShadow: 'drop-shadow(0 0 9px rgba(0,0,0,0.28))',
  randomActiveShadow: 'drop-shadow(0 0 16px rgba(255,157,46,0.52))',
  boundaryStroke: 'rgba(0,0,0,0.82)',
  randomBoundaryStroke: 'rgba(0,0,0,0.9)',
  highlightStroke: HEATMAP_HOT,
  waterLineStroke: '#4d7897',
  waterLineWidth: 1.7,
  waterLineOpacity: 0.64,
  roadStroke: '#3e4656',
  roadWidth: 2.1,
  roadOpacity: 0.48,
  roadDashArray: '10 7',
  landmarkDotFill: '#111111',
  landmarkDotStroke: '#ffffff',
  landmarkLabelColor: '#1f2937',
  landmarkLabelHalo: 'rgba(255,255,255,0.9)',
};

const MAP_VARIANT_THEMES: Record<MapVisualVariant, MapVariantTheme> = {
  civic_context: {
    ...BASE_THEME,
    visibleWaterFamilies: ['ij', 'amstel'],
    showLandmarks: false,
    showLandmarkLabels: false,
  },
  transit_glow: {
    ...BASE_THEME,
    visibleWaterFamilies: ['ij', 'amstel', 'singel', 'herengracht', 'keizersgracht', 'prinsengracht'],
    showLandmarks: false,
    showLandmarkLabels: false,
  },
  landmark_postcard: {
    ...BASE_THEME,
    visibleWaterFamilies: ['ij', 'amstel', 'singel', 'herengracht', 'keizersgracht', 'prinsengracht'],
    showLandmarks: true,
    showLandmarkLabels: true,
  },
};

const LANDMARK_LABEL_OFFSETS: Record<string, { dx: number; dy: number }> = {
  centraal: { dx: 7, dy: -7 },
  dam: { dx: 7, dy: 12 },
  rijksmuseum: { dx: 8, dy: 11 },
  vondelpark: { dx: -9, dy: 11 },
  ndsm: { dx: 7, dy: -9 },
  arena: { dx: 7, dy: -8 },
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

function familyFromLineId(id: string): string {
  return id.replace(/_\d+$/, '');
}

export default function AmsterdamMapStage({
  zones,
  activeZoneId,
  hoveredZoneId,
  onSelect,
  onHover,
  onClearSelection,
  variant = 'civic_context',
}: AmsterdamMapStageProps) {
  const geometry = geojson as GeoCollection;
  const theme = MAP_VARIANT_THEMES[variant];
  const patternSeed = useId();
  const gridPatternId = useMemo(
    () => `paper-grid-${variant}-${patternSeed.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    [patternSeed, variant],
  );
  const zonesById = useMemo(
    () =>
      zones.reduce<Record<MapZoneId, MapZoneConfig>>((acc, zone) => {
        acc[zone.id] = zone;
        return acc;
      }, {} as Record<MapZoneId, MapZoneConfig>),
    [zones],
  );
  const visibleWaterFamilySet = useMemo(
    () => new Set(theme.visibleWaterFamilies),
    [theme.visibleWaterFamilies],
  );

  const mapData = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const visibleFeatures = geometry.features.filter(
      feature => feature.properties.active && feature.properties.zoneId,
    );
    const boundsSource = visibleFeatures.length > 0 ? visibleFeatures : geometry.features;

    boundsSource.forEach(feature => {
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

    const projectedWaterLines: ProjectedLine[] = CONTEXT_WATER_LINES.map(line => ({
      id: line.id,
      family: familyFromLineId(line.id),
      label: line.label,
      path: lineToPath(line.points, project),
    }));

    const projectedRoadLines: ProjectedLine[] = CONTEXT_ROAD_LINES.map(line => ({
      id: line.id,
      family: familyFromLineId(line.id),
      label: line.label,
      path: lineToPath(line.points, project),
    }));

    const projectedLandmarks: ProjectedLandmark[] = CONTEXT_LANDMARKS.map(landmark => {
      const projected = project(landmark.point);
      return {
        id: landmark.id,
        name: landmark.name,
        x: projected.x,
        y: projected.y,
      };
    });

    return {
      features: projectedFeatures,
      zoneLabelPoints,
      waterLines: projectedWaterLines,
      roadLines: projectedRoadLines,
      landmarks: projectedLandmarks,
    };
  }, [geometry.features]);

  return (
    <section className="relative h-full">
      <div
        className="relative h-full overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]"
        style={{
          border: `1px solid ${theme.frameBorder}`,
          backgroundColor: theme.baseBackground,
          boxShadow: theme.shadow,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: theme.surfaceGradient }}
        />
        <div className="pointer-events-none absolute inset-0" style={{ opacity: theme.gridOpacity }}>
          <svg viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} className="h-full w-full" aria-hidden="true">
            <defs>
              <pattern id={gridPatternId} width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 0 15 L 30 15 M 15 0 L 15 30" stroke={theme.gridStroke} strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill={`url(#${gridPatternId})`} />
          </svg>
        </div>

        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="absolute inset-0 h-full w-full"
          aria-label={`Amsterdam map with interactive music zones (${variant})`}
          role="img"
          onClick={event => {
            const target = event.target as Element;
            if (target.tagName.toLowerCase() !== 'svg') return;
            onHover(null);
            onClearSelection();
          }}
          onMouseLeave={event => {
            const related = event.relatedTarget as HTMLElement | null;
            if (related?.dataset?.hoverPill === 'true') return;
            onHover(null);
          }}
          onMouseMove={event => {
            const target = event.target as Element;
            if (target.tagName.toLowerCase() === 'svg') onHover(null);
          }}
        >
          <g aria-hidden="true" className="pointer-events-none">
            {mapData.waterLines
              .filter(line => visibleWaterFamilySet.has(line.family))
              .map(line => (
                <path
                  key={`${line.id}-water-line`}
                  d={line.path}
                  fill="none"
                  stroke={theme.waterLineStroke}
                  strokeOpacity={theme.waterLineOpacity}
                  strokeWidth={theme.waterLineWidth}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
          </g>
          <g aria-hidden="true" className="pointer-events-none">
            {mapData.roadLines.map(line => (
              <path
                key={`${line.id}-road-line`}
                d={line.path}
                fill="none"
                stroke={theme.roadStroke}
                strokeOpacity={theme.roadOpacity}
                strokeWidth={theme.roadWidth}
                strokeDasharray={theme.roadDashArray}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </g>
          {theme.showLandmarks ? (
            <g aria-hidden="true" className="pointer-events-none">
              {mapData.landmarks.map(landmark => {
                const offset = LANDMARK_LABEL_OFFSETS[landmark.id] || { dx: 7, dy: -7 };
                return (
                  <g key={`${landmark.id}-landmark`}>
                    <circle
                      cx={landmark.x}
                      cy={landmark.y}
                      r={4}
                      fill={theme.landmarkDotFill}
                      stroke={theme.landmarkDotStroke}
                      strokeWidth={1.4}
                    />
                    {theme.showLandmarkLabels ? (
                      <text
                        x={landmark.x + offset.dx}
                        y={landmark.y + offset.dy}
                        fontSize={12}
                        fontWeight={700}
                        fill={theme.landmarkLabelColor}
                        stroke={theme.landmarkLabelHalo}
                        strokeWidth={3}
                        paintOrder="stroke"
                      >
                        {landmark.name}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          ) : null}
          <g>
            {mapData.features.map(feature => {
              const zoneId = feature.zoneId;
              if (!feature.active || !zoneId) return null;
              const zone = zoneId ? zonesById[zoneId] : null;
              const interactive = feature.active && Boolean(zone);
              const active = interactive && zoneId === activeZoneId;
              const isRandomZone = zoneId === 'amstel_rush';
              const fill = active ? HEATMAP_HOT : isRandomZone ? theme.randomIdleFill : theme.inactiveFill;
              return (
                <path
                  key={`${feature.code}-fill`}
                  d={feature.path}
                  onClick={interactive && zoneId ? () => onSelect(zoneId) : undefined}
                  onMouseEnter={interactive ? () => onHover(zoneId) : undefined}
                  className={interactive ? 'cursor-pointer transition' : 'cursor-default transition'}
                  fill={fill}
                  style={
                    isRandomZone
                      ? {
                          filter: active ? theme.randomActiveShadow : theme.randomIdleShadow,
                        }
                      : undefined
                  }
                />
              );
            })}
          </g>
          {activeZoneId ? (
            <g aria-hidden="true" className="pointer-events-none">
              {mapData.features
                .filter(feature => feature.active && feature.zoneId === activeZoneId)
                .map(feature => {
                  if (!feature.zoneId) return null;
                  return (
                    <path
                      key={`${feature.code}-highlight`}
                      d={feature.path}
                      fill="none"
                      stroke={theme.highlightStroke}
                      strokeWidth={2.4}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      opacity={0.88}
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
              const isRandomZone = feature.zoneId === 'amstel_rush';
              return (
                <path
                  key={`${feature.code}-boundary`}
                  d={feature.path}
                  fill="none"
                  stroke={isRandomZone && !active ? theme.randomBoundaryStroke : theme.boundaryStroke}
                  strokeWidth={active ? 1.35 : 1.2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0">
          {hoveredZoneId ? (
            (() => {
              const point = mapData.zoneLabelPoints[hoveredZoneId];
              const zone = zonesById[hoveredZoneId];
              if (!point || !zone) return null;
              return (
                <button
                  data-hover-pill="true"
                  type="button"
                  onClick={() => onSelect(hoveredZoneId)}
                  onMouseEnter={() => onHover(hoveredZoneId)}
                  onMouseLeave={() => onHover(null)}
                  className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/70 px-3 py-1 text-[0.68rem] font-semibold tracking-[0.02em] text-neutral-900 shadow-[0_10px_20px_rgba(0,0,0,0.22)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black/20"
                  style={{
                    left: `${(point.x / VIEWBOX_WIDTH) * 100}%`,
                    top: `${(point.y / VIEWBOX_HEIGHT) * 100}%`,
                    backgroundColor: zone.accent,
                  }}
                >
                  {zone.genreLabel}
                </button>
              );
            })()
          ) : null}
        </div>
      </div>
    </section>
  );
}
