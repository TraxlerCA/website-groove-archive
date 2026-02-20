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
    <main className="h-[calc(100svh-9.5rem)] w-full px-2 py-2 sm:h-[calc(100svh-10.5rem)] sm:px-4 sm:py-4">
      <AmsterdamMapStage
        zones={MAP_ZONES}
        activeZoneId={selectedZoneId}
        onSelect={handleSelectZone}
      />
    </main>
  );
}
