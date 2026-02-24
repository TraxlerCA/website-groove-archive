import {
  normalizeMapZoneId,
  type MapZoneId,
} from '@/components/home/mapZones';

export type Point = [number, number];
export type PolygonCoordinates = Point[][];
export type MultiPolygonCoordinates = Point[][][];
export type LineStringCoordinates = Point[];
export type MultiLineStringCoordinates = Point[][];

export type ZoneGeometry =
  | { type: 'Polygon'; coordinates: PolygonCoordinates }
  | { type: 'MultiPolygon'; coordinates: MultiPolygonCoordinates };

export type RoadGeometry =
  | { type: 'LineString'; coordinates: LineStringCoordinates }
  | { type: 'MultiLineString'; coordinates: MultiLineStringCoordinates };

export type ZoneFeature = {
  type: 'Feature';
  properties: {
    code: string;
    name: string;
    zoneId: string | null;
    active: boolean;
  };
  geometry: ZoneGeometry;
};

export type ZoneCollection = {
  type: 'FeatureCollection';
  features: ZoneFeature[];
};

export type RoadFeature = {
  type: 'Feature';
  geometry: RoadGeometry;
};

export type RoadCollection = {
  type: 'FeatureCollection';
  features: RoadFeature[];
};

export type ProjectedZoneFeature = {
  code: string;
  zoneId: MapZoneId | null;
  active: boolean;
  path: string;
};

export type MapData = {
  zoneFeatures: ProjectedZoneFeature[];
  zoneLabelPoints: Partial<Record<MapZoneId, { x: number; y: number }>>;
  roadPaths: string[];
  zoneFootprintPaths: string[];
};

type Bounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export const MAP_VIEWBOX_WIDTH = 1000;
export const MAP_VIEWBOX_HEIGHT = 740;
const VIEWBOX_PADDING = 34;

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
    centroid: [centroidXFactor / (6 * signedArea), centroidYFactor / (6 * signedArea)],
    area: Math.abs(signedArea),
  };
}

function getPolygonCentroidAndArea(
  rings: PolygonCoordinates,
): { centroid: Point; area: number } | null {
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

export function buildMapData(
  zoneFeaturesInput: ZoneFeature[],
  roadFeaturesInput: RoadFeature[],
): MapData {
  const bounds = createBounds();

  const visibleZoneFeatures = zoneFeaturesInput.filter(
    feature => feature.properties.active && normalizeMapZoneId(feature.properties.zoneId),
  );
  const boundsSource =
    visibleZoneFeatures.length > 0 ? visibleZoneFeatures : zoneFeaturesInput;

  boundsSource.forEach(feature => {
    forEachPolygonPoint(feature.geometry, point => {
      expandBounds(bounds, point);
    });
  });

  const spanX = Math.max(0.000001, bounds.maxX - bounds.minX);
  const spanY = Math.max(0.000001, bounds.maxY - bounds.minY);
  const usableWidth = MAP_VIEWBOX_WIDTH - VIEWBOX_PADDING * 2;
  const usableHeight = MAP_VIEWBOX_HEIGHT - VIEWBOX_PADDING * 2;

  const project = ([x, y]: Point) => ({
    x: ((x - bounds.minX) / spanX) * usableWidth + VIEWBOX_PADDING,
    y: ((bounds.maxY - y) / spanY) * usableHeight + VIEWBOX_PADDING,
  });

  const zoneCentroidAccumulators = new Map<
    MapZoneId,
    { weightedX: number; weightedY: number; area: number }
  >();
  const zoneFallbackCenters = new Map<MapZoneId, Point[]>();

  const zoneFeatures: ProjectedZoneFeature[] = zoneFeaturesInput.map(feature => {
    const path = polygonGeometryToPath(feature.geometry, project);
    const zoneId = normalizeMapZoneId(feature.properties.zoneId);

    if (feature.properties.active && zoneId) {
      const centroidResult = getGeometryCentroidAndArea(feature.geometry);
      if (centroidResult && centroidResult.area > 1e-12) {
        const existing = zoneCentroidAccumulators.get(zoneId) ?? {
          weightedX: 0,
          weightedY: 0,
          area: 0,
        };
        zoneCentroidAccumulators.set(zoneId, {
          weightedX:
            existing.weightedX + centroidResult.centroid[0] * centroidResult.area,
          weightedY:
            existing.weightedY + centroidResult.centroid[1] * centroidResult.area,
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
      zoneId,
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

  const roadPaths = roadFeaturesInput
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
}
