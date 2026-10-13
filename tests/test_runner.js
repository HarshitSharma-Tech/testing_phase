// ============================================================
// VINTAGE FINVEST — UNIFIED TEST RUNNER & QA HARNESS
// Executes both Financial Calculator and Real NAV / API suites,
// aggregates test metrics, and exports structured results.
// ============================================================

import { runFinancialTests, financialTestRegistry } from './test_financial_calculators.js';
import { runNavAndModeTests, navTestRegistry } from './test_nav_and_modes.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const startTime = Date.now();
  console.log('======================================================================');
  console.log('🚀 VINTAGE FINVEST QA TEST HARNESS: CALCULATOR VALIDATION SUITE');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('Environment: Node.js ES Modules | Zero External Dependencies');
  console.log('======================================================================');

  // 1. Run Financial Test Suite
  runFinancialTests();

  // 2. Run Real NAV and API Test Suite
  await runNavAndModeTests();

  // 3. Aggregate all results
  const allTests = [...financialTestRegistry, ...navTestRegistry];

  const total = allTests.length;
  const passed = allTests.filter(t => t.status === 'Pass').length;
  const failed = allTests.filter(t => t.status === 'Fail').length;
  const blocked = allTests.filter(t => t.status === 'Blocked').length;
  const notRun = allTests.filter(t => t.status === 'Not Run').length;

  console.log('\n======================================================================');
  console.log('TEST EXECUTION SUMMARY:');
  console.log('======================================================================');
  console.log(`  Total Test Cases Defined:   ${total}`);
  console.log(`  Executed:                   ${passed + failed}`);
  console.log(`  ✓ Passed:                   ${passed}`);
  console.log(`  ✗ Failed:                   ${failed}`);
  console.log(`  ⊘ Blocked:                  ${blocked}`);
  console.log(`  ⏸ Not Run:                  ${notRun}`);
  console.log(`  Pass Rate:                  ${((passed / total) * 100).toFixed(1)}%`);
  console.log(`  Execution Time:             ${Date.now() - startTime}ms`);
  console.log('======================================================================\n');

  // Group by module
  const modules = {};
  allTests.forEach(t => {
    if (!modules[t.module]) modules[t.module] = { total: 0, passed: 0, failed: 0 };
    modules[t.module].total++;
    if (t.status === 'Pass') modules[t.module].passed++;
    if (t.status === 'Fail') modules[t.module].failed++;
  });

  console.log('MODULE-BY-MODULE BREAKDOWN:');
  console.log('----------------------------------------------------------------------');
  Object.keys(modules).forEach(mod => {
    const stats = modules[mod];
    const icon = stats.failed === 0 ? '✓' : '✗';
    console.log(`  ${icon} ${mod.padEnd(38)}: ${stats.passed}/${stats.total} Passed (${((stats.passed/stats.total)*100).toFixed(0)}%)`);
  });
  console.log('----------------------------------------------------------------------\n');

  // Export full JSON results for documentation generation
  const outputPath = path.join(__dirname, 'test_results.json');
  fs.writeFileSync(outputPath, JSON.stringify(allTests, null, 2), 'utf-8');
  console.log(`✓ Structured test results exported to: ${outputPath}\n`);

  if (failed > 0) {
    console.error(`🚨 SUITE FAILED: ${failed} tests failed.`);
    process.exit(1);
  } else {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Ready for production deployment.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Exception:', err);
  process.exit(1);
});
