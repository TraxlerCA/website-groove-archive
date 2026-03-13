#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

function first(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parseJsonInput(raw) {
  const parsed = JSON.parse(raw);

  if (typeof parsed === 'string') {
    return JSON.parse(parsed);
  }

  return parsed;
}

export function normalizeLog(raw) {
  const parsed = typeof raw === 'string' ? parseJsonInput(raw) : raw;

  if (Array.isArray(parsed)) {
    throw new Error('Expected a single JSON log event, received an array.');
  }

  const metadata = first(parsed?.metadata);
  const request = first(metadata?.request);
  const response = first(metadata?.response);
  const cf = first(request?.cf);
  const bot = first(cf?.botManagement);
  const headers = first(request?.headers);

  return {
    timestamp: parsed?.timestamp,
    method: request?.method,
    path: request?.path,
    query: request?.search,
    status: response?.status_code,
    originTimeMs: response?.origin_time,
    ip: headers?.cf_connecting_ip ?? headers?.x_real_ip,
    userAgent: headers?.user_agent,
    country: cf?.country,
    city: cf?.city,
    asn: cf?.asn,
    asOrganization: cf?.asOrganization,
    tlsVersion: cf?.tlsVersion,
    botScore: bot?.score,
    verifiedBot: bot?.verifiedBot,
    jsDetectionPassed: first(bot?.jsDetection)?.passed,
    apiKeyPrefix: first(first(first(request?.sb)?.apikey)?.apikey)?.prefix,
    requestId: first(response?.headers)?.sb_request_id,
  };
}

export function triage(summary) {
  const findings = [];
  let riskScore = 0;

  if (summary.botScore !== undefined && summary.botScore <= 5) {
    findings.push('Cloudflare bot score is very low (<= 5). Treat as likely automated traffic.');
    riskScore += 2;
  }

  if (summary.jsDetectionPassed === false) {
    findings.push('JS bot detection did not pass. Request likely came from a non-browser client.');
    riskScore += 1;
  }

  if ((summary.userAgent || '').toLowerCase() === 'node') {
    findings.push('User-Agent is `node`, which usually indicates a scripted fetch.');
    riskScore += 1;
  }

  if ((summary.apiKeyPrefix || '').startsWith('sb_publishable_')) {
    findings.push('Request used a publishable Supabase key. This is expected for public reads if RLS allows it.');
  }

  if (summary.status === 200) {
    findings.push('Request was successful (HTTP 200). If this endpoint should be public, this is normal.');
  }

  const riskLevel = riskScore >= 3 ? 'elevated' : riskScore >= 1 ? 'medium' : 'low';

  const recommendations = [
    'Confirm RLS policies on queried tables allow only intended columns/rows.',
    'If scraping volume is a concern, add rate limits (Cloudflare WAF, Supabase API settings, or an app proxy).',
    'Avoid exposing sensitive data in public tables; use RPC or server-side endpoints for protected reads.',
    'Track repeated requests by IP/user-agent/request pattern before blocking to reduce false positives.',
  ];

  return { riskLevel, riskScore, findings, recommendations };
}

export async function readInput(argPath) {
  if (argPath) return readFileSync(argPath, 'utf8');

  if (process.stdin.isTTY) return '';

  const chunks = [];
  process.stdin.setEncoding('utf8');
  return new Promise((resolve, reject) => {
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('').trim()));
    process.stdin.on('error', reject);
  });
}

async function runCli() {
  const argPath = process.argv[2];

  if (argPath === '--help' || argPath === '-h') {
    console.log('Usage: npm run logs:supabase -- <path-to-log.json>');
    console.log('   or: cat event.json | npm run logs:supabase');
    process.exit(0);
  }

  const rawInput = await readInput(argPath);
  if (!rawInput) {
    console.error('Provide a JSON payload via file path or stdin. Use --help for examples.');
    process.exit(1);
  }

  let summary;
  try {
    summary = normalizeLog(rawInput);
  } catch (error) {
    console.error('Failed to parse Supabase log JSON:', error.message);
    process.exit(1);
  }

  const report = triage(summary);
  console.log(JSON.stringify({ summary, ...report }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runCli();
}
