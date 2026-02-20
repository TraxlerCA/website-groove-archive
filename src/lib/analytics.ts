type Primitive = string | number | boolean;
export type AnalyticsProps = Record<string, Primitive | null | undefined>;

type WindowAnalytics = Window & {
  plausible?: (event: string, options?: { props?: Record<string, Primitive> }) => void;
  va?: { track?: (event: string, properties?: Record<string, Primitive>) => void };
};

function sanitizeProps(
  props: AnalyticsProps | undefined,
): Record<string, Primitive> | undefined {
  if (!props) return undefined;
  const next = Object.entries(props).reduce<Record<string, Primitive>>((acc, [key, value]) => {
    if (value === null || value === undefined) return acc;
    acc[key] = value;
    return acc;
  }, {});
  return Object.keys(next).length > 0 ? next : undefined;
}

export function trackEvent(event: string, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return;
  const payload = sanitizeProps(props);
  const win = window as WindowAnalytics;

  try {
    if (typeof win.plausible === 'function') {
      if (payload) win.plausible(event, { props: payload });
      else win.plausible(event);
    }
  } catch {
    // no-op
  }

  try {
    if (win.va && typeof win.va.track === 'function') {
      win.va.track(event, payload);
    }
  } catch {
    // no-op
  }
}

export function stableHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 33) ^ value.charCodeAt(index);
  }
  return Math.abs(hash >>> 0).toString(16);
}
