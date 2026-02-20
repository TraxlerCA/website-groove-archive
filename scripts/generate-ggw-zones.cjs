#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const Papa = require('papaparse');

const ROOT_DIR = path.resolve(__dirname, '..');
const RAW_GEO_PATH = path.join(ROOT_DIR, 'tmp', 'geo', 'ggwgebieden', 'gebieden_ggwgebieden.geojson');
const MAPPING_CSV_PATH = path.join(ROOT_DIR, 'src', 'data', 'amsterdam-ggw-mapping.csv');
const OUTPUT_GEO_PATH = path.join(ROOT_DIR, 'src', 'data', 'amsterdam-ggw-zones.json');
const OUTPUT_ZONE_AREAS_PATH = path.join(ROOT_DIR, 'src', 'data', 'amsterdam-ggw-zone-areas.json');

const ZONE_IDS = [
  'canal_glow',
  'festival_peak',
  'spiegel_funk',
  'amstel_rush',
  'jordaan_jack',
  'polder_drift',
  'beton_tunnel',
  'ndsm_fracture',
  'oost_dauw',
  'dam_pop_up',
  'nacht_ferry',
];

const ZONE_ID_SET = new Set(ZONE_IDS);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseBoolean(value, rowNumber) {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false;
  }
  throw new Error(`Invalid active flag on CSV row ${rowNumber}: "${value}"`);
}

function roundNumber(value) {
  return Number(value.toFixed(6));
}

function roundCoordinates(value) {
  if (Array.isArray(value)) {
    return value.map(roundCoordinates);
  }
  if (typeof value === 'number') {
    return roundNumber(value);
  }
  return value;
}

function parseCsvRows(csvText) {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => String(header || '').trim().toLowerCase(),
  });

  if (parsed.errors.length > 0) {
    const first = parsed.errors[0];
    throw new Error(`CSV parse error at row ${first.row}: ${first.message}`);
  }

  return parsed.data;
}

function main() {
  const rawGeo = readJson(RAW_GEO_PATH);
  const rawFeatures = rawGeo.features || [];

  const rawByCode = new Map(
    rawFeatures.map(feature => [String(feature?.properties?.code || '').trim(), feature]),
  );

  const csvText = fs.readFileSync(MAPPING_CSV_PATH, 'utf8');
  const csvRows = parseCsvRows(csvText);

  if (csvRows.length !== rawFeatures.length) {
    throw new Error(
      `CSV row count mismatch: expected ${rawFeatures.length}, got ${csvRows.length}`,
    );
  }

  const mappingByCode = new Map();

  csvRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const code = String(row.ggw_code || '').trim();
    const csvName = String(row.ggw_name || '').trim();
    const zoneIdRaw = String(row.zone_id || '').trim();
    const active = parseBoolean(row.active, rowNumber);

    if (!code) {
      throw new Error(`Missing ggw_code on CSV row ${rowNumber}`);
    }

    if (mappingByCode.has(code)) {
      throw new Error(`Duplicate ggw_code "${code}" on CSV row ${rowNumber}`);
    }

    const rawFeature = rawByCode.get(code);
    if (!rawFeature) {
      throw new Error(`Unknown ggw_code "${code}" on CSV row ${rowNumber}`);
    }

    const rawName = String(rawFeature?.properties?.naam || '').trim();
    if (csvName && csvName !== rawName) {
      throw new Error(
        `Name mismatch for code "${code}" on CSV row ${rowNumber}. CSV="${csvName}" raw="${rawName}"`,
      );
    }

    if (zoneIdRaw && !ZONE_ID_SET.has(zoneIdRaw)) {
      throw new Error(`Unknown zone_id "${zoneIdRaw}" on CSV row ${rowNumber}`);
    }

    if (active && !zoneIdRaw) {
      throw new Error(`Active GGW area "${code}" must include zone_id (CSV row ${rowNumber})`);
    }

    mappingByCode.set(code, {
      code,
      name: rawName,
      zoneId: zoneIdRaw || null,
      active,
    });
  });

  rawByCode.forEach((_, code) => {
    if (!mappingByCode.has(code)) {
      throw new Error(`Missing CSV mapping for raw GGW code "${code}"`);
    }
  });

  const generatedFeatures = rawFeatures.map(feature => {
    const code = String(feature?.properties?.code || '').trim();
    const mapping = mappingByCode.get(code);

    return {
      type: 'Feature',
      properties: {
        code: mapping.code,
        name: mapping.name,
        zoneId: mapping.zoneId,
        active: mapping.active,
      },
      geometry: {
        type: feature.geometry.type,
        coordinates: roundCoordinates(feature.geometry.coordinates),
      },
    };
  });

  const generatedGeo = {
    type: 'FeatureCollection',
    features: generatedFeatures,
  };

  const activeAreasByZone = Object.fromEntries(ZONE_IDS.map(zoneId => [zoneId, []]));

  mappingByCode.forEach(mapping => {
    if (!mapping.active || !mapping.zoneId) return;
    activeAreasByZone[mapping.zoneId].push(mapping.name);
  });

  ZONE_IDS.forEach(zoneId => {
    activeAreasByZone[zoneId].sort((a, b) => a.localeCompare(b));
  });

  fs.writeFileSync(OUTPUT_GEO_PATH, JSON.stringify(generatedGeo));
  fs.writeFileSync(OUTPUT_ZONE_AREAS_PATH, `${JSON.stringify(activeAreasByZone, null, 2)}\n`);

  const activeCount = generatedFeatures.filter(feature => feature.properties.active).length;
  console.log(`Generated ${path.relative(ROOT_DIR, OUTPUT_GEO_PATH)} (${generatedFeatures.length} features, ${activeCount} active)`);
  console.log(`Generated ${path.relative(ROOT_DIR, OUTPUT_ZONE_AREAS_PATH)}`);
}

main();
