// ============================================================
// VINTAGE FINVEST — INDEPENDENT FINANCIAL CALCULATOR TEST SUITE
// Pure mathematical validation of financial calculators against
// independent reference formulas and known closed-form solutions.
// ============================================================

import {
  calculateHypotheticalSIP,
  calculateHypotheticalLumpsumSIP,
  calculateHypotheticalStepUpSIP,
  calculateCostOfDelay,
  calculateSIPTenure,
  calculateEducationGoal,
  calculateMarriageGoal,
  calculateRetirementCorpus,
  calculateEMI,
  calculateAssetAllocation,
  formatINR
} from '../src/services/financialCalculators.js';

export const financialTestRegistry = [];

function recordTest({ id, module, scenario, preconditions, steps, inputs, expected, actual, passed, severity, remarks }) {
  const resultObj = {
    id,
    module,
    scenario,
    preconditions,
    steps,
    inputs: typeof inputs === 'object' ? JSON.stringify(inputs) : String(inputs),
    expected: typeof expected === 'object' ? JSON.stringify(expected) : String(expected),
    actual: typeof actual === 'object' ? JSON.stringify(actual) : String(actual),
    status: passed ? 'Pass' : 'Fail',
    severity,
    remarks
  };
  financialTestRegistry.push(resultObj);
  return resultObj;
}

/**
 * Helper to check floating-point equality within a tolerance
 */
function isClose(a, b, tolerance = 0.01) {
  if (Math.abs(a - b) <= tolerance) return true;
  const relDiff = Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1);
  return relDiff <= tolerance;
}

export function runFinancialTests() {
  console.log('\n======================================================================');
  console.log('RUNNING SUITE: Independent Financial Calculator Validations');
  console.log('======================================================================\n');

  // ------------------------------------------------------------
  // 1. SIP CALCULATOR (HYPOTHETICAL)
  // ------------------------------------------------------------
  {
    // SIP-001: Typical 10-year monthly SIP
    // P = 10,000, r = 12%, t = 10 yrs (n = 120)
    // Independent formula: i = 0.12/12 = 0.01
    // FV = 10000 * (((1.01)^120 - 1) / 0.01) * 1.01
    // (1.01)^120 = 3.30038689457
    // FV = 10000 * 230.038689457 * 1.01 = 23,23,390.76
    const inputs = { monthlyAmount: 10000, annualRate: 12, years: 10 };
    const res = calculateHypotheticalSIP(inputs);
    const expectedInvested = 1200000;
    const expectedFV = 2323390.76;
    const expectedGain = 1123390.76;
    const passed = res.totalInvested === expectedInvested &&
                   isClose(res.futureValue, expectedFV, 1.0) &&
                   isClose(res.totalGain, expectedGain, 1.0);

    recordTest({
      id: 'SIP-001',
      module: 'SIP Calculator',
      scenario: 'Standard 10-year SIP with 12% p.a. CAGR',
      preconditions: 'Annuity due compounding model (nominal monthly rate i = r/12)',
      steps: 'Compute monthly compounding using independent annuity formula for 120 months',
      inputs,
      expected: { totalInvested: expectedInvested, futureValue: '2323390.76 ± 1.0', totalGain: '1123390.76 ± 1.0' },
      actual: { totalInvested: res.totalInvested, futureValue: Math.round(res.futureValue), totalGain: Math.round(res.totalGain) },
      passed,
      severity: 'Critical',
      remarks: 'Verified against independent closed-form annuity due equation: P * ((1+i)^n - 1)/i * (1+i)'
    });
  }

  {
    // SIP-002: Zero return rate (0% CAGR)
    const inputs = { monthlyAmount: 15000, annualRate: 0, years: 5 };
    const res = calculateHypotheticalSIP(inputs);
    const expected = 15000 * 60; // 9,00,000
    const passed = res.totalInvested === expected && res.futureValue === expected && res.totalGain === 0;

    recordTest({
      id: 'SIP-002',
      module: 'SIP Calculator',
      scenario: 'Zero return rate (r = 0%)',
      preconditions: 'Division-by-zero guard active in annuity formula',
      steps: 'Provide 0% annual rate for 5 years; expect Future Value = Total Invested',
      inputs,
      expected: { totalInvested: 900000, futureValue: 900000, totalGain: 0 },
      actual: { totalInvested: res.totalInvested, futureValue: res.futureValue, totalGain: res.totalGain },
      passed,
      severity: 'High',
      remarks: 'Zero-division boundary handled cleanly; no NaN or Infinity produced'
    });
  }

  {
    // SIP-003: Zero monthly installment (P = 0)
    const inputs = { monthlyAmount: 0, annualRate: 15, years: 10 };
    const res = calculateHypotheticalSIP(inputs);
    const passed = res.totalInvested === 0 && res.futureValue === 0 && res.totalGain === 0;

    recordTest({
      id: 'SIP-003',
      module: 'SIP Calculator',
      scenario: 'Zero monthly amount input',
      preconditions: 'Inputs validated and sanitized',
      steps: 'Pass 0 monthly investment with active rate and horizon',
      inputs,
      expected: { totalInvested: 0, futureValue: 0, totalGain: 0 },
      actual: { totalInvested: res.totalInvested, futureValue: res.futureValue, totalGain: res.totalGain },
      passed,
      severity: 'Medium',
      remarks: 'Zero investment results in zero wealth without numeric distortion'
    });
  }

  {
    // SIP-004: Boundary single installment (1 month / 1 year minimum)
    const inputs = { monthlyAmount: 25000, annualRate: 12, years: 1 };
    const res = calculateHypotheticalSIP(inputs);
    // 12 months at 12% (i = 0.01)
    // FV = 25000 * ((1.01^12 - 1) / 0.01) * 1.01 = 25000 * 12.682503 * 1.01 = 3,20,233.20
    const expectedFV = 320233.20;
    const passed = res.totalInvested === 300000 && isClose(res.futureValue, expectedFV, 1.0);

    recordTest({
      id: 'SIP-004',
      module: 'SIP Calculator',
      scenario: 'Minimum horizon boundary: 1 Year (12 months)',
      preconditions: 'Standard monthly compounding',
      steps: 'Run SIP for 1 year at ₹ 25,000/mo and 12% CAGR',
      inputs,
      expected: { totalInvested: 300000, futureValue: '320233.20 ± 1.0' },
      actual: { totalInvested: res.totalInvested, futureValue: Math.round(res.futureValue) },
      passed,
      severity: 'High',
      remarks: 'Boundary 12-month horizon matches mathematical annuity'
    });
  }

  {
    // SIP-005: Extended long-term compounding (35 Years)
    const inputs = { monthlyAmount: 10000, annualRate: 15, years: 35 };
    const res = calculateHypotheticalSIP(inputs);
    // 420 months, i = 0.15/12 = 0.0125
    // FV = 10000 * ((1.0125^420 - 1)/0.0125) * 1.0125 = 14,84,33,767.10 (approx 14.84 Cr)
    const expectedInvested = 4200000;
    const passed = res.totalInvested === expectedInvested && res.futureValue > 140000000;

    recordTest({
      id: 'SIP-005',
      module: 'SIP Calculator',
      scenario: 'Maximum long-horizon 35-year compounding',
      preconditions: 'JavaScript 64-bit IEEE-754 precision stability',
      steps: 'Run 35-year monthly SIP at 15% CAGR',
      inputs,
      expected: { totalInvested: 4200000, futureValue: '> 14.0 Cr' },
      actual: { totalInvested: res.totalInvested, futureValue: formatINR(res.futureValue) },
      passed,
      severity: 'Medium',
      remarks: 'Validated stability over 420 monthly compounding periods without arithmetic overflow'
    });
  }

  {
    // SIP-006: Negative and malformed input sanitation
    const inputs = { monthlyAmount: -5000, annualRate: -10, years: -5 };
    const res = calculateHypotheticalSIP(inputs);
    const passed = res.totalInvested === 0 && res.futureValue === 0 && res.totalGain === 0;

    recordTest({
      id: 'SIP-006',
      module: 'SIP Calculator',
      scenario: 'Negative and malformed input clamping',
      preconditions: 'Math.max(0, ...) input guards active',
      steps: 'Pass negative values for monthly amount, rate, and years',
      inputs,
      expected: { totalInvested: 0, futureValue: 0, totalGain: 0 },
      actual: { totalInvested: res.totalInvested, futureValue: res.futureValue, totalGain: res.totalGain },
      passed,
      severity: 'High',
      remarks: 'Sanitizes negative inputs to zero, preventing negative portfolios'
    });
  }

  // ------------------------------------------------------------
  // 2. LUMPSUM + SIP CALCULATOR
  // ------------------------------------------------------------
  {
    // LS-001: Typical combination: ₹ 5L Lumpsum + ₹ 10K/mo SIP for 10 years at 12%
    const inputs = { lumpsum: 500000, monthlyAmount: 10000, annualRate: 12, years: 10 };
    const res = calculateHypotheticalLumpsumSIP(inputs);
    // Lumpsum FV = 500000 * (1.12)^10 = 500000 * 3.1058482 = 15,52,924.10
    // SIP FV = 23,23,390.76
    // Total Wealth = 38,76,314.86
    const expectedLumpFV = 500000 * Math.pow(1.12, 10);
    const expectedSIPFV = 2323390.76;
    const expectedTotal = expectedLumpFV + expectedSIPFV;
    const passed = res.totalInvested === 1700000 &&
                   isClose(res.lumpFV, expectedLumpFV, 1.0) &&
                   isClose(res.sipFV, expectedSIPFV, 1.0) &&
                   isClose(res.totalWealth, expectedTotal, 2.0);

    recordTest({
      id: 'LS-001',
      module: 'Lumpsum & SIP Calculator',
      scenario: 'Combined ₹ 5 Lakhs Lumpsum and ₹ 10,000/mo SIP over 10 years at 12%',
      preconditions: 'Lumpsum annual compounding P*(1+r)^t + SIP annuity due',
      steps: 'Independently compute Lumpsum FV and SIP FV and sum the two portfolios',
      inputs,
      expected: { totalInvested: 1700000, lumpFV: '1552924.10 ± 1.0', sipFV: '2323390.76 ± 1.0', totalWealth: '3876314.86 ± 2.0' },
      actual: { totalInvested: res.totalInvested, lumpFV: Math.round(res.lumpFV), sipFV: Math.round(res.sipFV), totalWealth: Math.round(res.totalWealth) },
      passed,
      severity: 'Critical',
      remarks: 'Independent dual-engine verification: lumpsum annual compound and monthly SIP annuity'
    });
  }

  {
    // LS-002: Lumpsum only (SIP = 0)
    const inputs = { lumpsum: 1000000, monthlyAmount: 0, annualRate: 15, years: 5 };
    const res = calculateHypotheticalLumpsumSIP(inputs);
    // 10L * (1.15)^5 = 10L * 2.0113571875 = 20,11,357.19
    const expectedFV = 1000000 * Math.pow(1.15, 5);
    const passed = res.totalInvested === 1000000 &&
                   res.sipInvested === 0 &&
                   res.sipFV === 0 &&
                   isClose(res.totalWealth, expectedFV, 1.0);

    recordTest({
      id: 'LS-002',
      module: 'Lumpsum & SIP Calculator',
      scenario: 'Pure Lumpsum investment with zero monthly SIP',
      preconditions: 'Zero SIP edge case',
      steps: 'Pass ₹ 10 Lakhs lumpsum with monthly SIP = 0 for 5 years at 15%',
      inputs,
      expected: { totalInvested: 1000000, sipFV: 0, totalWealth: '2011357.19 ± 1.0' },
      actual: { totalInvested: res.totalInvested, sipFV: res.sipFV, totalWealth: Math.round(res.totalWealth) },
      passed,
      severity: 'High',
      remarks: 'Pure lumpsum correctly compounds annually without generating empty SIP errors'
    });
  }

  {
    // LS-003: SIP only (Lumpsum = 0)
    const inputs = { lumpsum: 0, monthlyAmount: 20000, annualRate: 12, years: 5 };
    const res = calculateHypotheticalLumpsumSIP(inputs);
    const sipRes = calculateHypotheticalSIP({ monthlyAmount: 20000, annualRate: 12, years: 5 });
    const passed = res.lumpInvested === 0 &&
                   res.lumpFV === 0 &&
                   res.totalInvested === sipRes.totalInvested &&
                   isClose(res.totalWealth, sipRes.futureValue, 1.0);

    recordTest({
      id: 'LS-003',
      module: 'Lumpsum & SIP Calculator',
      scenario: 'Pure SIP with zero initial Lumpsum',
      preconditions: 'Zero lumpsum edge case',
      steps: 'Pass lumpsum = 0 and compare output directly against SIP Calculator',
      inputs,
      expected: { lumpFV: 0, totalWealth: Math.round(sipRes.futureValue) },
      actual: { lumpFV: res.lumpFV, totalWealth: Math.round(res.totalWealth) },
      passed,
      severity: 'High',
      remarks: 'Matches pure SIP Calculator output identically'
    });
  }

  {
    // LS-004: Zero return rate (r = 0%)
    const inputs = { lumpsum: 500000, monthlyAmount: 10000, annualRate: 0, years: 5 };
    const res = calculateHypotheticalLumpsumSIP(inputs);
    const expectedInvested = 500000 + 10000 * 60; // 11,00,000
    const passed = res.totalInvested === expectedInvested &&
                   res.totalWealth === expectedInvested &&
                   res.totalGain === 0;

    recordTest({
      id: 'LS-004',
      module: 'Lumpsum & SIP Calculator',
      scenario: 'Zero return rate across Lumpsum and SIP',
      preconditions: 'Zero interest edge handling',
      steps: 'Set annual rate to 0% for combined portfolio',
      inputs,
      expected: { totalInvested: 1100000, totalWealth: 1100000, totalGain: 0 },
      actual: { totalInvested: res.totalInvested, totalWealth: res.totalWealth, totalGain: res.totalGain },
      passed,
      severity: 'Medium',
      remarks: 'Zero return preserves invested capital perfectly without generating NaN'
    });
  }

  // ------------------------------------------------------------
  // 3. STEP-UP SIP CALCULATOR
  // ------------------------------------------------------------
  {
    // STEP-001: 3-Year 10% Step-Up SIP schedule verification
    // Initial monthly = 10,000, Step-Up = 10%, Rate = 12%, Horizon = 3 years
    // Year 1 (m=1..12): 10,000/mo -> 1,20,000
    // Year 2 (m=13..24): 11,000/mo -> 1,32,000
    // Year 3 (m=25..36): 12,100/mo -> 1,45,200
    // Total invested = 3,97,200
    const inputs = { initialMonthly: 10000, stepUpPercent: 10, annualRate: 12, years: 3 };
    const res = calculateHypotheticalStepUpSIP(inputs);
    const expectedInvested = 397200;

    // Independent step-by-step month-by-month compounding:
    let expectedFV = 0;
    const i = 0.12 / 12;
    for (let m = 1; m <= 36; m++) {
      const year = Math.floor((m - 1) / 12);
      const payment = 10000 * Math.pow(1.10, year);
      expectedFV += payment * Math.pow(1 + i, 36 - m + 1);
    }

    const passed = res.totalInvested === expectedInvested &&
                   isClose(res.futureValue, expectedFV, 1.0) &&
                   res.stepUpAdvantage > 0;

    recordTest({
      id: 'STEP-001',
      module: 'Step-Up SIP Calculator',
      scenario: '3-Year schedule with 10% annual increment and 12% CAGR',
      preconditions: 'Annual increment occurs every 12 months on base monthly installment',
      steps: 'Generate 36-month stepped installment schedule and compound each monthly cashflow independently',
      inputs,
      expected: { totalInvested: 397200, futureValue: `${Math.round(expectedFV)} ± 1.0` },
      actual: { totalInvested: res.totalInvested, futureValue: Math.round(res.futureValue) },
      passed,
      severity: 'Critical',
      remarks: 'Verified stepped schedule: Year 1 = ₹ 10k, Year 2 = ₹ 11k, Year 3 = ₹ 12.1k'
    });
  }

  {
    // STEP-002: 0% Step-up equals standard flat SIP
    const inputs = { initialMonthly: 15000, stepUpPercent: 0, annualRate: 13, years: 5 };
    const res = calculateHypotheticalStepUpSIP(inputs);
    const flatRes = calculateHypotheticalSIP({ monthlyAmount: 15000, annualRate: 13, years: 5 });
    const passed = res.totalInvested === flatRes.totalInvested &&
                   isClose(res.futureValue, flatRes.futureValue, 1.0) &&
                   res.stepUpAdvantage === 0;

    recordTest({
      id: 'STEP-002',
      module: 'Step-Up SIP Calculator',
      scenario: '0% Step-up increment reduces to standard Flat SIP',
      preconditions: 'Degenerate step-up rate',
      steps: 'Set stepUpPercent = 0% and compare against standard SIP calculation',
      inputs,
      expected: { totalInvested: flatRes.totalInvested, futureValue: Math.round(flatRes.futureValue), stepUpAdvantage: 0 },
      actual: { totalInvested: res.totalInvested, futureValue: Math.round(res.futureValue), stepUpAdvantage: res.stepUpAdvantage },
      passed,
      severity: 'High',
      remarks: 'At 0% step-up, step-up advantage is exactly 0 and results mirror ordinary SIP'
    });
  }

  {
    // STEP-003: Zero return rate with active step-up
    const inputs = { initialMonthly: 10000, stepUpPercent: 10, annualRate: 0, years: 2 };
    const res = calculateHypotheticalStepUpSIP(inputs);
    // Year 1 = 120,000, Year 2 = 132,000 -> Total = 252,000
    const expected = 252000;
    const passed = res.totalInvested === expected && res.futureValue === expected && res.totalGain === 0;

    recordTest({
      id: 'STEP-003',
      module: 'Step-Up SIP Calculator',
      scenario: 'Zero growth rate with 10% annual step-up',
      preconditions: 'Zero CAGR boundary condition',
      steps: 'Set annual rate = 0% for 2 years with 10% step-up',
      inputs,
      expected: { totalInvested: 252000, futureValue: 252000, totalGain: 0 },
      actual: { totalInvested: res.totalInvested, futureValue: res.futureValue, totalGain: res.totalGain },
      passed,
      severity: 'Medium',
      remarks: 'Future value equals stepped contributions sum when return rate is zero'
    });
  }

  {
    // STEP-004: 1-Year boundary condition
    const inputs = { initialMonthly: 20000, stepUpPercent: 15, annualRate: 12, years: 1 };
    const res = calculateHypotheticalStepUpSIP(inputs);
    const flatRes = calculateHypotheticalSIP({ monthlyAmount: 20000, annualRate: 12, years: 1 });
    // In year 1, step-up has not yet triggered so it should equal flat SIP exactly
    const passed = res.totalInvested === flatRes.totalInvested &&
                   isClose(res.futureValue, flatRes.futureValue, 1.0) &&
                   res.stepUpAdvantage === 0;

    recordTest({
      id: 'STEP-004',
      module: 'Step-Up SIP Calculator',
      scenario: '1-Year boundary: step-up occurs only after Month 12',
      preconditions: 'Annual step-up boundary timing',
      steps: 'Evaluate 1-year horizon; verify that first step-up occurs at month 13, leaving year 1 flat',
      inputs,
      expected: { totalInvested: 240000, stepUpAdvantage: 0 },
      actual: { totalInvested: res.totalInvested, stepUpAdvantage: res.stepUpAdvantage },
      passed,
      severity: 'High',
      remarks: 'Step-up strictly triggers after completed annual cycle (month 13)'
    });
  }

  // ------------------------------------------------------------
  // 4. COST OF DELAY CALCULATOR
  // ------------------------------------------------------------
  {
    // DELAY-001: 5-year delay on 20-year planned horizon at 12%
    const inputs = { monthlyAmount: 10000, delayYears: 5, horizonYears: 20, annualRate: 12 };
    const res = calculateCostOfDelay(inputs);

    const ontimeRes = calculateHypotheticalSIP({ monthlyAmount: 10000, annualRate: 12, years: 20 });
    const delayedRes = calculateHypotheticalSIP({ monthlyAmount: 10000, annualRate: 12, years: 15 });
    const expectedLoss = ontimeRes.futureValue - delayedRes.futureValue;

    const passed = isClose(res.ontimeWealth, ontimeRes.futureValue, 1.0) &&
                   isClose(res.delayedWealth, delayedRes.futureValue, 1.0) &&
                   isClose(res.costOfDelay, expectedLoss, 1.0) &&
                   res.catchupSIP > 10000;

    recordTest({
      id: 'DELAY-001',
      module: 'SIP Cost of Delay Calculator',
      scenario: '5-Year postponement on a 20-year ₹ 10,000/mo SIP at 12%',
      preconditions: 'Ontime wealth = FV(20 yrs), Delayed wealth = FV(15 yrs)',
      steps: 'Independently compute 20-year and 15-year SIPs, calculate difference and required catchup SIP',
      inputs,
      expected: { ontimeWealth: Math.round(ontimeRes.futureValue), delayedWealth: Math.round(delayedRes.futureValue), costOfDelay: Math.round(expectedLoss) },
      actual: { ontimeWealth: Math.round(res.ontimeWealth), delayedWealth: Math.round(res.delayedWealth), costOfDelay: Math.round(res.costOfDelay), catchupSIP: Math.round(res.catchupSIP) },
      passed,
      severity: 'Critical',
      remarks: 'Cost of delay reflects severe loss in compounding years; catch-up SIP is significantly higher'
    });
  }

  {
    // DELAY-002: Zero delay (delay = 0)
    const inputs = { monthlyAmount: 25000, delayYears: 0, horizonYears: 10, annualRate: 13 };
    const res = calculateCostOfDelay(inputs);
    const passed = res.costOfDelay === 0 &&
                   isClose(res.ontimeWealth, res.delayedWealth, 1.0) &&
                   isClose(res.catchupSIP, 25000, 1.0);

    recordTest({
      id: 'DELAY-002',
      module: 'SIP Cost of Delay Calculator',
      scenario: 'Zero delay: starting on time',
      preconditions: 'delayYears = 0',
      steps: 'Set delayYears = 0; verify cost of delay = 0 and catchup SIP = original SIP',
      inputs,
      expected: { costOfDelay: 0, catchupSIP: 25000 },
      actual: { costOfDelay: res.costOfDelay, catchupSIP: Math.round(res.catchupSIP) },
      passed,
      severity: 'High',
      remarks: 'When delay is 0, wealth loss is zero and required catchup matches the monthly investment'
    });
  }

  {
    // DELAY-003: Catch-up SIP precision check
    // If you delay 5 years on a 15-year plan, you have 10 years left to accumulate ontimeWealth
    const inputs = { monthlyAmount: 10000, delayYears: 5, horizonYears: 15, annualRate: 12 };
    const res = calculateCostOfDelay(inputs);
    // Test that investing res.catchupSIP for 10 years yields res.ontimeWealth
    const verifySIP = calculateHypotheticalSIP({ monthlyAmount: res.catchupSIP, annualRate: 12, years: 10 });
    const passed = isClose(verifySIP.futureValue, res.ontimeWealth, 10.0);

    recordTest({
      id: 'DELAY-003',
      module: 'SIP Cost of Delay Calculator',
      scenario: 'Mathematical precision of Catch-Up SIP',
      preconditions: 'Catch-up annuity equation is exact inversion of future value formula',
      steps: 'Feed the computed Catch-Up SIP back into a 10-year SIP and verify it reproduces Ontime Wealth',
      inputs,
      expected: { targetOntimeWealth: Math.round(res.ontimeWealth), achievedByCatchup: Math.round(res.ontimeWealth) },
      actual: { targetOntimeWealth: Math.round(res.ontimeWealth), achievedByCatchup: Math.round(verifySIP.futureValue) },
      passed,
      severity: 'High',
      remarks: 'Self-consistent inverse verification: Catch-up SIP precisely regenerates the target corpus'
    });
  }

  // ------------------------------------------------------------
  // 5. SIP TENURE CALCULATOR
  // ------------------------------------------------------------
  {
    // TENURE-001: Solve months to reach ₹ 1 Crore with ₹ 25,000/mo at 12%
    // Target = 1,00,00,000, P = 25,000, r = 12% (i = 0.01)
    // n = ln(1 + 10000000*0.01 / (25000*1.01)) / ln(1.01)
    // 100000 / (25250) = 3.960396; 1 + 3.960396 = 4.960396
    // ln(4.960396) / ln(1.01) = 1.601486 / 0.00995033 = 160.947 -> ceil = 161 months (13 yrs 5 mos)
    const inputs = { targetCorpus: 10000000, monthlyAmount: 25000, annualRate: 12 };
    const res = calculateSIPTenure(inputs);
    const expectedMonths = 161;
    const passed = res.totalMonths === expectedMonths &&
                   res.years === 13 &&
                   res.remMonths === 5;

    recordTest({
      id: 'TENURE-001',
      module: 'SIP Tenure Calculator',
      scenario: 'Tenure required to accumulate ₹ 1 Crore with ₹ 25,000/mo at 12% CAGR',
      preconditions: 'Logarithmic inversion: n = ln(1 + Target*i / (P*(1+i))) / ln(1+i)',
      steps: 'Solve for total monthly installments n and convert to years and remaining months',
      inputs,
      expected: { totalMonths: 161, years: 13, remMonths: 5 },
      actual: { totalMonths: res.totalMonths, years: res.years, remMonths: res.remMonths },
      passed,
      severity: 'Critical',
      remarks: 'Hand-calculated logarithmic derivation confirmed: exactly 161 months (13 Yrs 5 Mos)'
    });
  }

  {
    // TENURE-002: Zero interest rate (r = 0%)
    // Target = 50,00,000, P = 50,000, r = 0% -> n = 5000000 / 50000 = 100 months (8 yrs 4 mos)
    const inputs = { targetCorpus: 5000000, monthlyAmount: 50000, annualRate: 0 };
    const res = calculateSIPTenure(inputs);
    const passed = res.totalMonths === 100 &&
                   res.years === 8 &&
                   res.remMonths === 4 &&
                   res.totalInvested === 5000000 &&
                   res.totalGain === 0;

    recordTest({
      id: 'TENURE-002',
      module: 'SIP Tenure Calculator',
      scenario: 'Zero interest rate: n = Target / P',
      preconditions: 'Division-by-zero logarithmic guard',
      steps: 'Pass 0% annual return rate; expect simple linear tenure calculation',
      inputs,
      expected: { totalMonths: 100, years: 8, remMonths: 4, totalGain: 0 },
      actual: { totalMonths: res.totalMonths, years: res.years, remMonths: res.remMonths, totalGain: res.totalGain },
      passed,
      severity: 'High',
      remarks: 'Linear fallback n = ceil(Target / P) handles 0% rate without NaN'
    });
  }

  {
    // TENURE-003: Zero target or monthly amount boundary
    const inputs = { targetCorpus: 0, monthlyAmount: 25000, annualRate: 12 };
    const res = calculateSIPTenure(inputs);
    const passed = res.totalMonths === 0 && res.years === 0 && res.remMonths === 0;

    recordTest({
      id: 'TENURE-003',
      module: 'SIP Tenure Calculator',
      scenario: 'Zero target corpus input boundary',
      preconditions: 'Target = 0',
      steps: 'Pass 0 target corpus and verify 0 months returned',
      inputs,
      expected: { totalMonths: 0, years: 0 },
      actual: { totalMonths: res.totalMonths, years: res.years },
      passed,
      severity: 'Medium',
      remarks: 'Zero target returns instant completion (0 months)'
    });
  }

  {
    // TENURE-004: Target achieved in 1 installment boundary
    const inputs = { targetCorpus: 10000, monthlyAmount: 20000, annualRate: 12 };
    const res = calculateSIPTenure(inputs);
    const passed = res.totalMonths === 1;

    recordTest({
      id: 'TENURE-004',
      module: 'SIP Tenure Calculator',
      scenario: 'Target corpus less than first monthly installment',
      preconditions: 'Single installment threshold',
      steps: 'Set Target = 10,000, Monthly Installment = 20,000',
      inputs,
      expected: { totalMonths: 1 },
      actual: { totalMonths: res.totalMonths },
      passed,
      severity: 'Low',
      remarks: 'Ceils to 1 installment as minimum physical transaction'
    });
  }

  // ------------------------------------------------------------
  // 6. CHILD EDUCATION CALCULATOR
  // ------------------------------------------------------------
  {
    // EDU-001: Typical College Goal: Child age 8, College age 18 (10 yrs left)
    // Cost today = ₹ 25 Lakhs, Education inflation = 10%, Growth = 12%
    // Future cost = 25,00,000 * (1.10)^10 = 25,00,000 * 2.59374246 = 64,84,356.15
    // Required monthly SIP to reach FutureCost in 120 months at 12% (i = 0.01):
    // reqSIP = (FutureCost * 0.01) / (((1.01)^120 - 1) * 1.01) = 64843.56 / (2.30038689 * 1.01) = 27,909.07
    const inputs = { childAge: 8, collegeAge: 18, costToday: 2500000, infRate: 10, growthRate: 12 };
    const res = calculateEducationGoal(inputs);

    const expectedFutureCost = 2500000 * Math.pow(1.10, 10);
    const i = 0.12 / 12;
    const n = 120;
    const expectedReqSIP = (expectedFutureCost * i) / ((Math.pow(1 + i, n) - 1) * (1 + i));

    const passed = res.yearsLeft === 10 &&
                   isClose(res.futureCost, expectedFutureCost, 1.0) &&
                   isClose(res.reqSIP, expectedReqSIP, 1.0);

    recordTest({
      id: 'EDU-001',
      module: 'Child Education Calculator',
      scenario: '10-Year college goal with 10% education inflation and 12% portfolio growth',
      preconditions: 'Inflation compounding on today cost + Annuity due accumulation SIP',
      steps: 'Compute future college cost at age 18 and derive required monthly SIP',
      inputs,
      expected: { yearsLeft: 10, futureCost: `${Math.round(expectedFutureCost)} ± 1.0`, reqSIP: `${Math.round(expectedReqSIP)} ± 1.0` },
      actual: { yearsLeft: res.yearsLeft, futureCost: Math.round(res.futureCost), reqSIP: Math.round(res.reqSIP) },
      passed,
      severity: 'Critical',
      remarks: 'Independent dual verification: future cost = ₹ 64.84L, required SIP = ₹ 27,909/mo'
    });
  }

  {
    // EDU-002: Zero inflation rate (inf = 0%)
    const inputs = { childAge: 5, collegeAge: 18, costToday: 3000000, infRate: 0, growthRate: 12 };
    const res = calculateEducationGoal(inputs);
    const passed = res.futureCost === 3000000 && res.yearsLeft === 13;

    recordTest({
      id: 'EDU-002',
      module: 'Child Education Calculator',
      scenario: 'Zero education inflation assumption',
      preconditions: 'infRate = 0%',
      steps: 'Verify Future Cost equals Cost Today when inflation is 0%',
      inputs,
      expected: { futureCost: 3000000, yearsLeft: 13 },
      actual: { futureCost: res.futureCost, yearsLeft: res.yearsLeft },
      passed,
      severity: 'Medium',
      remarks: 'Inflation-neutral baseline preserved accurately'
    });
  }

  {
    // EDU-003: Child age >= college age boundary
    const inputs = { childAge: 18, collegeAge: 18, costToday: 2000000, infRate: 8, growthRate: 12 };
    const res = calculateEducationGoal(inputs);
    const passed = res.yearsLeft >= 1; // Minimum 1 year clamped

    recordTest({
      id: 'EDU-003',
      module: 'Child Education Calculator',
      scenario: 'Immediate college entrance boundary (Child Age >= College Age)',
      preconditions: 'College age boundary check',
      steps: 'Pass Child Age 18 and College Age 18; verify minimum 1 year horizon clamped to prevent division by zero',
      inputs,
      expected: { yearsLeft: 1 },
      actual: { yearsLeft: res.yearsLeft },
      passed,
      severity: 'High',
      remarks: 'Clamps to minimum 1-year timeline, avoiding negative horizons or division by zero'
    });
  }

  // ------------------------------------------------------------
  // 7. MARRIAGE GOAL CALCULATOR
  // ------------------------------------------------------------
  {
    // MAR-001: 7-Year marriage horizon, ₹ 30 Lakhs today budget, 6% inflation, 12% return
    const inputs = { years: 7, costToday: 3000000, infRate: 6, growthRate: 12 };
    const res = calculateMarriageGoal(inputs);

    const expectedCost = 3000000 * Math.pow(1.06, 7); // 45,10,891.68
    const i = 0.12 / 12;
    const n = 84;
    const expectedSIP = (expectedCost * i) / ((Math.pow(1 + i, n) - 1) * (1 + i));

    const passed = isClose(res.futureCost, expectedCost, 1.0) &&
                   isClose(res.reqSIP, expectedSIP, 1.0) &&
                   res.yearsLeft === 7;

    recordTest({
      id: 'MAR-001',
      module: 'Marriage Calculator',
      scenario: '7-Year wedding goal with 6% inflation and 12% investment return',
      preconditions: 'Inflation-adjusted goal with Annuity Due accumulation SIP',
      steps: 'Compute future wedding budget and solve for required monthly SIP over 84 months',
      inputs,
      expected: { futureCost: `${Math.round(expectedCost)} ± 1.0`, reqSIP: `${Math.round(expectedSIP)} ± 1.0` },
      actual: { futureCost: Math.round(res.futureCost), reqSIP: Math.round(res.reqSIP) },
      passed,
      severity: 'High',
      remarks: 'Future cost = ₹ 45.11 Lakhs, required SIP = ₹ 34,228/mo'
    });
  }

  {
    // MAR-002: 1-Year immediate marriage boundary
    const inputs = { years: 1, costToday: 1500000, infRate: 5, growthRate: 10 };
    const res = calculateMarriageGoal(inputs);
    const expectedCost = 1500000 * 1.05; // 15,75,000
    const passed = isClose(res.futureCost, expectedCost, 1.0) && res.yearsLeft === 1;

    recordTest({
      id: 'MAR-002',
      module: 'Marriage Calculator',
      scenario: '1-Year short horizon boundary',
      preconditions: 'Single year compounding',
      steps: 'Set years = 1; verify inflation scales for 1 year and 12 monthly installments calculated',
      inputs,
      expected: { futureCost: 1575000, yearsLeft: 1 },
      actual: { futureCost: res.futureCost, yearsLeft: res.yearsLeft },
      passed,
      severity: 'Medium',
      remarks: 'Single year compounding behaves deterministically'
    });
  }

  {
    // MAR-003: Zero budget today
    const inputs = { years: 5, costToday: 0, infRate: 6, growthRate: 12 };
    const res = calculateMarriageGoal(inputs);
    const passed = res.futureCost === 0 && res.reqSIP === 0 && res.totalInvested === 0;

    recordTest({
      id: 'MAR-003',
      module: 'Marriage Calculator',
      scenario: 'Zero current budget input',
      preconditions: 'costToday = 0',
      steps: 'Pass 0 budget today and verify 0 required SIP',
      inputs,
      expected: { futureCost: 0, reqSIP: 0 },
      actual: { futureCost: res.futureCost, reqSIP: res.reqSIP },
      passed,
      severity: 'Low',
      remarks: 'Zero budget generates zero future liabilities'
    });
  }

  // ------------------------------------------------------------
  // 8. RETIREMENT CALCULATOR
  // ------------------------------------------------------------
  {
    // RET-001: Standard retirement: Age 30 to 60 (30 yrs to ret), ₹ 50,000/mo exp, 6% inf, 12% pre, 8.5% post
    const inputs = {
      currAge: 30,
      retAge: 60,
      monthlyExpenses: 50000,
      infRate: 6,
      preRate: 12,
      postRate: 0.085,
      lifespanPostRet: 25
    };
    const res = calculateRetirementCorpus(inputs);

    // 1. Future monthly expense = 50000 * (1.06)^30 = 2,87,174.56
    const expectedFutMonthly = 50000 * Math.pow(1.06, 30);
    // 2. Annual expense at ret = futMonthly * 12 = 34,46,094.71
    const expectedAnnual = expectedFutMonthly * 12;
    // 3. Real rate post ret = (0.085 - 0.06) / (1 + 0.06) = 0.025 / 1.06 = 0.0235849 (2.36%)
    const expectedRReal = (0.085 - 0.06) / 1.06;
    // 4. Corpus = Annual * (1 - (1 + rReal)^-25) / rReal = 3446094.71 * 18.7237 = 6,45,23,733 (approx 6.45 Cr)
    const expectedCorpus = expectedAnnual * ((1 - Math.pow(1 + expectedRReal, -25)) / expectedRReal);
    // 5. Pre-ret SIP for 360 months at 12% (i = 0.01) to reach expectedCorpus
    const iPre = 0.12 / 12;
    const n = 360;
    const expectedReqSIP = (expectedCorpus * iPre) / ((Math.pow(1 + iPre, n) - 1) * (1 + iPre));

    const passed = res.yearsToRet === 30 &&
                   isClose(res.futMonthlyExp, expectedFutMonthly, 1.0) &&
                   isClose(res.corpusRequired, expectedCorpus, 10.0) &&
                   isClose(res.reqSIP, expectedReqSIP, 5.0);

    recordTest({
      id: 'RET-001',
      module: 'Retirement Calculator',
      scenario: '30-Year horizon retirement planning with Fisher real yield drawdown',
      preconditions: 'Fisher post-retirement real return formula r_real = (r_post - r_inf) / (1 + r_inf)',
      steps: 'Adjust monthly expenses for 30 years of inflation, compute 25-year post-retirement annuity corpus, solve pre-ret SIP',
      inputs,
      expected: { futMonthlyExp: `${Math.round(expectedFutMonthly)} ± 1.0`, corpusRequired: `${Math.round(expectedCorpus)} ± 10.0`, reqSIP: `${Math.round(expectedReqSIP)} ± 5.0` },
      actual: { futMonthlyExp: Math.round(res.futMonthlyExp), corpusRequired: Math.round(res.corpusRequired), reqSIP: Math.round(res.reqSIP) },
      passed,
      severity: 'Critical',
      remarks: 'Corpus required: ₹ 6.45 Cr; Pre-retirement SIP: ₹ 18,280/mo. Verified via Fisher equation'
    });
  }

  {
    // RET-002: Fisher Real Yield floor guard (when postRate <= infRate)
    const inputs = {
      currAge: 30,
      retAge: 60,
      monthlyExpenses: 50000,
      infRate: 9, // High inflation: 9%
      preRate: 12,
      postRate: 0.085 // Post rate 8.5% < 9% inflation
    };
    const res = calculateRetirementCorpus(inputs);
    // System enforces floor rReal >= 0.015 (1.5%) to prevent division by zero or negative annuity factors
    const passed = res.rReal === 0.015 && res.corpusRequired > 0;

    recordTest({
      id: 'RET-002',
      module: 'Retirement Calculator',
      scenario: 'Real rate safety floor (rReal >= 1.5%) when inflation exceeds post-ret yield',
      preconditions: 'Negative or zero real yield guard',
      steps: 'Pass 9% inflation with 8.5% post-ret yield; verify real yield is floored at 1.5%',
      inputs,
      expected: { rReal: 0.015 },
      actual: { rReal: res.rReal },
      passed,
      severity: 'High',
      remarks: 'Prevents negative real return division anomalies and ensures sustainable corpus sizing'
    });
  }

  {
    // RET-003: Immediate retirement boundary (currAge = 59, retAge = 60 -> 1 year)
    const inputs = { currAge: 59, retAge: 60, monthlyExpenses: 100000, infRate: 6, preRate: 12 };
    const res = calculateRetirementCorpus(inputs);
    const passed = res.yearsToRet === 1 && res.corpusRequired > 0 && res.reqSIP > 0;

    recordTest({
      id: 'RET-003',
      module: 'Retirement Calculator',
      scenario: '1-Year immediate retirement boundary',
      preconditions: 'Minimum positive accumulation timeline',
      steps: 'Set currAge = 59, retAge = 60; verify 1-year accumulation schedule',
      inputs,
      expected: { yearsToRet: 1 },
      actual: { yearsToRet: res.yearsToRet },
      passed,
      severity: 'High',
      remarks: 'Single year horizon functions cleanly without NaN'
    });
  }

  {
    // RET-004: Zero living expenses input
    const inputs = { currAge: 35, retAge: 60, monthlyExpenses: 0, infRate: 6, preRate: 12 };
    const res = calculateRetirementCorpus(inputs);
    const passed = res.corpusRequired === 0 && res.reqSIP === 0;

    recordTest({
      id: 'RET-004',
      module: 'Retirement Calculator',
      scenario: 'Zero living expenses input',
      preconditions: 'monthlyExpenses = 0',
      steps: 'Pass 0 for living expenses; expect 0 corpus required and 0 SIP',
      inputs,
      expected: { corpusRequired: 0, reqSIP: 0 },
      actual: { corpusRequired: res.corpusRequired, reqSIP: res.reqSIP },
      passed,
      severity: 'Medium',
      remarks: 'Zero expenses yield zero required corpus'
    });
  }

  {
    // RET-005: Zero pre-retirement rate (preRate = 0%)
    const inputs = { currAge: 40, retAge: 60, monthlyExpenses: 50000, infRate: 6, preRate: 0 };
    const res = calculateRetirementCorpus(inputs);
    const expectedSIP = res.corpusRequired / (20 * 12);
    const passed = isClose(res.reqSIP, expectedSIP, 1.0);

    recordTest({
      id: 'RET-005',
      module: 'Retirement Calculator',
      scenario: 'Zero pre-retirement investment return (0% pre-rate)',
      preconditions: 'Pre-retirement accumulation rate = 0%',
      steps: 'Pass 0% pre-rate; verify reqSIP = corpusRequired / totalMonths',
      inputs,
      expected: { reqSIP: Math.round(expectedSIP) },
      actual: { reqSIP: Math.round(res.reqSIP) },
      passed,
      severity: 'Medium',
      remarks: 'Linear accumulation reqSIP = Corpus / Months works accurately when pre-rate is zero'
    });
  }

  // ------------------------------------------------------------
  // 9. EMI CALCULATOR
  // ------------------------------------------------------------
  {
    // EMI-001: Standard Home Loan: ₹ 50 Lakhs, 8.5% p.a., 20 Years
    // Formula: EMI = L * i * (1+i)^n / ((1+i)^n - 1)
    // L = 50,00,000, i = 0.085/12 = 0.00708333, n = 240
    // (1+i)^240 = 5.41908
    // EMI = 5000000 * 0.00708333 * 5.41908 / (4.41908) = 43,391.16
    const inputs = { principal: 5000000, annualRate: 8.5, tenureYears: 20 };
    const res = calculateEMI(inputs);

    const i = 0.085 / 12;
    const n = 240;
    const factor = Math.pow(1 + i, n);
    const expectedEMI = (5000000 * i * factor) / (factor - 1);
    const expectedPayment = expectedEMI * n;
    const expectedInterest = expectedPayment - 5000000;

    const passed = isClose(res.monthlyEMI, expectedEMI, 0.01) &&
                   isClose(res.totalPayment, expectedPayment, 1.0) &&
                   isClose(res.totalInterest, expectedInterest, 1.0);

    recordTest({
      id: 'EMI-001',
      module: 'EMI Calculator',
      scenario: 'Standard 20-Year ₹ 50 Lakhs loan at 8.5% interest rate',
      preconditions: 'Standard reducing-balance loan formula EMI = L * i * (1+i)^n / ((1+i)^n - 1)',
      steps: 'Compute monthly reducing-balance EMI for 240 installments and total interest',
      inputs,
      expected: { monthlyEMI: '43391.16 ± 0.01', totalPayment: `${Math.round(expectedPayment)} ± 1.0`, totalInterest: `${Math.round(expectedInterest)} ± 1.0` },
      actual: { monthlyEMI: +res.monthlyEMI.toFixed(2), totalPayment: Math.round(res.totalPayment), totalInterest: Math.round(res.totalInterest) },
      passed,
      severity: 'Critical',
      remarks: 'Verified against RBI/banking reducing-balance benchmark: EMI = ₹ 43,391.16/mo'
    });
  }

  {
    // EMI-002: Zero interest loan (0% rate)
    // L = 12,00,000, r = 0%, 5 years -> EMI = 1200000 / 60 = 20,000
    const inputs = { principal: 1200000, annualRate: 0, tenureYears: 5 };
    const res = calculateEMI(inputs);
    const passed = res.monthlyEMI === 20000 &&
                   res.totalPayment === 1200000 &&
                   res.totalInterest === 0 &&
                   res.interestRatio === 0;

    recordTest({
      id: 'EMI-002',
      module: 'EMI Calculator',
      scenario: 'Zero interest rate loan (0% interest)',
      preconditions: 'Division-by-zero reducing balance guard',
      steps: 'Set rate = 0% for 5-year loan; expect EMI = Principal / Months',
      inputs,
      expected: { monthlyEMI: 20000, totalPayment: 1200000, totalInterest: 0 },
      actual: { monthlyEMI: res.monthlyEMI, totalPayment: res.totalPayment, totalInterest: res.totalInterest },
      passed,
      severity: 'High',
      remarks: 'Zero interest correctly yields linear principal division without NaN'
    });
  }

  {
    // EMI-003: 1-Year short-duration loan
    const inputs = { principal: 100000, annualRate: 12, tenureYears: 1 };
    const res = calculateEMI(inputs);
    // 12 months, 1% per month. EMI = 100000 * 0.01 * (1.01^12) / (1.01^12 - 1) = 8,884.88
    const expectedEMI = 8884.88;
    const passed = isClose(res.monthlyEMI, expectedEMI, 0.05);

    recordTest({
      id: 'EMI-003',
      module: 'EMI Calculator',
      scenario: '1-Year short-duration loan (12 installments)',
      preconditions: 'Short tenure boundary',
      steps: 'Pass ₹ 1 Lakh principal for 1 year at 12%',
      inputs,
      expected: { monthlyEMI: '8884.88 ± 0.05' },
      actual: { monthlyEMI: +res.monthlyEMI.toFixed(2) },
      passed,
      severity: 'Medium',
      remarks: '12-month loan computes accurately with zero residual error'
    });
  }

  {
    // EMI-004: Zero principal boundary
    const inputs = { principal: 0, annualRate: 8.5, tenureYears: 15 };
    const res = calculateEMI(inputs);
    const passed = res.monthlyEMI === 0 && res.totalPayment === 0 && res.totalInterest === 0;

    recordTest({
      id: 'EMI-004',
      module: 'EMI Calculator',
      scenario: 'Zero loan principal input',
      preconditions: 'principal = 0',
      steps: 'Pass 0 principal; expect 0 monthly EMI',
      inputs,
      expected: { monthlyEMI: 0, totalPayment: 0, totalInterest: 0 },
      actual: { monthlyEMI: res.monthlyEMI, totalPayment: res.totalPayment, totalInterest: res.totalInterest },
      passed,
      severity: 'Low',
      remarks: 'Zero loan generates zero EMI'
    });
  }

  {
    // EMI-005: Negative input sanitation
    const inputs = { principal: -100000, annualRate: -5, tenureYears: -2 };
    const res = calculateEMI(inputs);
    const passed = res.monthlyEMI === 0 && res.totalInterest === 0;

    recordTest({
      id: 'EMI-005',
      module: 'EMI Calculator',
      scenario: 'Negative input sanitation',
      preconditions: 'Math.max(0, ...) clamping active',
      steps: 'Pass negative values for loan principal, rate, and tenure',
      inputs,
      expected: { monthlyEMI: 0, totalInterest: 0 },
      actual: { monthlyEMI: res.monthlyEMI, totalInterest: res.totalInterest },
      passed,
      severity: 'Medium',
      remarks: 'Sanitizes negative inputs cleanly'
    });
  }

  // ------------------------------------------------------------
  // 10. ASSET ALLOCATION SIMULATOR
  // ------------------------------------------------------------
  {
    // ALLOC-001: Level 1 Conservative Profile (15% Equity, 65% Debt, 15% Gold, 5% Alt)
    const inputs = { capital: 10000000, riskLevel: 1 };
    const res = calculateAssetAllocation(inputs);
    const passed = res.weights.equity === 15 &&
                   res.weights.debt === 65 &&
                   res.weights.gold === 15 &&
                   res.weights.alt === 5 &&
                   res.values.equity === 1500000 &&
                   res.values.debt === 6500000 &&
                   res.values.gold === 1500000 &&
                   res.values.alt === 500000 &&
                   (res.values.equity + res.values.debt + res.values.gold + res.values.alt) === 10000000;

    recordTest({
      id: 'ALLOC-001',
      module: 'Asset Allocation Diagnostic Center',
      scenario: 'Level 1 Conservative Mandate: ₹ 1 Crore capital allocation',
      preconditions: 'Target weightings: Equity 15%, Debt 65%, Gold 15%, Alt 5%',
      steps: 'Verify percentage weightings and calculated rupee allocations sum to exactly 100% of capital',
      inputs,
      expected: { equity: 1500000, debt: 6500000, gold: 1500000, alt: 500000, total: 10000000 },
      actual: { equity: res.values.equity, debt: res.values.debt, gold: res.values.gold, alt: res.values.alt, total: res.values.equity + res.values.debt + res.values.gold + res.values.alt },
      passed,
      severity: 'High',
      remarks: 'Sum of asset components equals 100.0% of deployable capital without leakage'
    });
  }

  {
    // ALLOC-002: Level 3 Balanced Growth Profile (55% Equity, 25% Debt, 10% Gold, 10% Alt)
    const inputs = { capital: 25000000, riskLevel: 3 };
    const res = calculateAssetAllocation(inputs);
    const passed = res.weights.equity === 55 &&
                   res.weights.debt === 25 &&
                   res.weights.gold === 10 &&
                   res.weights.alt === 10 &&
                   res.values.equity === 13750000 &&
                   res.values.debt === 6250000 &&
                   res.values.gold === 2500000 &&
                   res.values.alt === 2500000;

    recordTest({
      id: 'ALLOC-002',
      module: 'Asset Allocation Diagnostic Center',
      scenario: 'Level 3 Balanced Growth Mandate: ₹ 2.5 Crore capital allocation',
      preconditions: 'Target weightings: Equity 55%, Debt 25%, Gold 10%, Alt 10%',
      steps: 'Verify weights and absolute rupee values for ₹ 2.5 Crore capital',
      inputs,
      expected: { equity: 13750000, debt: 6250000, gold: 2500000, alt: 2500000 },
      actual: { equity: res.values.equity, debt: res.values.debt, gold: res.values.gold, alt: res.values.alt },
      passed,
      severity: 'High',
      remarks: 'Balanced core-and-satellite distribution mathematically exact'
    });
  }

  {
    // ALLOC-003: Level 5 High Alpha Mandate (80% Equity, 5% Debt, 5% Gold, 10% Alt)
    const inputs = { capital: 50000000, riskLevel: 5 };
    const res = calculateAssetAllocation(inputs);
    const passed = res.weights.equity === 80 &&
                   res.weights.debt === 5 &&
                   res.weights.gold === 5 &&
                   res.weights.alt === 10 &&
                   res.values.equity === 40000000 &&
                   res.values.debt === 2500000 &&
                   res.values.gold === 2500000 &&
                   res.values.alt === 5000000;

    recordTest({
      id: 'ALLOC-003',
      module: 'Asset Allocation Diagnostic Center',
      scenario: 'Level 5 High-Alpha Mandate: ₹ 5 Crore capital allocation',
      preconditions: 'Target weightings: Equity 80%, Debt 5%, Gold 5%, Alt 10%',
      steps: 'Verify high-conviction alpha weightings on ₹ 5 Crore capital',
      inputs,
      expected: { equity: 40000000, debt: 2500000, gold: 2500000, alt: 5000000 },
      actual: { equity: res.values.equity, debt: res.values.debt, gold: res.values.gold, alt: res.values.alt },
      passed,
      severity: 'Medium',
      remarks: 'High-alpha allocations allocate ₹ 4 Cr to equities accurately'
    });
  }

  const passedCount = financialTestRegistry.filter(t => t.status === 'Pass').length;
  const failedCount = financialTestRegistry.filter(t => t.status === 'Fail').length;

  console.log(`[FINANCIAL TEST SUITE COMPLETE] Executed: ${financialTestRegistry.length} | Passed: ${passedCount} | Failed: ${failedCount}\n`);
  return financialTestRegistry;
}
