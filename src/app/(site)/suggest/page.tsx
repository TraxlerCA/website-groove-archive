import type { Metadata } from 'next';
import SuggestPageClient from './SuggestPageClient';

const TITLE = 'Suggest a set';
const DESCRIPTION =
  'Share a SoundCloud or YouTube link and a short note to help expand The Groove Archive.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/suggest' },
};

export default function SuggestPage() {
  return <SuggestPageClient />;
}
