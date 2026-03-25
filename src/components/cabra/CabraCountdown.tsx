'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { startTransition, useEffect, useState } from 'react';
import {
  formatCabraDisplayValue,
  getCabraCountdown,
  getCabraPrimaryValue,
  type CountdownMode,
} from '@/lib/cabraCountdown';

type CabraCountdownProps = {
  initialNow?: number;
};

const MODES: Array<{ id: CountdownMode; label: string }> = [
  { id: 'days', label: 'Days' },
  { id: 'hours', label: 'Hours' },
  { id: 'minutes', label: 'Minutes' },
  { id: 'seconds', label: 'Seconds' },
];
const SWISS_EASE = [0.16, 1, 0.3, 1] as const;

export default function CabraCountdown({ initialNow }: CabraCountdownProps) {
  const [mode, setMode] = useState<CountdownMode>('days');
  const [now, setNow] = useState(initialNow ?? 0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const sync = () => setNow(Date.now());
    if (!initialNow) sync();
    
    const intervalId = window.setInterval(sync, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [initialNow]);

  const countdown = getCabraCountdown(now);
  const isComplete = countdown.isComplete;
  const primaryValue = isComplete
    ? 'Now live'
    : formatCabraDisplayValue(getCabraPrimaryValue(countdown, mode));
  const summaryRows = MODES.map(option => ({
    ...option,
    value: formatCabraDisplayValue(getCabraPrimaryValue(countdown, option.id)),
  }));
  const supportRows =
    mode === 'days'
      ? [
          { label: 'Hours', value: countdown.hours, testId: 'cabra-hours' },
          { label: 'Minutes', value: countdown.minutes, testId: 'cabra-minutes' },
          { label: 'Seconds', value: countdown.seconds, testId: 'cabra-seconds' },
        ]
      : mode === 'hours'
        ? [
            { label: 'Minutes', value: countdown.minutes, testId: 'cabra-minutes' },
            { label: 'Seconds', value: countdown.seconds, testId: 'cabra-seconds' },
          ]
        : mode === 'minutes'
          ? [{ label: 'Seconds', value: countdown.seconds, testId: 'cabra-seconds' }]
          : [];
  const primarySizeClass = isComplete
    ? 'text-[clamp(3.4rem,10vw,8rem)] uppercase tracking-[-0.04em]'
    : mode === 'days'
      ? 'text-[clamp(6rem,23vw,16rem)] tracking-[-0.09em]'
      : mode === 'hours'
        ? 'text-[clamp(5rem,19vw,12.5rem)] tracking-[-0.09em]'
        : mode === 'minutes'
          ? 'text-[clamp(4.2rem,17vw,10.2rem)] tracking-[-0.09em]'
          : 'text-[clamp(2.85rem,10vw,7.2rem)] tracking-[-0.085em]';
  const supportGridClass =
    supportRows.length === 3 ? 'grid-cols-3' : supportRows.length === 2 ? 'grid-cols-2' : 'grid-cols-1';

  function handleModeChange(nextMode: CountdownMode) {
    if (nextMode === mode) return;
    startTransition(() => {
      setMode(nextMode);
    });
  }

  return (
    <section className="mx-auto flex h-full min-h-0 max-w-[1440px] flex-col overflow-hidden box-border px-4 py-3 sm:px-6 sm:py-5 lg:px-12 lg:py-8">
      <motion.div
        className="grid h-full min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden sm:gap-5"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.65, ease: SWISS_EASE }}
      >
        <header className="border border-black/12 bg-[#f7f2e8] px-5 py-4 lg:px-12 lg:py-5">
          <h1
            data-testid="cabra-title"
            className="text-[0.88rem] font-semibold uppercase tracking-[0.15em] text-[#454038] sm:text-[1.2rem] sm:tracking-[0.2em] lg:text-[2.1rem] lg:tracking-[0.22em]"
          >
            {isComplete ? (
              'Now live'
            ) : (
              <>
                <span className="whitespace-nowrap">Total {mode}</span>{' '}
                <span className="ml-[0.22em] whitespace-nowrap">remaining</span>
              </>
            )}
          </h1>
        </header>

        <div className="grid min-h-0 flex-1 gap-px overflow-hidden border border-black/12 bg-black/12 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid min-h-0 bg-[#f6f2e8] p-4 sm:p-5">
            <div
              className={`grid h-full min-h-0 border border-black/10 bg-[#f3efe5] ${
                supportRows.length ? 'grid-rows-[minmax(0,1fr)_auto]' : 'grid-rows-[1fr]'
              }`}
            >
              <div className="grid min-h-0 place-items-center px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isComplete ? 'complete' : mode}
                    className="flex max-w-full flex-col items-center justify-center"
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -12 }}
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.24, ease: SWISS_EASE }}
                  >
                    <span
                      data-testid="cabra-primary-value"
                      className={`max-w-full overflow-hidden text-ellipsis whitespace-nowrap font-mono leading-[0.88] tabular-nums text-[#191816] ${primarySizeClass}`}
                    >
                      {primaryValue}
                    </span>
                  </motion.div>
                </AnimatePresence>
              </div>

              {supportRows.length > 0 && (
                <div className="grid border-t border-black/10 bg-[#f9f6ef] p-4 sm:p-5">
                  <div className={`grid ${supportGridClass} gap-px border border-black/10 bg-black/10`}>
                    {supportRows.map(row => (
                      <div key={row.label} className="bg-[#fcfaf5] px-4 py-4 text-center lg:px-6 lg:py-5">
                        <p className="text-[0.58rem] font-medium uppercase tracking-[0.3em] text-black/48 sm:text-[0.6rem] sm:tracking-[0.34em]">
                          {row.label}
                        </p>
                        <p
                          data-testid={row.testId}
                          className="mt-2 font-mono text-[1.55rem] leading-none tabular-nums tracking-[-0.07em] text-[#191816] sm:text-[2.05rem]"
                        >
                          {row.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="grid min-h-0 grid-cols-2 gap-px overflow-hidden bg-black/12 sm:grid-cols-4 lg:grid-cols-1 lg:grid-rows-4">
            {summaryRows.map(row => {
              const isActive = row.id === mode;
              const valueSizeClass =
                row.id === 'seconds'
                  ? 'text-[1.22rem] sm:text-[1.35rem] lg:text-[2.15rem]'
                  : row.id === 'minutes'
                    ? 'text-[1.3rem] sm:text-[1.45rem] lg:text-[2.25rem]'
                    : row.id === 'hours'
                      ? 'text-[1.38rem] sm:text-[1.55rem] lg:text-[2.35rem]'
                      : 'text-[1.5rem] sm:text-[1.7rem] lg:text-[2.5rem]';

              return (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => handleModeChange(row.id)}
                  aria-pressed={isActive}
                  className={`flex min-h-20 flex-col justify-between px-4 py-4 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 focus-visible:ring-inset lg:min-h-0 lg:px-6 lg:py-5 ${
                    isActive
                      ? 'bg-[#141311] text-[#faf7f0]'
                      : 'bg-[#faf6ee] text-[#191816] hover:bg-[#efe8da]'
                  }`}
                >
                  <span
                    className={`text-[0.54rem] font-medium uppercase tracking-[0.26em] sm:text-[0.56rem] sm:tracking-[0.28em] lg:text-[0.62rem] lg:tracking-[0.32em] ${
                      isActive ? 'text-white/70' : 'text-black/50'
                    }`}
                  >
                    {row.label}
                  </span>

                  <span className={`font-mono leading-none tracking-[-0.08em] tabular-nums ${valueSizeClass}`}>
                    {row.value}
                  </span>
                </button>
              );
            })}
          </aside>
        </div>
      </motion.div>
    </section>
  );
}