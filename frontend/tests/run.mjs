import { runAuthFlowTests } from './auth-flow.test.mjs';
import { runRouteSmokeTests } from './route-smoke.test.mjs';

const suites = [
  { name: 'auth-flow', run: runAuthFlowTests },
  { name: 'route-smoke', run: runRouteSmokeTests },
];

let failed = 0;

for (const suite of suites) {
  try {
    await suite.run();
    console.log(`ok ${suite.name}`);
  } catch (error) {
    failed += 1;
    console.error(`fail ${suite.name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exitCode = 1;
} else {
  console.log(`pass ${suites.length}`);
}
