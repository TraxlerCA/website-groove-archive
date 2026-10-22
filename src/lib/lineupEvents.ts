import type { Row } from '@/lib/heatmaps';

// Event metadata and offline browser-test fixture. Live artist rows come from the database.
// Timetable: Overbruggen Instagram announcement for Saturday 24 October 2026.
export const overbruggen = {
  festival: 'Overbruggen Kyle Starkey Invites',
  date: '2026-10-24',
  venue: 'Pllek, Amsterdam',
  source: 'https://www.over-bruggen.com/events/overbruggen-kyle-starkey-invites-ade-2026',
};

// Each B2B participant gets a separate, equally timed row so ratings remain individual.
// The scheduled heatmap lays them out side by side within their shared slot.
export const lineupRows: Row[] = [
  { artist: 'Inafekt',     stage: 'Arena', stage_order: 1, start: '15:00', end: '16:30', rating: '' },
  { artist: 'Sensu',       stage: 'Arena', stage_order: 1, start: '15:00', end: '16:30', rating: '' },
  { artist: 'NewTone',     stage: 'Arena', stage_order: 1, start: '16:30', end: '18:00', rating: 'blazing' },
  { artist: 'WOLTERS',     stage: 'Arena', stage_order: 1, start: '18:00', end: '20:00', rating: 'ok' },
  { artist: 'Kyle Starkey',stage: 'Arena', stage_order: 1, start: '20:00', end: '23:00', rating: 'blazing' },
  { artist: 'CVNTS',       stage: 'Club',  stage_order: 2, start: '15:00', end: '16:30', rating: 'ok' },
  { artist: 'Entasia',     stage: 'Club',  stage_order: 2, start: '16:30', end: '18:30', rating: 'hot' },
  { artist: 'Ned Bennett', stage: 'Club',  stage_order: 2, start: '16:30', end: '18:30', rating: '' },
  { artist: 'Club Angel',  stage: 'Club',  stage_order: 2, start: '18:30', end: '20:30', rating: 'hot' },
  { artist: 'Olive Anguz', stage: 'Club',  stage_order: 2, start: '20:30', end: '23:00', rating: 'blazing' },
  { artist: 'STÜM',        stage: 'Club',  stage_order: 2, start: '20:30', end: '23:00', rating: 'hot' },
].map(row => ({ festival: overbruggen.festival, date: overbruggen.date, ...row }));
