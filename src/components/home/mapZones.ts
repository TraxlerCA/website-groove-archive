export type MapZoneId =
  | 'canal_glow'
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

export type ZoneBounds = {
  x: number;
  y: number;
  w: number;
  h: number;
  rotate: number;
};

export type MapZoneConfig = {
  id: MapZoneId;
  displayName: string;
  genreLabel: string;
  accent: string;
  bounds: ZoneBounds;
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

export const MAP_ZONES: MapZoneConfig[] = [
  {
    id: 'canal_glow',
    displayName: 'Canal Glow',
    genreLabel: 'Melodic House & Techno',
    accent: '#42d4ff',
    bounds: { x: 18, y: 22, w: 22, h: 20, rotate: -6 },
    anchorDesktop: { x: 43, y: 27, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'spiegel_funk',
    displayName: 'Spiegel Funk',
    genreLabel: 'Disco & Funky House',
    accent: '#ff8d4d',
    bounds: { x: 42, y: 12, w: 21, h: 18, rotate: 7 },
    anchorDesktop: { x: 68, y: 22, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'amstel_rush',
    displayName: 'Amstel Rush',
    genreLabel: 'Trance & High Energy Rave',
    accent: '#ff5ea8',
    bounds: { x: 68, y: 20, w: 19, h: 19, rotate: -4 },
    anchorDesktop: { x: 86, y: 34, align: 'right' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'jordaan_jack',
    displayName: 'Jordaan Jack',
    genreLabel: 'Classic House & Garage',
    accent: '#ffd35a',
    bounds: { x: 12, y: 44, w: 20, h: 18, rotate: 4 },
    anchorDesktop: { x: 37, y: 55, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'polder_drift',
    displayName: 'Polder Drift',
    genreLabel: 'Minimal & Deep House',
    accent: '#7ddfb3',
    bounds: { x: 34, y: 36, w: 18, h: 18, rotate: -10 },
    anchorDesktop: { x: 53, y: 47, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'beton_tunnel',
    displayName: 'Beton Tunnel',
    genreLabel: 'Hard & Driving Techno',
    accent: '#94a2ff',
    bounds: { x: 56, y: 42, w: 22, h: 18, rotate: 5 },
    anchorDesktop: { x: 78, y: 50, align: 'right' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'ndsm_fracture',
    displayName: 'NDSM Fracture',
    genreLabel: 'Breaks & Experimental',
    accent: '#d487ff',
    bounds: { x: 76, y: 45, w: 16, h: 19, rotate: -8 },
    anchorDesktop: { x: 88, y: 58, align: 'right' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'oost_dauw',
    displayName: 'Oost Dauw',
    genreLabel: 'Chill & Organic Electronica',
    accent: '#8eeeff',
    bounds: { x: 20, y: 65, w: 18, h: 18, rotate: -6 },
    anchorDesktop: { x: 44, y: 76, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'dam_pop_up',
    displayName: 'Dam Pop-Up',
    genreLabel: 'Pop Edits & Party Remixes',
    accent: '#ffb347',
    bounds: { x: 42, y: 61, w: 22, h: 18, rotate: 8 },
    anchorDesktop: { x: 66, y: 73, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'nacht_ferry',
    displayName: 'Nacht Ferry',
    genreLabel: 'Leftfield',
    accent: '#7f9cff',
    bounds: { x: 66, y: 68, w: 19, h: 18, rotate: -5 },
    anchorDesktop: { x: 84, y: 78, align: 'right' },
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
