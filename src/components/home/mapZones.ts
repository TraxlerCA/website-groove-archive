import zoneAreasById from '@/data/amsterdam-ggw-zone-areas.json';

export type MapZoneId =
  | 'canal_glow'
  | 'festival_peak'
  | 'spiegel_funk'
  | 'amstel_rush'
  | 'jordaan_jack'
  | 'polder_drift'
  | 'beton_tunnel'
  | 'ndsm_fracture'
  | 'oost_dauw'
  | 'dam_pop_up'
  | 'nacht_ferry';

export type MapAnchor = {
  x: number;
  y: number;
  align: 'left' | 'right' | 'center';
};

export type MapZoneConfig = {
  id: MapZoneId;
  displayName: string;
  genreLabel: string;
  accent: string;
  areas: string[];
  anchorDesktop: MapAnchor;
  anchorMobile: MapAnchor;
};

export enum HomeEventName {
  ZoneSelected = 'home_map_zone_selected',
  SetRevealed = 'home_map_set_revealed',
  PlayClicked = 'home_map_play_clicked',
  OutboundClicked = 'home_map_outbound_clicked',
}

export const WILDCARD_ZONE_ID: MapZoneId = 'amstel_rush';
const ZONE_AREAS_BY_ID = zoneAreasById as Record<MapZoneId, string[]>;

export const MAP_ZONES: MapZoneConfig[] = [
  {
    id: 'canal_glow',
    displayName: 'Melodic House & Techno',
    genreLabel: 'Melodic House & Techno',
    accent: '#00A8CC',
    areas: ZONE_AREAS_BY_ID.canal_glow,
    anchorDesktop: { x: 48, y: 37, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'festival_peak',
    displayName: 'Festival Anthems & Big Room',
    genreLabel: 'Festival Anthems & Big Room',
    accent: '#480CA8',
    areas: ZONE_AREAS_BY_ID.festival_peak,
    anchorDesktop: { x: 53, y: 35, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'spiegel_funk',
    displayName: 'Disco & Funky House',
    genreLabel: 'Disco & Funky House',
    accent: '#FB5607',
    areas: ZONE_AREAS_BY_ID.spiegel_funk,
    anchorDesktop: { x: 39, y: 26, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'amstel_rush',
    displayName: '<Random genre>',
    genreLabel: '<Random genre>',
    accent: '#ADB5BD',
    areas: ZONE_AREAS_BY_ID.amstel_rush,
    anchorDesktop: { x: 62, y: 41, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'jordaan_jack',
    displayName: 'Classic House & Garage',
    genreLabel: 'Classic House & Garage',
    accent: '#16302B',
    areas: ZONE_AREAS_BY_ID.jordaan_jack,
    anchorDesktop: { x: 46, y: 53, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'polder_drift',
    displayName: 'Minimal & Deep House',
    genreLabel: 'Minimal & Deep House',
    accent: '#212529',
    areas: ZONE_AREAS_BY_ID.polder_drift,
    anchorDesktop: { x: 38, y: 65, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'beton_tunnel',
    displayName: 'Hard & Driving Techno',
    genreLabel: 'Hard & Driving Techno',
    accent: '#9E0019',
    areas: ZONE_AREAS_BY_ID.beton_tunnel,
    anchorDesktop: { x: 25, y: 28, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'ndsm_fracture',
    displayName: 'Breaks & Experimental',
    genreLabel: 'Breaks & Experimental',
    accent: '#FFB703',
    areas: ZONE_AREAS_BY_ID.ndsm_fracture,
    anchorDesktop: { x: 58, y: 16, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'oost_dauw',
    displayName: 'Chill & Organic Electronica',
    genreLabel: 'Chill & Organic Electronica',
    accent: '#002855',
    areas: ZONE_AREAS_BY_ID.oost_dauw,
    anchorDesktop: { x: 69, y: 57, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'dam_pop_up',
    displayName: 'Pop Edits & Party Remixes',
    genreLabel: 'Pop Edits & Party Remixes',
    accent: '#FF9F1C',
    areas: ZONE_AREAS_BY_ID.dam_pop_up,
    anchorDesktop: { x: 22, y: 50, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'nacht_ferry',
    displayName: 'Trance & High Energy Rave',
    genreLabel: 'Trance & High Energy Rave',
    accent: '#FF006E',
    areas: ZONE_AREAS_BY_ID.nacht_ferry,
    anchorDesktop: { x: 84, y: 79, align: 'right' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
];

export const CORE_ZONE_GENRE_LABELS = MAP_ZONES.filter(
  zone => zone.id !== WILDCARD_ZONE_ID,
).map(zone => zone.genreLabel);

function getFirstAlphabeticalCharacter(value: string): string | null {
  const match = value.match(/[A-Za-z]/);
  return match ? match[0].toUpperCase() : null;
}

export function getZoneMarkerGlyph(zone: MapZoneConfig): string {
  if (zone.id === WILDCARD_ZONE_ID) return '?';
  return (
    getFirstAlphabeticalCharacter(zone.genreLabel) ||
    getFirstAlphabeticalCharacter(zone.displayName) ||
    '•'
  );
}

export function getMapZone(zoneId: MapZoneId): MapZoneConfig {
  const match = MAP_ZONES.find(zone => zone.id === zoneId);
  if (!match) {
    throw new Error(`Unknown zone id: ${zoneId}`);
  }
  return match;
}

export function getContrastTextColor(hex: string): '#030712' | '#F8FAFC' {
  const sanitized = hex.trim().replace('#', '');
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map(char => `${char}${char}`)
          .join('')
      : sanitized;

  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return '#030712';
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16) / 255;
  const g = Number.parseInt(normalized.slice(2, 4), 16) / 255;
  const b = Number.parseInt(normalized.slice(4, 6), 16) / 255;

  const linearize = (value: number) =>
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

  const luminance = 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
  return luminance < 0.34 ? '#F8FAFC' : '#030712';
}
