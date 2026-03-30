import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseConfig =
  | {
      enabled: true;
      key: string;
      reason: null;
      url: string;
    }
  | {
      enabled: false;
      key: string | null;
      reason: string;
      url: string | null;
    };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null;

function isPlaceholderValue(value: string | null) {
  if (!value) return true;

  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes('your_supabase_') ||
    normalized.includes('example.supabase.co')
  );
}

function resolveSupabaseConfig(): SupabaseConfig {
  if (isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseKey)) {
    return {
      enabled: false,
      key: supabaseKey,
      reason: 'Supabase env is missing or still using placeholder values.',
      url: supabaseUrl,
    };
  }

  const resolvedUrl = supabaseUrl as string;
  const resolvedKey = supabaseKey as string;

  try {
    const parsedUrl = new URL(resolvedUrl);

    if (parsedUrl.hostname === 'example.supabase.co') {
      return {
        enabled: false,
        key: resolvedKey,
        reason: 'Supabase host is a placeholder domain.',
        url: resolvedUrl,
      };
    }
  } catch {
    return {
      enabled: false,
      key: resolvedKey,
      reason: 'Supabase URL is not a valid absolute URL.',
      url: resolvedUrl,
    };
  }

  return {
    enabled: true,
    key: resolvedKey,
    reason: null,
    url: resolvedUrl,
  };
}

export const supabaseConfig = resolveSupabaseConfig();
export const isSupabaseEnabled = supabaseConfig.enabled;
export const supabaseDisabledReason = supabaseConfig.reason;

export const supabase: SupabaseClient | null = supabaseConfig.enabled
  ? createClient(supabaseConfig.url, supabaseConfig.key)
  : null;
