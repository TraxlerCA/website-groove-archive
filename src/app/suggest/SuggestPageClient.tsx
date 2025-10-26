'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { PageTitle } from '@/components/ui';
import {
  SUGGEST_BODY,
  SUGGEST_SUBJECT,
  SUGGEST_TO,
  buildGmail,
  buildMailto,
  trackSuggest,
} from '@/components/SuggestModal';

export default function SuggestPageClient() {
  const mailtoHref = buildMailto(SUGGEST_TO, SUGGEST_SUBJECT, SUGGEST_BODY);
  const gmailHref = buildGmail(SUGGEST_TO, SUGGEST_SUBJECT, SUGGEST_BODY);

  useEffect(() => {
    trackSuggest('suggest_open_page');
  }, []);

  return (
    <section className="container mx-auto max-w-3xl px-6 mt-12 space-y-8">
      <PageTitle title="Suggest a set" />

      <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
        <p>
          Found a mix that belongs in The Groove Archive? Share the link and a short note so it can
          be reviewed and added to the collection.
        </p>
        <p>
          Please include:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>The SoundCloud or YouTube link (or both if available).</li>
          <li>Any context, like why it fits a certain genre or moment.</li>
          <li>Your email if you&rsquo;d like a heads-up when it lands in the archive.</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <motion.a
          href={mailtoHref}
          onClick={() => { trackSuggest('suggest_click_mailto'); }}
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-white hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 w-full sm:w-auto"
          aria-label="Open your email app to send a suggestion"
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ y: 0, scale: 0.99 }}
        >
          Mail Joost
        </motion.a>
        <motion.a
          href={gmailHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackSuggest('suggest_click_gmail'); }}
          className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-white px-4 py-2 text-neutral-900 hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black/40 w-full sm:w-auto"
          aria-label="Open Gmail to send a suggestion"
          whileHover={{ y: -1, scale: 1.01 }}
          whileTap={{ y: 0, scale: 0.99 }}
        >
          Open in Gmail
        </motion.a>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-600">
        Prefer another channel? Drop Joost a line at{' '}
        <a href={`mailto:${SUGGEST_TO}`} className="text-neutral-900 underline">
          {SUGGEST_TO}
        </a>{' '}
        and the set will find its way to the archive.
      </div>
    </section>
  );
}
