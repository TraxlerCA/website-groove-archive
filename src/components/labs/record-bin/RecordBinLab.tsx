'use client';

import { RecordBinExperience } from '@/components/record-bin/RecordBinExperience';
import type { RecordBinDeckItem } from '@/components/record-bin/deck';

type RecordBinLabProps = {
  items: RecordBinDeckItem[];
};

export function RecordBinLab({ items }: RecordBinLabProps) {
  return (
    <RecordBinExperience
      items={items}
      eyebrow={null}
      title="Flip through the archive until one feels right."
      description={null}
      selectorClassName="lg:-mt-6"
    />
  );
}
