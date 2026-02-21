#!/usr/bin/env node

/**
 * Bakes Amsterdam waterway and major road geometry into static GeoJSON files.
 * Usage: node scripts/fetch-geo-data.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '../src/data');

const BBOX = {
  minLng: 4.72,
  maxLng: 5.08,
  minLat: 52.28,
  maxLat: 52.47,
};
const MIN_ROAD_LENGTH_DEGREES = 0.0038;

const WATERWAYS_URL =
  'https://api.data.amsterdam.nl/v1/water/binnenwater?_format=geojson&_pageSize=10000';
const OVERPASS_URLS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function roundCoord(value) {
  return Number(value.toFixed(5));
}

function roundPoint([lng, lat]) {
  return [roundCoord(lng), roundCoord(lat)];
}

function pointsEqual(a, b) {
  return Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9;
}

function dedupeConsecutivePoints(points) {
  const deduped = [];
  for (const point of points) {
    if (deduped.length === 0 || !pointsEqual(deduped[deduped.length - 1], point)) {
      deduped.push(point);
    }
  }
  return deduped;
}

function closeRing(points) {
  if (points.length === 0) return points;
  const first = points[0];
  const last = points[points.length - 1];
  if (!pointsEqual(first, last)) {
    points.push([...first]);
  }
  return points;
}

function clipSegmentToBbox(a, b, bbox) {
  let t0 = 0;
  let t1 = 1;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];

  const checks = [
    [-dx, a[0] - bbox.minLng],
    [dx, bbox.maxLng - a[0]],
    [-dy, a[1] - bbox.minLat],
    [dy, bbox.maxLat - a[1]],
  ];

  for (const [p, q] of checks) {
    if (Math.abs(p) < 1e-12) {
      if (q < 0) return null;
      continue;
    }

    const r = q / p;
    if (p < 0) {
      if (r > t1) return null;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return null;
      if (r < t1) t1 = r;
    }
  }

  return [
    [a[0] + t0 * dx, a[1] + t0 * dy],
    [a[0] + t1 * dx, a[1] + t1 * dy],
  ];
}

function clipLineStringToBbox(points, bbox) {
  if (points.length < 2) return [];

  const segments = [];
  let current = [];

  for (let i = 1; i < points.length; i += 1) {
    const clipped = clipSegmentToBbox(points[i - 1], points[i], bbox);
    if (!clipped) {
      if (current.length >= 2) segments.push(current);
      current = [];
      continue;
    }

    const [start, end] = clipped.map(roundPoint);
    if (current.length === 0) {
      current.push(start, end);
      continue;
    }

    const previous = current[current.length - 1];
    if (!pointsEqual(previous, start)) {
      if (current.length >= 2) segments.push(current);
      current = [start, end];
      continue;
    }

    if (!pointsEqual(previous, end)) {
      current.push(end);
    }
  }

  if (current.length >= 2) segments.push(current);

  return segments
    .map(segment => dedupeConsecutivePoints(segment))
    .filter(segment => segment.length >= 2);
}

function clipRingToBbox(ring, bbox) {
  if (!Array.isArray(ring) || ring.length < 3) return [];

  const source = [...ring];
  if (source.length > 1 && pointsEqual(source[0], source[source.length - 1])) {
    source.pop();
  }

  const edges = [
    {
      inside: point => point[0] >= bbox.minLng,
      intersect: (a, b) => {
        const t = (bbox.minLng - a[0]) / (b[0] - a[0]);
        return [bbox.minLng, a[1] + t * (b[1] - a[1])];
      },
    },
    {
      inside: point => point[0] <= bbox.maxLng,
      intersect: (a, b) => {
        const t = (bbox.maxLng - a[0]) / (b[0] - a[0]);
        return [bbox.maxLng, a[1] + t * (b[1] - a[1])];
      },
    },
    {
      inside: point => point[1] >= bbox.minLat,
      intersect: (a, b) => {
        const t = (bbox.minLat - a[1]) / (b[1] - a[1]);
        return [a[0] + t * (b[0] - a[0]), bbox.minLat];
      },
    },
    {
      inside: point => point[1] <= bbox.maxLat,
      intersect: (a, b) => {
        const t = (bbox.maxLat - a[1]) / (b[1] - a[1]);
        return [a[0] + t * (b[0] - a[0]), bbox.maxLat];
      },
    },
  ];

  let output = source;
  for (const edge of edges) {
    const input = output;
    output = [];
    if (input.length === 0) break;

    let previous = input[input.length - 1];
    for (const current of input) {
      const currentInside = edge.inside(current);
      const previousInside = edge.inside(previous);

      if (currentInside) {
        if (!previousInside) {
          output.push(edge.intersect(previous, current));
        }
        output.push(current);
      } else if (previousInside) {
        output.push(edge.intersect(previous, current));
      }

      previous = current;
    }
  }

  if (output.length < 3) return [];

  const rounded = dedupeConsecutivePoints(output.map(roundPoint));
  if (rounded.length < 3) return [];
  closeRing(rounded);

  if (rounded.length < 4) return [];
  return rounded;
}

function clipPolygonToBbox(rings, bbox) {
  const clippedRings = rings.map(ring => clipRingToBbox(ring, bbox)).filter(ring => ring.length >= 4);
  if (clippedRings.length === 0) return null;
  return clippedRings;
}

function clipWaterGeometry(geometry, bbox) {
  if (!geometry) return null;

  if (geometry.type === 'Polygon') {
    const clipped = clipPolygonToBbox(geometry.coordinates, bbox);
    if (!clipped) return null;
    return { type: 'Polygon', coordinates: clipped };
  }

  if (geometry.type === 'MultiPolygon') {
    const clippedPolygons = geometry.coordinates
      .map(polygon => clipPolygonToBbox(polygon, bbox))
      .filter(Boolean);
    if (clippedPolygons.length === 0) return null;
    return { type: 'MultiPolygon', coordinates: clippedPolygons };
  }

  return null;
}

function featureHashFromCoordinates(coordinates) {
  const forward = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(';');
  const reverse = [...coordinates]
    .reverse()
    .map(([lng, lat]) => `${lng},${lat}`)
    .join(';');
  return forward < reverse ? forward : reverse;
}

function lineLength(coordinates) {
  let total = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const a = coordinates[index - 1];
    const b = coordinates[index];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

function sanitizeRoadFeatures(features) {
  const seen = new Set();
  const deduped = [];

  for (const feature of features) {
    const coordinates = dedupeConsecutivePoints(feature.geometry.coordinates.map(roundPoint));
    if (coordinates.length < 2) continue;
    if (lineLength(coordinates) < MIN_ROAD_LENGTH_DEGREES) continue;

    const hash = featureHashFromCoordinates(coordinates);
    if (seen.has(hash)) continue;
    seen.add(hash);

    deduped.push({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates,
      },
    });
  }

  deduped.sort((a, b) => {
    const aHash = featureHashFromCoordinates(a.geometry.coordinates);
    const bHash = featureHashFromCoordinates(b.geometry.coordinates);
    if (aHash < bHash) return -1;
    if (aHash > bHash) return 1;
    return 0;
  });

  return deduped;
}

async function fetchWaterways() {
  console.log('Fetching waterways from Amsterdam DataPunt...');
  const response = await fetch(WATERWAYS_URL);
  if (!response.ok) {
    throw new Error(`Waterway fetch failed: ${response.status}`);
  }

  const payload = await response.json();
  const features = (payload.features || [])
    .map(feature => {
      const clippedGeometry = clipWaterGeometry(feature.geometry, BBOX);
      if (!clippedGeometry) return null;
      return {
        type: 'Feature',
        geometry: clippedGeometry,
      };
    })
    .filter(Boolean);

  console.log(`  Waterway features kept: ${features.length}`);
  return {
    type: 'FeatureCollection',
    features,
  };
}

async function fetchRoads() {
  console.log('Fetching roads from Overpass...');

  const bbox = `${BBOX.minLat},${BBOX.minLng},${BBOX.maxLat},${BBOX.maxLng}`;
  const query = `[out:json][timeout:45];
(
  way["highway"~"^(motorway|trunk|primary)$"](${bbox});
);
out geom;`;

  let payload = null;
  let lastError = null;

  for (const endpoint of OVERPASS_URLS) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        payload = await response.json();
        console.log(`  Overpass source: ${endpoint} (attempt ${attempt})`);
        break;
      } catch (error) {
        lastError = error;
        if (attempt < 3) {
          await sleep(700 * attempt);
        }
      }
    }

    if (payload) break;
  }

  if (!payload) {
    const message = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Road fetch failed from all Overpass endpoints (${message})`);
  }

  const clippedFeatures = [];

  for (const element of payload.elements || []) {
    if (element.type !== 'way' || !Array.isArray(element.geometry) || element.geometry.length < 2) {
      continue;
    }

    const coordinates = element.geometry.map(point => [point.lon, point.lat]);
    const segments = clipLineStringToBbox(coordinates, BBOX);

    for (const segment of segments) {
      clippedFeatures.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: segment,
        },
      });
    }
  }

  const features = sanitizeRoadFeatures(clippedFeatures);
  console.log(`  Road features kept: ${features.length}`);

  return {
    type: 'FeatureCollection',
    features,
  };
}

function writeOutput(filename, featureCollection) {
  const outputPath = resolve(DATA_DIR, filename);
  const json = JSON.stringify(featureCollection);
  writeFileSync(outputPath, json, 'utf8');
  return { outputPath, sizeKb: (Buffer.byteLength(json) / 1024).toFixed(1) };
}

async function main() {
  try {
    const [waterways, roads] = await Promise.all([fetchWaterways(), fetchRoads()]);

    const waterResult = writeOutput('amsterdam-waterways.json', waterways);
    const roadResult = writeOutput('amsterdam-roads.json', roads);

    console.log(`\nWrote ${waterResult.outputPath} (${waterResult.sizeKb} KB)`);
    console.log(`Wrote ${roadResult.outputPath} (${roadResult.sizeKb} KB)`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nFailed to fetch geodata: ${message}`);
    process.exit(1);
  }
}

main();
