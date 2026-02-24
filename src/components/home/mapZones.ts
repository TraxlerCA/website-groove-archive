import zoneAreasById from '@/data/amsterdam-ggw-zone-areas.json';

export type MapZoneId =
  | 'melodic_house_techno'
  | 'festival_big_room'
  | 'disco_funky_house'
  | 'wildcard_leftfield'
  | 'classic_house_garage'
  | 'minimal_deep_house'
  | 'hard_driving_techno'
  | 'breaks_experimental'
  | 'chill_organic_electronica'
  | 'pop_party_remixes'
  | 'trance_high_energy_rave';

export type LegacyMapZoneId =
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

export type MapZoneConfig = {
  id: MapZoneId;
  displayName: string;
  genreLabel: string;
  accent: string;
  areas: string[];
  panelSideDesktop: 'left' | 'right';
};

export enum HomeEventName {
  ZoneSelected = 'home_map_zone_selected',
  SetRevealed = 'home_map_set_revealed',
  PlayClicked = 'home_map_play_clicked',
  OutboundClicked = 'home_map_outbound_clicked',
}

export const LEGACY_ZONE_ID_ALIASES: Record<LegacyMapZoneId, MapZoneId> = {
  canal_glow: 'melodic_house_techno',
  festival_peak: 'festival_big_room',
  spiegel_funk: 'disco_funky_house',
  amstel_rush: 'wildcard_leftfield',
  jordaan_jack: 'classic_house_garage',
  polder_drift: 'minimal_deep_house',
  beton_tunnel: 'hard_driving_techno',
  ndsm_fracture: 'breaks_experimental',
  oost_dauw: 'chill_organic_electronica',
  dam_pop_up: 'pop_party_remixes',
  nacht_ferry: 'trance_high_energy_rave',
};

const MAP_ZONE_ID_SET = new Set<MapZoneId>([
  'melodic_house_techno',
  'festival_big_room',
  'disco_funky_house',
  'wildcard_leftfield',
  'classic_house_garage',
  'minimal_deep_house',
  'hard_driving_techno',
  'breaks_experimental',
  'chill_organic_electronica',
  'pop_party_remixes',
  'trance_high_energy_rave',
]);

export function isMapZoneId(value: string): value is MapZoneId {
  return MAP_ZONE_ID_SET.has(value as MapZoneId);
}

export function normalizeMapZoneId(value: string | null | undefined): MapZoneId | null {
  if (!value) return null;
  if (isMapZoneId(value)) return value;
  return LEGACY_ZONE_ID_ALIASES[value as LegacyMapZoneId] ?? null;
}

export const WILDCARD_ZONE_ID: MapZoneId = 'wildcard_leftfield';
const ZONE_AREAS_BY_ID = zoneAreasById as Record<MapZoneId, string[]>;

export const MAP_ZONES: MapZoneConfig[] = [
  {
    id: 'melodic_house_techno',
    displayName: 'Melodic House & Techno',
    genreLabel: 'Melodic House & Techno',
    accent: '#00A8CC',
    areas: ZONE_AREAS_BY_ID.melodic_house_techno,
    panelSideDesktop: 'left',
  },
  {
    id: 'festival_big_room',
    displayName: 'Festival Anthems & Big Room',
    genreLabel: 'Festival Anthems & Big Room',
    accent: '#480CA8',
    areas: ZONE_AREAS_BY_ID.festival_big_room,
    panelSideDesktop: 'left',
  },
  {
    id: 'disco_funky_house',
    displayName: 'Disco & Funky House',
    genreLabel: 'Disco & Funky House',
    accent: '#FB5607',
    areas: ZONE_AREAS_BY_ID.disco_funky_house,
    panelSideDesktop: 'left',
  },
  {
    id: 'wildcard_leftfield',
    displayName: '<Random genre>',
    genreLabel: '<Random genre>',
    accent: '#ADB5BD',
    areas: ZONE_AREAS_BY_ID.wildcard_leftfield,
    panelSideDesktop: 'left',
  },
  {
    id: 'classic_house_garage',
    displayName: 'Classic House & Garage',
    genreLabel: 'Classic House & Garage',
    accent: '#16302B',
    areas: ZONE_AREAS_BY_ID.classic_house_garage,
    panelSideDesktop: 'left',
  },
  {
    id: 'minimal_deep_house',
    displayName: 'Minimal & Deep House',
    genreLabel: 'Minimal & Deep House',
    accent: '#212529',
    areas: ZONE_AREAS_BY_ID.minimal_deep_house,
    panelSideDesktop: 'left',
  },
  {
    id: 'hard_driving_techno',
    displayName: 'Hard & Driving Techno',
    genreLabel: 'Hard & Driving Techno',
    accent: '#9E0019',
    areas: ZONE_AREAS_BY_ID.hard_driving_techno,
    panelSideDesktop: 'left',
  },
  {
    id: 'breaks_experimental',
    displayName: 'Breaks & Experimental',
    genreLabel: 'Breaks & Experimental',
    accent: '#FFB703',
    areas: ZONE_AREAS_BY_ID.breaks_experimental,
    panelSideDesktop: 'left',
  },
  {
    id: 'chill_organic_electronica',
    displayName: 'Chill & Organic Electronica',
    genreLabel: 'Chill & Organic Electronica',
    accent: '#002855',
    areas: ZONE_AREAS_BY_ID.chill_organic_electronica,
    panelSideDesktop: 'left',
  },
  {
    id: 'pop_party_remixes',
    displayName: 'Pop Edits & Party Remixes',
    genreLabel: 'Pop Edits & Party Remixes',
    accent: '#FF9F1C',
    areas: ZONE_AREAS_BY_ID.pop_party_remixes,
    panelSideDesktop: 'left',
  },
  {
    id: 'trance_high_energy_rave',
    displayName: 'Trance & High Energy Rave',
    genreLabel: 'Trance & High Energy Rave',
    accent: '#FF006E',
    areas: ZONE_AREAS_BY_ID.trance_high_energy_rave,
    panelSideDesktop: 'right',
  },
];

export const CORE_ZONE_GENRE_LABELS = MAP_ZONES.filter(
  zone => zone.id !== WILDCARD_ZONE_ID,
).map(zone => zone.genreLabel);

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
