# Conditional Home/Map Performance Task

Issue: #31

This task should only be executed when we have measurable signs that the home/map experience is slow.

## Trigger Conditions

Start the optimization work only when at least one trigger is true:

1. RUM or analytics shows mobile `LCP p75 > 3.0s` for `/` for 3 consecutive days.
2. RUM or analytics shows mobile `INP p75 > 200ms` for `/` for 3 consecutive days.
3. We receive at least 3 unique user complaints in 14 days about home/map slowness.
4. Profiled home payload regresses by at least 20% vs. the latest accepted baseline.

If none of the above is true, keep this task in backlog.

## Baseline Capture (Before Changes)

Capture and store these values in the issue before coding:

1. Commit SHA tested.
2. Lighthouse mobile report for `/`:
   - Performance score
   - LCP
   - INP
   - Total Blocking Time
3. DevTools network for first load of `/`:
   - transferred bytes
   - largest JS chunk
   - `/api/sheets` payload size (if present)
4. App behavior checks:
   - map renders zones and markers
   - tooltip opens/closes
   - stage/zone filtering still works

## Optimization Guardrails

When reducing payload, keep map behavior unchanged:

1. Do not remove fields required for map rendering, filtering, or tooltip content.
2. Do not break crate mode, list page, or artist page data assumptions.
3. Keep map interaction parity on desktop and mobile.

## Success Criteria (After Changes)

A change is accepted only if all are true:

1. Payload reduction is measurable (target: >= 20% smaller first-load data/transfer).
2. Lighthouse mobile on `/` is same or better than baseline for LCP and INP.
3. Manual map UX regression checklist passes:
   - initial map render
   - zone hover/tap feedback
   - tooltip correctness
   - filter behavior
4. Unit/e2e and build checks pass.

## Reporting Template

Use this in the issue when the task is executed:

```md
### Trigger Met
- [ ] LCP/INP threshold
- [ ] User complaints threshold
- [ ] Payload regression threshold

### Before
- Commit:
- Lighthouse (mobile): score / LCP / INP / TBT
- Network transfer:
- Largest JS chunk:
- API payload:

### After
- Commit:
- Lighthouse (mobile): score / LCP / INP / TBT
- Network transfer:
- Largest JS chunk:
- API payload:

### UX Regression Checklist
- [ ] Map renders correctly
- [ ] Tooltip behavior unchanged
- [ ] Filters unchanged
- [ ] Mobile interactions unchanged
```
