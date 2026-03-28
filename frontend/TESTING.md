# Frontend Testing

## Automated Checks

- `npm test` runs the lightweight Node-based smoke tests.
- `npm run test:e2e` runs Playwright browser E2E against mocked APIs.
- `npm run test:visual` runs Playwright visual regression checks using desktop screenshots.
- `npm run test:visual:update` refreshes the visual baselines after an intentional UI change.

## Visual Review Workflow

Use browser E2E and screenshot tests for day-to-day regression coverage.

For manual design review, open the same route in Chrome DevTools MCP and inspect:

- layout spacing
- overflow and clipping
- color/contrast balance
- loading and interaction states

When the UI changes intentionally, update the screenshots first, then rerun the visual suite to confirm the new baseline is stable.
