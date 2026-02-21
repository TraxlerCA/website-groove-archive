'use client';

import { useMemo } from 'react';
import roadsGeoJson from '@/data/amsterdam-roads.json';
import waterwaysGeoJson from '@/data/amsterdam-waterways.json';
import zoneGeoJson from '@/data/amsterdam-ggw-zones.json';
import type { MapZoneConfig, MapZoneId } from '@/components/home/mapZones';

type Point = [number, number];
type PolygonCoordinates = Point[][];
type MultiPolygonCoordinates = Point[][][];
type LineStringCoordinates = Point[];
type MultiLineStringCoordinates = Point[][];

type ZoneGeometry =
  | { type: 'Polygon'; coordinates: PolygonCoordinates }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonCoordinates };
type WaterGeometry = ZoneGeometry;
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

type WaterFeature = {
  type: 'Feature';
  geometry: WaterGeometry;
};

type WaterCollection = {
  type: 'FeatureCollection';
  features: WaterFeature[];
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
const MAP_BACKGROUND = '#080d1a';
const WATER_FILL = 'rgba(10,40,80,0.55)';
const ROAD_STROKE = 'rgba(255,255,255,0.08)';
const IDLE_STROKE = 'rgba(255,255,255,0.18)';
const HOVER_STROKE = 'rgba(255,255,255,0.35)';
const DIMMED_STROKE = 'rgba(255,255,255,0.08)';

function toRgba(hex: string, alpha: number): string {
  const sanitized = hex.trim().replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map(char => `${char}${char}`)
          .join('')
      : sanitized;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(255,255,255,${alpha})`;
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function forEachPolygonPoint(
  geometry: ZoneGeometry | WaterGeometry,
  callback: (point: Point) => void,
): void {
  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring => ring.forEach(callback));
    return;
  }
  geometry.coordinates.forEach(polygon => polygon.forEach(ring => ring.forEach(callback)));
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
  geometry: ZoneGeometry | WaterGeometry,
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

function getMapLabel(value: string): string {
  const cleaned = value.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Zone';
  const words = cleaned.split(' ').filter(word => word !== '&' && word.toLowerCase() !== 'and');
  return words.slice(0, 3).join(' ');
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
  const waterCollection = waterwaysGeoJson as WaterCollection;
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
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const visibleZoneFeatures = zoneCollection.features.filter(
      feature => feature.properties.active && feature.properties.zoneId,
    );
    const boundsSource = visibleZoneFeatures.length > 0 ? visibleZoneFeatures : zoneCollection.features;

    boundsSource.forEach(feature => {
      forEachPolygonPoint(feature.geometry, ([x, y]) => {
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

    const labelBoundsByZone = new Map<MapZoneId, { minX: number; minY: number; maxX: number; maxY: number }>();

    const zoneFeatures: ProjectedZoneFeature[] = zoneCollection.features.map(feature => {
      const path = polygonGeometryToPath(feature.geometry, project);

      if (feature.properties.active && feature.properties.zoneId) {
        const zoneId = feature.properties.zoneId;
        forEachPolygonPoint(feature.geometry, point => {
          const projected = project(point);
          const existing = labelBoundsByZone.get(zoneId);
          if (!existing) {
            labelBoundsByZone.set(zoneId, {
              minX: projected.x,
              minY: projected.y,
              maxX: projected.x,
              maxY: projected.y,
            });
            return;
          }
          if (projected.x < existing.minX) existing.minX = projected.x;
          if (projected.y < existing.minY) existing.minY = projected.y;
          if (projected.x > existing.maxX) existing.maxX = projected.x;
          if (projected.y > existing.maxY) existing.maxY = projected.y;
        });
      }

      return {
        code: feature.properties.code,
        zoneId: feature.properties.zoneId,
        active: feature.properties.active,
        path,
      };
    });

    const zoneLabelPoints: Partial<Record<MapZoneId, { x: number; y: number }>> = {};
    labelBoundsByZone.forEach((bounds, zoneId) => {
      zoneLabelPoints[zoneId] = {
        x: (bounds.minX + bounds.maxX) / 2,
        y: (bounds.minY + bounds.maxY) / 2,
      };
    });

    const waterPaths = waterCollection.features
      .map(feature => polygonGeometryToPath(feature.geometry, project))
      .filter(Boolean);

    const roadPaths = roadCollection.features
      .map(feature => lineGeometryToPath(feature.geometry, project))
      .filter(Boolean);

    return {
      zoneFeatures,
      zoneLabelPoints,
      waterPaths,
      roadPaths,
    };
  }, [roadCollection.features, waterCollection.features, zoneCollection.features]);

  const activeZone = activeZoneId ? zonesById[activeZoneId] : null;
  const hasActiveSelection = Boolean(activeZoneId);
  const showLabels = hoveredZoneId === null;

  return (
    <section className="relative h-full">
      <div className="relative h-full overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#050a16] shadow-[0_24px_56px_rgba(3,8,24,0.52)] sm:rounded-[2rem]">
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
          <defs>
            <radialGradient id="map-vignette" cx="50%" cy="50%" r="72%">
              <stop offset="58%" stopColor="rgba(4,8,20,0)" />
              <stop offset="100%" stopColor="rgba(4,8,20,0.76)" />
            </radialGradient>
            <filter id="amstel-shimmer" x="-20%" y="-20%" width="140%" height="140%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015"
                numOctaves="2"
                seed="2"
                result="noise"
              >
                <animate
                  attributeName="baseFrequency"
                  values="0.013;0.018;0.013"
                  dur="20s"
                  repeatCount="indefinite"
                />
              </feTurbulence>
              <feColorMatrix
                in="noise"
                type="matrix"
                values="
                  0 0 0 0 0.34
                  0 0 0 0 0.66
                  0 0 0 0 1
                  0 0 0 0.2 0
                "
                result="shimmer-tint"
              />
              <feBlend in="SourceGraphic" in2="shimmer-tint" mode="screen" />
            </filter>
          </defs>

          <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill={MAP_BACKGROUND} />

          <g aria-hidden="true">
            {mapData.waterPaths.map((path, index) => (
              <path key={`water-${index}`} d={path} fill={WATER_FILL} stroke="none" />
            ))}
          </g>

          <g aria-hidden="true">
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
              const isActive = zoneId === activeZoneId;
              const isHovered = zoneId === hoveredZoneId;
              const isIdle = !hasActiveSelection && !isHovered;
              const fill = isActive
                ? toRgba(zone.accent, 0.85)
                : hasActiveSelection
                  ? toRgba(zone.accent, 0.06)
                  : isHovered
                    ? toRgba(zone.accent, 0.35)
                    : toRgba(zone.accent, 0.12);
              const isShimmerZone = zoneId === 'amstel_rush' && isIdle;

              return (
                <path
                  key={`${feature.code}-fill`}
                  data-zone-fill="true"
                  d={feature.path}
                  onClick={() => onSelect(zoneId)}
                  onMouseEnter={() => onHover(zoneId)}
                  className="cursor-pointer transition"
                  fill={fill}
                  style={isShimmerZone ? { filter: 'url(#amstel-shimmer)' } : undefined}
                />
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
                ? zone.accent
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

          {showLabels ? (
            <g aria-hidden="true" className="pointer-events-none">
              {zones.map(zone => {
                const point = mapData.zoneLabelPoints[zone.id];
                if (!point) return null;
                return (
                  <text
                    key={`${zone.id}-label`}
                    x={point.x}
                    y={point.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={7.25}
                    letterSpacing="0.05em"
                    fill="rgba(255,255,255,0.55)"
                  >
                    {getMapLabel(zone.genreLabel)}
                  </text>
                );
              })}
            </g>
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

          <rect
            aria-hidden="true"
            className="pointer-events-none"
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            fill="url(#map-vignette)"
          />
        </svg>

        <div className="pointer-events-none absolute inset-0">
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
                    className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/60 px-3 py-1 text-[0.66rem] font-semibold tracking-[0.03em] text-[#030712] shadow-[0_10px_20px_rgba(0,0,0,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/45"
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
      </div>

      <style jsx>{`
        .map-zone-pulse {
          animation: map-zone-pulse 2.2s ease-out infinite;
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
