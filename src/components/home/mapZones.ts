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

export const WILDCARD_ZONE_ID: MapZoneId = 'nacht_ferry';
const ZONE_AREAS_BY_ID = zoneAreasById as Record<MapZoneId, string[]>;

export const MAP_ZONES: MapZoneConfig[] = [
  {
    id: 'canal_glow',
    displayName: 'Melodic House & Techno',
    genreLabel: 'Melodic House & Techno',
    accent: '#42d4ff',
    areas: ZONE_AREAS_BY_ID.canal_glow,
    anchorDesktop: { x: 48, y: 37, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'festival_peak',
    displayName: 'Festival Anthems & Big Room',
    genreLabel: 'Festival Anthems & Big Room',
    accent: '#ff6f5f',
    areas: ZONE_AREAS_BY_ID.festival_peak,
    anchorDesktop: { x: 53, y: 35, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'spiegel_funk',
    displayName: 'Disco & Funky House',
    genreLabel: 'Disco & Funky House',
    accent: '#ff8d4d',
    areas: ZONE_AREAS_BY_ID.spiegel_funk,
    anchorDesktop: { x: 39, y: 26, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'amstel_rush',
    displayName: 'Trance & High Energy Rave',
    genreLabel: 'Trance & High Energy Rave',
    accent: '#ff5ea8',
    areas: ZONE_AREAS_BY_ID.amstel_rush,
    anchorDesktop: { x: 62, y: 41, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'jordaan_jack',
    displayName: 'Classic House & Garage',
    genreLabel: 'Classic House & Garage',
    accent: '#ffd35a',
    areas: ZONE_AREAS_BY_ID.jordaan_jack,
    anchorDesktop: { x: 46, y: 53, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'polder_drift',
    displayName: 'Minimal & Deep House',
    genreLabel: 'Minimal & Deep House',
    accent: '#7ddfb3',
    areas: ZONE_AREAS_BY_ID.polder_drift,
    anchorDesktop: { x: 38, y: 65, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'beton_tunnel',
    displayName: 'Hard & Driving Techno',
    genreLabel: 'Hard & Driving Techno',
    accent: '#94a2ff',
    areas: ZONE_AREAS_BY_ID.beton_tunnel,
    anchorDesktop: { x: 25, y: 28, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'ndsm_fracture',
    displayName: 'Breaks & Experimental',
    genreLabel: 'Breaks & Experimental',
    accent: '#d487ff',
    areas: ZONE_AREAS_BY_ID.ndsm_fracture,
    anchorDesktop: { x: 58, y: 16, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'oost_dauw',
    displayName: 'Chill & Organic Electronica',
    genreLabel: 'Chill & Organic Electronica',
    accent: '#8eeeff',
    areas: ZONE_AREAS_BY_ID.oost_dauw,
    anchorDesktop: { x: 69, y: 57, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'dam_pop_up',
    displayName: 'Pop Edits & Party Remixes',
    genreLabel: 'Pop Edits & Party Remixes',
    accent: '#ffb347',
    areas: ZONE_AREAS_BY_ID.dam_pop_up,
    anchorDesktop: { x: 22, y: 50, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'nacht_ferry',
    displayName: '<Random genre>',
    genreLabel: '<Random genre>',
    accent: '#7f9cff',
    areas: ZONE_AREAS_BY_ID.nacht_ferry,
    anchorDesktop: { x: 84, y: 79, align: 'right' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
];

export const CORE_ZONE_GENRE_LABELS = MAP_ZONES.filter(
  zone => zone.id !== WILDCARD_ZONE_ID,
).map(zone => zone.genreLabel);

export function getMapZone(zoneId: MapZoneId): MapZoneConfig {
  const match = MAP_ZONES.find(zone => zone.id === zoneId);
  if (!match) {
    throw new Error(`Unknown zone id: ${zoneId}`);
  }
  return match;
}
