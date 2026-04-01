import { randomUUID } from 'node:crypto';

import RecordBinHome from '@/components/home/RecordBinHome';

export const dynamic = 'force-dynamic';

export default function HomePage() {
  return <RecordBinHome shuffleSeed={randomUUID()} />;
}

