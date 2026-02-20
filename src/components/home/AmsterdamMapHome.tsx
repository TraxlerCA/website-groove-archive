'use client';

import { useCallback, useState } from 'react';
import AmsterdamMapStage from '@/components/home/AmsterdamMapStage';
import {
  HomeEventName,
  MAP_ZONES,
  type MapZoneId,
} from '@/components/home/mapZones';
import { trackEvent } from '@/lib/analytics';

export default function AmsterdamMapHome() {
  const [selectedZoneId, setSelectedZoneId] = useState<MapZoneId | null>(null);

  const handleSelectZone = useCallback((zoneId: MapZoneId) => {
    const zone = MAP_ZONES.find(entry => entry.id === zoneId);
    if (!zone) return;

    setSelectedZoneId(zoneId);
    trackEvent(HomeEventName.ZoneSelected, {
      zone_id: zone.id,
      genre: zone.genreLabel,
    });
  }, []);

  return (
    <main className="container mx-auto max-w-6xl px-6 pt-7 pb-12 sm:pt-12">
      <AmsterdamMapStage
        zones={MAP_ZONES}
        activeZoneId={selectedZoneId}
        onSelect={handleSelectZone}
      />
    </main>
  );
}
