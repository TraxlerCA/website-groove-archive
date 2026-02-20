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

export const MAP_ZONES: MapZoneConfig[] = [
  {
    id: 'canal_glow',
    displayName: 'Grachtenring',
    genreLabel: 'Melodic House & Techno',
    accent: '#42d4ff',
    areas: ['Centrum-West', 'Centrum-Oost', 'Oud-West, De Baarsjes'],
    anchorDesktop: { x: 48, y: 37, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'spiegel_funk',
    displayName: 'Westerpark Belt',
    genreLabel: 'Disco & Funky House',
    accent: '#ff8d4d',
    areas: ['Westerpark', 'Bos en Lommer'],
    anchorDesktop: { x: 39, y: 26, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'amstel_rush',
    displayName: 'Oostelijke Kades',
    genreLabel: 'Trance & High Energy Rave',
    accent: '#ff5ea8',
    areas: ['Oud-Oost', 'Indische Buurt, Oostelijk Havengebied'],
    anchorDesktop: { x: 62, y: 41, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'jordaan_jack',
    displayName: 'Zuid Stretches',
    genreLabel: 'Classic House & Garage',
    accent: '#ffd35a',
    areas: ['Oud-Zuid', 'De Pijp, Rivierenbuurt'],
    anchorDesktop: { x: 46, y: 53, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'polder_drift',
    displayName: 'Polderlijn Zuid',
    genreLabel: 'Minimal & Deep House',
    accent: '#7ddfb3',
    areas: ['Slotervaart', 'Buitenveldert, Zuidas'],
    anchorDesktop: { x: 38, y: 65, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'beton_tunnel',
    displayName: 'Sloterdijk Line',
    genreLabel: 'Hard & Driving Techno',
    accent: '#94a2ff',
    areas: ['Sloterdijk Nieuw-West', 'Geuzenveld, Slotermeer'],
    anchorDesktop: { x: 25, y: 28, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'ndsm_fracture',
    displayName: 'Noord Docks',
    genreLabel: 'Breaks & Experimental',
    accent: '#d487ff',
    areas: ['Noord-West', 'Oud-Noord', 'Noord-Oost'],
    anchorDesktop: { x: 58, y: 16, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'oost_dauw',
    displayName: 'IJ Waters',
    genreLabel: 'Chill & Organic Electronica',
    accent: '#8eeeff',
    areas: ['Watergraafsmeer', 'IJburg, Zeeburgereiland'],
    anchorDesktop: { x: 69, y: 57, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'dam_pop_up',
    displayName: 'Nieuw-West South',
    genreLabel: 'Pop Edits & Party Remixes',
    accent: '#ffb347',
    areas: ['Osdorp', 'De Aker, Sloten, Nieuw-Sloten'],
    anchorDesktop: { x: 22, y: 50, align: 'left' },
    anchorMobile: { x: 50, y: 88, align: 'center' },
  },
  {
    id: 'nacht_ferry',
    displayName: 'Zuidoost Ferry',
    genreLabel: 'Leftfield',
    accent: '#7f9cff',
    areas: ['Bijlmer-West', 'Bijlmer-Centrum', 'Bijlmer-Oost', 'Gaasperdam', 'Weesp, Driemond'],
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
