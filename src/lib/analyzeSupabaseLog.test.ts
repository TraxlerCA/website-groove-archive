import { describe, expect, it } from 'vitest';

import { normalizeLog, triage } from '../../scripts/analyze-supabase-log.mjs';

const sampleEvent = {
  metadata: [
    {
      request: [
        {
          method: 'GET',
          path: '/rest/v1/genres',
          search: '?select=label%2Cexplanation',
          cf: [
            {
              country: 'US',
              city: 'Ashburn',
              asn: 14618,
              asOrganization: 'Amazon Technologies Inc.',
              tlsVersion: 'TLSv1.3',
              botManagement: [{ score: 1, verifiedBot: false, jsDetection: [{ passed: false }] }],
            },
          ],
          headers: [{ cf_connecting_ip: '52.23.242.31', user_agent: 'node' }],
          sb: [{ apikey: [{ apikey: [{ prefix: 'sb_publishable_GatT8' }] }] }],
        },
      ],
      response: [{ status_code: 200, origin_time: 325, headers: [{ sb_request_id: 'req_123' }] }],
    },
  ],
  timestamp: '2026-03-13T09:33:09.738000',
};

describe('analyze-supabase-log', () => {
  it('normalizes key log fields', () => {
    const summary = normalizeLog(sampleEvent);

    expect(summary).toMatchObject({
      method: 'GET',
      path: '/rest/v1/genres',
      status: 200,
      userAgent: 'node',
      botScore: 1,
      apiKeyPrefix: 'sb_publishable_GatT8',
    });
  });

  it('supports nested JSON string input', () => {
    const summary = normalizeLog(JSON.stringify(JSON.stringify(sampleEvent)));
    expect(summary.path).toBe('/rest/v1/genres');
  });

  it('produces elevated risk for likely automated request', () => {
    const report = triage(normalizeLog(sampleEvent));

    expect(report.riskLevel).toBe('elevated');
    expect(report.riskScore).toBeGreaterThanOrEqual(3);
    expect(report.findings.length).toBeGreaterThan(0);
  });
});
