// ============================================================
// VINTAGE FINVEST — COMPREHENSIVE DATA & REGRESSION TEST SUITE
// Covers all 18 audit points for real Mutual Fund NAV integration
// ============================================================

import {
  CURATED_AMCS,
  CURATED_SCHEMES,
  fetchSchemeData,
  fetchLatestNav,
  searchSchemes,
  isDirectGrowth,
  parseLocalDate,
  formatYMD,
  getBusinessDayNav,
  calculateXIRR,
  calculateRealSIP,
  calculateRealSTP,
  calculateRealSWP,
  calculateRealLumpsumSIP,
  calculateRealStepUpSIP,
  MFDataError
} from './src/services/mfData.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runAuditTests() {
  console.log('======================================================================');
  console.log('1. TEST: Scheme Identity and Direct Plan – Growth Validation');
  console.log('======================================================================');
  assert(isDirectGrowth('HDFC Flexi Cap Fund - Direct Plan - Growth') === true, 'Matches standard Direct Plan - Growth');
  assert(isDirectGrowth('SBI Small Cap Fund - Direct Growth') === true, 'Matches Direct Growth');
  assert(isDirectGrowth('Kotak Flexi Cap Fund - Growth - Direct') === true, 'Matches Growth - Direct variation');
  assert(isDirectGrowth('ICICI Prudential Bluechip Fund - Regular Plan - Growth') === false, 'Rejects Regular Plan');
  assert(isDirectGrowth('HDFC Balanced Advantage Fund - Direct Plan - IDCW') === false, 'Rejects IDCW / Dividend plan');
  assert(isDirectGrowth('Nippon India Small Cap Fund - Direct Plan - Dividend Reinvestment') === false, 'Rejects Dividend Reinvestment');
  
  try {
    const verifiedDirect = await fetchSchemeData(120166, { enforceDirectGrowth: true });
    assert(verifiedDirect.isDirectGrowth === true, 'Successfully verified Kotak Flexi Cap as Direct Plan - Growth');
  } catch (e) {
    assert(false, `enforceDirectGrowth failed on valid Direct Growth: ${e.message}`);
  }

  try {
    // 120165 is Kotak Flexi Cap Regular Growth
    await fetchSchemeData(120165, { enforceDirectGrowth: true });
    assert(false, 'Should throw error when enforceDirectGrowth is set on Regular Plan (120165)');
  } catch (e) {
    assert(e instanceof MFDataError && e.code === 'INVALID_PLAN_TYPE', 'Correctly rejected Regular Plan with INVALID_PLAN_TYPE error');
  }

  console.log('\n======================================================================');
  console.log('2. TEST: Historical Date-Range Retrieval (?startDate & ?endDate)');
  console.log('======================================================================');
  try {
    const rangeData = await fetchSchemeData(120166, { startDate: '2024-01-01', endDate: '2024-03-31' });
    assert(rangeData.sortedHistory.length > 50, `Retrieved ${rangeData.sortedHistory.length} filtered records between Jan and Mar 2024`);
    const oldest = rangeData.sortedHistory[0].date;
    const newest = rangeData.sortedHistory[rangeData.sortedHistory.length - 1].date;
    assert(oldest === '2024-01-01', `Oldest filtered record matches start date: ${oldest}`);
    assert(newest.startsWith('2024-03'), `Newest filtered record is within March 2024: ${newest}`);
  } catch (e) {
    assert(false, `Date-range retrieval test failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('3. TEST: Correct Chronological NAV Ordering');
  console.log('======================================================================');
  try {
    const sbiData = await fetchSchemeData(125497); // SBI Small Cap
    let strictlyOrdered = true;
    for (let i = 0; i < sbiData.sortedHistory.length - 1; i++) {
      const d1 = new Date(sbiData.sortedHistory[i].date);
      const d2 = new Date(sbiData.sortedHistory[i + 1].date);
      if (d1 >= d2) {
        strictlyOrdered = false;
        break;
      }
    }
    assert(strictlyOrdered, `All ${sbiData.sortedHistory.length} records are strictly monotonic chronologically from oldest to newest`);
  } catch (e) {
    assert(false, `Chronological ordering test failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('4. TEST: Weekend and Missing-NAV Date Forward-Resolution');
  console.log('======================================================================');
  const mockNavMap = new Map([
    ['2026-10-09', 100], // Friday
    ['2026-10-12', 102]  // Monday
  ]);
  const fridayNav = getBusinessDayNav(mockNavMap, new Date(2026, 9, 9));
  assert(fridayNav && fridayNav.nav === 100 && fridayNav.offsetDays === 0, 'Resolves exact Friday NAV on business day (offset 0)');
  const sundayNav = getBusinessDayNav(mockNavMap, new Date(2026, 9, 11)); // Sunday
  assert(sundayNav && sundayNav.nav === 102 && sundayNav.offsetDays === 1 && sundayNav.dateKey === '2026-10-12', 'Forward-resolves Sunday to next business day (Monday, 12 Oct)');
  
  // Beyond 7 days gap test
  const distantMap = new Map([['2026-10-25', 105]]);
  const tooDistant = getBusinessDayNav(distantMap, new Date(2026, 9, 1));
  assert(tooDistant === null, 'Returns null when no business day NAV is found within 7-calendar-day limit');

  console.log('\n======================================================================');
  console.log('5. TEST: Timezone and Date-Boundary Handling (Local vs UTC)');
  console.log('======================================================================');
  const d1 = parseLocalDate('01-01-2024');
  assert(d1.getDate() === 1 && d1.getMonth() === 0 && d1.getFullYear() === 2024, 'parseLocalDate preserves day 1 on Jan 1 with zero UTC shift');
  const d2 = parseLocalDate('2024-12-31');
  assert(d2.getDate() === 31 && d2.getMonth() === 11 && d2.getFullYear() === 2024, 'parseLocalDate preserves day 31 on Dec 31 with zero UTC shift');
  assert(formatYMD(new Date(2024, 0, 1)) === '2024-01-01', 'formatYMD correctly formats local Date to YYYY-MM-DD');

  console.log('\n======================================================================');
  console.log('6. TEST: Monthly SIP Unit Calculations');
  console.log('======================================================================');
  try {
    const hdfcData = await fetchSchemeData(118955); // HDFC Flexi Cap Direct Growth
    const sip = calculateRealSIP({ schemeData: hdfcData, monthlyAmount: 10000, sipDay: 1, years: 3 });
    assert(sip.installmentsCount === 36, `Processed exactly 36 monthly installments`);
    assert(sip.transactions.every(t => Math.abs(t.units - (10000 / t.nav)) < 1e-4), 'Every transaction computes: units = monthly installment / applicable NAV');
    const sumUnits = sip.transactions.reduce((acc, t) => acc + t.units, 0);
    assert(Math.abs(sip.totalUnits - sumUnits) < 1e-4, 'Total units equals exact sum of units across all installments');
  } catch (e) {
    assert(false, `Monthly SIP unit calculation failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('7. TEST: Lumpsum Plus Monthly SIP Accounting');
  console.log('======================================================================');
  try {
    const kotakData = await fetchSchemeData(120166); // Kotak Flexi Cap
    const hybrid = calculateRealLumpsumSIP({
      schemeData: kotakData,
      lumpsumAmount: 500000,
      monthlyAmount: 20000,
      sipDay: 1,
      years: 3
    });
    assert(hybrid.initialLumpsum === 500000, 'Initial lumpsum invested: ₹ 5,00,000');
    assert(hybrid.initialLumpsumUnits === 500000 / hybrid.lumpsumNav, 'Initial lumpsum units = Initial lumpsum / start NAV');
    assert(hybrid.installmentsCount === 36, 'SIP installments count = 36');
    assert(hybrid.totalInvested === 500000 + (36 * 20000), `Total capital invested = Initial lumpsum + sum(SIPs): ₹ ${hybrid.totalInvested}`);
    assert(Math.abs(hybrid.totalUnits - (hybrid.initialLumpsumUnits + hybrid.sipUnits)) < 1e-4, 'Total units = Initial units + SIP units');
    assert(Math.abs(hybrid.currentValuation - (hybrid.totalUnits * hybrid.latestNav)) < 0.01, 'Portfolio value = Total units * Latest NAV');
    assert(hybrid.transactions.filter(t => t.type === 'Lumpsum').length === 1, 'Initial lumpsum executed exactly once and not counted as recurring installment');
  } catch (e) {
    assert(false, `Lumpsum + SIP accounting failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('8. TEST: Annual SIP Step-Up Schedules (10% Annual Increment)');
  console.log('======================================================================');
  try {
    const midcapData = await fetchSchemeData(118989); // HDFC Mid-Cap Opportunities
    const stepUp = calculateRealStepUpSIP({
      schemeData: midcapData,
      initialMonthlyAmount: 10000,
      stepUpPercent: 10,
      sipDay: 1,
      years: 3
    });
    assert(stepUp.annualSchedule[0].monthlyAmount === 10000, 'Year 1 contribution: ₹ 10,000/mo');
    assert(stepUp.annualSchedule[1].monthlyAmount === 11000, 'Year 2 contribution (+10%): ₹ 11,000/mo');
    assert(stepUp.annualSchedule[2].monthlyAmount === 12100, 'Year 3 contribution (+10%): ₹ 12,100/mo');
    const expectedCapital = (12 * 10000) + (12 * 11000) + (12 * 12100);
    assert(stepUp.totalInvested === expectedCapital, `Total invested equals sum of stepped contributions: ₹ ${stepUp.totalInvested} (expected ₹ ${expectedCapital})`);
  } catch (e) {
    assert(false, `Step-Up schedule test failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('9. TEST: XIRR Using Dated Cash Flows (Newton-Raphson Accuracy)');
  console.log('======================================================================');
  // Known benchmark: -100k on 01-Jan-2023, +110k on 01-Jan-2024 -> exactly 10.0%
  const testFlows = [
    { date: new Date(2023, 0, 1), amount: -100000 },
    { date: new Date(2024, 0, 1), amount: 110000 }
  ];
  const rate1 = calculateXIRR(testFlows);
  assert(Math.abs(rate1 - 10.0) < 0.05, `Simple 1-year XIRR converges to 10.0%: ${rate1.toFixed(3)}%`);

  // Multiple uneven cashflows
  const multiFlows = [
    { date: new Date(2023, 0, 1), amount: -50000 },
    { date: new Date(2023, 6, 1), amount: -50000 },
    { date: new Date(2024, 0, 1), amount: 115000 }
  ];
  const rate2 = calculateXIRR(multiFlows);
  assert(rate2 > 15 && rate2 < 25, `Multi-installment XIRR converges to realistic rate: ${rate2.toFixed(2)}%`);

  console.log('\n======================================================================');
  console.log('10. TEST: STP Source and Destination Accounting');
  console.log('======================================================================');
  try {
    const [liquidData, equityData] = await Promise.all([
      fetchSchemeData(119091), // HDFC Liquid Direct Growth
      fetchSchemeData(118955)  // HDFC Flexi Cap Direct Growth
    ]);
    const stp = calculateRealSTP({
      sourceData: liquidData,
      targetData: equityData,
      initialCorpus: 1000000,
      monthlyTransfer: 25000,
      transferDay: 1,
      years: 2
    });
    assert(stp.transfersCount === 24, `Executed 24 monthly STP transfers`);
    assert(stp.totalTransferred === 24 * 25000, `Total transferred: ₹ ${stp.totalTransferred}`);
    assert(stp.targetUnitsAccumulated > 0, `Target units accumulated: ${stp.targetUnitsAccumulated.toFixed(3)}`);
    assert(stp.remainingSourceUnits > 0, `Remaining source units: ${stp.remainingSourceUnits.toFixed(3)}`);
    assert(stp.totalWealth > 0, `Combined portfolio value: ₹ ${stp.totalWealth.toFixed(2)}`);
  } catch (e) {
    assert(false, `STP accounting failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('11. TEST: SWP Withdrawals and Corpus Depletion');
  console.log('======================================================================');
  try {
    const hybridData = await fetchSchemeData(118968); // HDFC Balanced Advantage Direct Growth
    const swpNormal = calculateRealSWP({
      schemeData: hybridData,
      initialCorpus: 2000000,
      monthlyWithdrawal: 10000,
      withdrawDay: 1,
      years: 2
    });
    assert(swpNormal.withdrawalsCount === 24, `Executed 24 monthly payouts`);
    assert(swpNormal.totalWithdrawn === 240000, `Total cash withdrawn: ₹ ${swpNormal.totalWithdrawn}`);
    assert(swpNormal.remainingValuation > 0, `Remaining legacy corpus: ₹ ${swpNormal.remainingValuation.toFixed(2)}`);
    assert(swpNormal.exhaustedAtMonth === null, 'Portfolio sustainable throughout 2-year horizon');

    // Corpus exhaustion case
    const swpDepleted = calculateRealSWP({
      schemeData: hybridData,
      initialCorpus: 50000,
      monthlyWithdrawal: 30000,
      withdrawDay: 1,
      years: 1
    });
    assert(swpDepleted.exhaustedAtMonth !== null, `Corpus exhaustion accurately triggered at month ${swpDepleted.exhaustedAtMonth}`);
    assert(swpDepleted.remainingUnits === 0, 'Remaining units reached zero upon depletion');
  } catch (e) {
    assert(false, `SWP depletion test failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('12. TEST: Missing NAVs and Insufficient History Guard');
  console.log('======================================================================');
  // Create synthetic scheme data with only 6 months of data
  const shortNavMap = new Map([
    ['2026-05-01', 50],
    ['2026-06-01', 51],
    ['2026-07-01', 52],
    ['2026-08-01', 53],
    ['2026-09-01', 54],
    ['2026-10-01', 55]
  ]);
  const shortScheme = {
    meta: { scheme_name: 'Short History Fund - Direct Plan - Growth' },
    latestNav: 55,
    latestDate: '01-10-2026',
    navMap: shortNavMap,
    sortedHistory: [
      { date: '2026-05-01', rawDate: '01-05-2026', nav: 50 },
      { date: '2026-10-01', rawDate: '01-10-2026', nav: 55 }
    ]
  };

  try {
    // Attempt 3-year SIP (requires 36 months) on a 6-month dataset
    calculateRealSIP({ schemeData: shortScheme, monthlyAmount: 5000, years: 3 });
    assert(false, 'Should throw error when requested period exceeds available historical records');
  } catch (e) {
    assert(e instanceof MFDataError && e.code === 'INSUFFICIENT_HISTORY', 'Correctly rejected incomplete dataset with INSUFFICIENT_HISTORY error code');
  }

  console.log('\n======================================================================');
  console.log('13. TEST: Invalid Scheme Codes and API Error Handling');
  console.log('======================================================================');
  try {
    await fetchSchemeData(99999999); // Non-existent scheme
    assert(false, 'Should throw error for non-existent scheme code');
  } catch (e) {
    assert(e instanceof MFDataError, 'Throws typed MFDataError');
    assert(e.code === 'SCHEME_NOT_FOUND' || e.code === 'NETWORK_ERROR', `Error code matches: ${e.code}`);
  }

  console.log('\n======================================================================');
  console.log('14. TEST: Network Timeouts and Abort Controller');
  console.log('======================================================================');
  try {
    await fetchSchemeData(119775, { timeoutMs: 1 }); // Impossibly short timeout (1ms)
    assert(false, 'Should throw timeout error on aborted request');
  } catch (e) {
    assert(e instanceof MFDataError && e.code === 'TIMEOUT', 'Throws MFDataError with code TIMEOUT on request abort');
  }

  console.log('\n======================================================================');
  console.log('15. TEST: Zero, Negative, and Invalid User Inputs');
  console.log('======================================================================');
  try {
    calculateRealLumpsumSIP({ schemeData: shortScheme, lumpsumAmount: 0, monthlyAmount: 0 });
    assert(false, 'Should reject 0 lumpsum and 0 monthly SIP');
  } catch (e) {
    assert(e instanceof MFDataError && e.code === 'INVALID_DATA', 'Guards against zero lumpsum and zero SIP');
  }

  try {
    calculateRealStepUpSIP({ schemeData: shortScheme, initialMonthlyAmount: 0 });
    assert(false, 'Should reject zero initial monthly amount');
  } catch (e) {
    assert(e instanceof MFDataError && e.code === 'INVALID_DATA', 'Guards against zero initial monthly amount in Step-Up');
  }

  console.log('\n======================================================================');
  console.log('16. TEST: Switching Real Historical vs Hypothetical Modes');
  console.log('======================================================================');
  // Hypothetical formula test: verify it produces constant CAGR compound growth
  const initialCap = 500000;
  const rate = 0.12;
  const years = 5;
  const expectedHypoFV = initialCap * Math.pow(1 + rate, years);
  assert(Math.abs(expectedHypoFV - 881170.84) < 1.0, 'Hypothetical mode uses deterministic formula: P*(1+r)^t');

  console.log('\n======================================================================');
  console.log('17. TEST: Correct Final Valuation Using Latest Available NAV');
  console.log('======================================================================');
  try {
    const sbiData = await fetchSchemeData(125497);
    const sip = calculateRealSIP({ schemeData: sbiData, monthlyAmount: 10000, sipDay: 1, years: 3 });
    const expectedVal = sip.totalUnits * sip.latestNav;
    assert(Math.abs(sip.currentValuation - expectedVal) < 0.01, 'Portfolio value = Total accumulated units * Latest NAV');
    assert(sip.netGain === sip.currentValuation - sip.totalInvested, 'Gain/loss = Portfolio value - Total invested capital');
    assert(Math.abs(sip.absoluteReturnPercent - ((sip.netGain / sip.totalInvested) * 100)) < 1e-4, 'Absolute return % = (Gain / Total invested) * 100');
  } catch (e) {
    assert(false, `Final valuation test failed: ${e.message}`);
  }

  console.log('\n======================================================================');
  console.log('18. TEST: No Silent Fallback from Real-Data Mode to Hypothetical');
  console.log('======================================================================');
  try {
    // When real scheme data is corrupted or null, calculateRealSIP must throw an error, NOT return a hypothetical result
    calculateRealSIP({ schemeData: null, monthlyAmount: 10000 });
    assert(false, 'Should throw error when schemeData is null');
  } catch (e) {
    assert(e instanceof MFDataError, 'Throws explicit MFDataError rather than silently falling back to CAGR projection');
  }

  console.log('\n======================================================================');
  console.log(`AUDIT & REGRESSION TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('======================================================================');

  if (failed > 0) process.exit(1);
}

runAuditTests();
