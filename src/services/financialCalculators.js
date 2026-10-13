// ============================================================
// VINTAGE FINVEST — FINANCIAL CALCULATION ENGINE
// Pure, deterministic, independently verifiable financial functions
// Aligned with SEBI, AMFI Factsheet, and Indian Financial Conventions
// ============================================================

/**
 * Format number to Indian Currency String (INR)
 * @param {number} num
 * @returns {string}
 */
export function formatINR(num) {
  if (num === null || num === undefined || isNaN(num)) return '₹ 0';
  const val = Math.round(num);
  const isNeg = val < 0;
  const abs = Math.abs(val);

  if (abs >= 10000000) {
    return `${isNeg ? '-' : ''}₹ ${(abs / 10000000).toFixed(2)} Cr`;
  }
  if (abs >= 100000) {
    return `${isNeg ? '-' : ''}₹ ${(abs / 100000).toFixed(2)} Lakhs`;
  }
  return `${isNeg ? '-' : ''}₹ ${abs.toLocaleString('en-IN')}`;
}

/**
 * 1. Standard / Hypothetical SIP Calculator (Annuity Due: Beginning of month)
 * Formula: FV = P * (((1 + i)^n - 1) / i) * (1 + i)
 * Where P = monthly installment, i = annualRate / 12, n = years * 12
 *
 * @param {Object} params
 * @param {number} params.monthlyAmount - Monthly investment in INR
 * @param {number} params.annualRate - Annual return rate in percent (e.g. 12 for 12%)
 * @param {number} params.years - Investment horizon in years
 * @returns {Object} { totalInvested, futureValue, totalGain, multiplier }
 */
export function calculateHypotheticalSIP({ monthlyAmount, annualRate, years }) {
  const p = Math.max(0, parseFloat(monthlyAmount) || 0);
  const r = Math.max(0, parseFloat(annualRate) || 0) / 100;
  const t = Math.max(0, parseInt(years, 10) || 0);

  const months = t * 12;
  const invested = p * months;

  if (months === 0 || p === 0) {
    return {
      totalInvested: invested,
      futureValue: invested,
      totalGain: 0,
      multiplier: 1.0
    };
  }

  const monthlyRate = r / 12;

  let futureValue;
  if (monthlyRate === 0) {
    futureValue = invested;
  } else {
    futureValue = p * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  const totalGain = Math.max(0, futureValue - invested);
  const multiplier = invested > 0 ? +(futureValue / invested).toFixed(2) : 1.0;

  return {
    totalInvested: invested,
    futureValue,
    totalGain,
    multiplier
  };
}

/**
 * 2. Standard / Hypothetical Lumpsum & SIP Calculator
 * Lumpsum compounds via P * (1 + r)^t
 * SIP compounds via Annuity Due
 *
 * @param {Object} params
 * @param {number} params.lumpsum - Initial one-time capital
 * @param {number} params.monthlyAmount - Recurring monthly SIP
 * @param {number} params.annualRate - Annual return rate in percent (e.g. 13 for 13%)
 * @param {number} params.years - Horizon in years
 * @returns {Object}
 */
export function calculateHypotheticalLumpsumSIP({ lumpsum, monthlyAmount, annualRate, years }) {
  const lump = Math.max(0, parseFloat(lumpsum) || 0);
  const sip = Math.max(0, parseFloat(monthlyAmount) || 0);
  const r = Math.max(0, parseFloat(annualRate) || 0) / 100;
  const t = Math.max(0, parseInt(years, 10) || 0);

  const months = t * 12;
  const lumpInvested = lump;
  const sipInvested = sip * months;
  const totalInvested = lumpInvested + sipInvested;

  const lumpFV = lump * Math.pow(1 + r, t);

  const monthlyRate = r / 12;
  let sipFV = 0;
  if (sip > 0 && months > 0) {
    if (monthlyRate === 0) {
      sipFV = sipInvested;
    } else {
      sipFV = sip * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
    }
  }

  const totalWealth = lumpFV + sipFV;
  const totalGain = Math.max(0, totalWealth - totalInvested);

  return {
    lumpInvested,
    sipInvested,
    totalInvested,
    lumpFV,
    sipFV,
    totalWealth,
    totalGain
  };
}

/**
 * 3. Standard / Hypothetical Step-Up SIP Calculator
 * Each year, monthly contribution increments by stepUpPercent.
 *
 * @param {Object} params
 * @param {number} params.initialMonthly - Base monthly installment
 * @param {number} params.stepUpPercent - Annual increment percent (e.g. 10 for 10%)
 * @param {number} params.annualRate - Annual expected CAGR in percent (e.g. 13 for 13%)
 * @param {number} params.years - Horizon in years
 * @returns {Object}
 */
export function calculateHypotheticalStepUpSIP({ initialMonthly, stepUpPercent, annualRate, years }) {
  const p = Math.max(0, parseFloat(initialMonthly) || 0);
  const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0) / 100;
  const r = Math.max(0, parseFloat(annualRate) || 0) / 100;
  const t = Math.max(0, parseInt(years, 10) || 0);

  const totalMonths = t * 12;
  const monthlyRate = r / 12;

  let totalInvested = 0;
  let futureValue = 0;

  for (let m = 1; m <= totalMonths; m++) {
    const yearIndex = Math.floor((m - 1) / 12);
    const currentMonthly = p * Math.pow(1 + stepUp, yearIndex);
    totalInvested += currentMonthly;
    if (monthlyRate === 0) {
      futureValue += currentMonthly;
    } else {
      futureValue += currentMonthly * Math.pow(1 + monthlyRate, totalMonths - m + 1);
    }
  }

  // Flat SIP baseline for comparison
  let flatFV = 0;
  const flatInvested = p * totalMonths;
  if (monthlyRate === 0) {
    flatFV = flatInvested;
  } else {
    flatFV = p * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  const totalGain = Math.max(0, futureValue - totalInvested);
  const rawAdvantage = Math.max(0, futureValue - flatFV);
  const advantage = rawAdvantage < 0.01 ? 0 : rawAdvantage;

  return {
    totalInvested,
    futureValue,
    totalGain,
    flatInvested,
    flatFV,
    stepUpAdvantage: advantage
  };
}

/**
 * 4. SIP Cost of Delay Calculator
 * Quantifies wealth destroyed by postponing the start of an SIP.
 *
 * @param {Object} params
 * @param {number} params.monthlyAmount - Target monthly SIP
 * @param {number} params.delayYears - Postponement delay in years
 * @param {number} params.horizonYears - Total planned horizon in years
 * @param {number} params.annualRate - Assumed CAGR in percent
 * @returns {Object}
 */
export function calculateCostOfDelay({ monthlyAmount, delayYears, horizonYears, annualRate }) {
  const p = Math.max(0, parseFloat(monthlyAmount) || 0);
  const delay = Math.max(0, parseInt(delayYears, 10) || 0);
  const horizon = Math.max(delay, parseInt(horizonYears, 10) || 0);
  const r = Math.max(0, parseFloat(annualRate) || 0) / 100;
  const monthlyRate = r / 12;

  const ontimeMonths = horizon * 12;
  let ontimeWealth = 0;
  if (monthlyRate === 0) {
    ontimeWealth = p * ontimeMonths;
  } else {
    ontimeWealth = p * ((Math.pow(1 + monthlyRate, ontimeMonths) - 1) / monthlyRate) * (1 + monthlyRate);
  }

  const delayedMonths = Math.max(0, (horizon - delay) * 12);
  let delayedWealth = 0;
  if (delayedMonths > 0) {
    if (monthlyRate === 0) {
      delayedWealth = p * delayedMonths;
    } else {
      delayedWealth = p * ((Math.pow(1 + monthlyRate, delayedMonths) - 1) / monthlyRate) * (1 + monthlyRate);
    }
  }

  const costOfDelay = Math.max(0, ontimeWealth - delayedWealth);

  // Catch-up SIP required to reach ontimeWealth in remaining delayedMonths
  let catchupSIP = 0;
  if (delayedMonths > 0) {
    if (monthlyRate === 0) {
      catchupSIP = ontimeWealth / delayedMonths;
    } else {
      catchupSIP = (ontimeWealth * monthlyRate) / ((Math.pow(1 + monthlyRate, delayedMonths) - 1) * (1 + monthlyRate));
    }
  }

  return {
    ontimeWealth,
    delayedWealth,
    costOfDelay,
    catchupSIP
  };
}

/**
 * 5. SIP Tenure Calculator
 * Solves for the number of months needed to reach a target corpus.
 * Formula: n = ln(1 + (Target * i) / (P * (1+i))) / ln(1+i)
 *
 * @param {Object} params
 * @param {number} params.targetCorpus - Target future wealth in INR
 * @param {number} params.monthlyAmount - Available monthly SIP
 * @param {number} params.annualRate - Assumed CAGR in percent
 * @returns {Object}
 */
export function calculateSIPTenure({ targetCorpus, monthlyAmount, annualRate }) {
  const target = Math.max(0, parseFloat(targetCorpus) || 0);
  const p = Math.max(0, parseFloat(monthlyAmount) || 0);
  const r = Math.max(0, parseFloat(annualRate) || 0) / 100;

  if (target === 0 || p === 0) {
    return {
      totalMonths: 0,
      years: 0,
      remMonths: 0,
      totalInvested: 0,
      totalGain: 0
    };
  }

  const monthlyRate = r / 12;
  let totalMonths = 0;

  if (monthlyRate === 0) {
    totalMonths = Math.ceil(target / p);
  } else {
    const numerator = Math.log(1 + (target * monthlyRate) / (p * (1 + monthlyRate)));
    const denominator = Math.log(1 + monthlyRate);
    totalMonths = Math.ceil(numerator / denominator);
  }

  const years = Math.floor(totalMonths / 12);
  const remMonths = totalMonths % 12;
  const totalInvested = p * totalMonths;
  const totalGain = Math.max(0, target - totalInvested);

  return {
    totalMonths,
    years,
    remMonths,
    totalInvested,
    totalGain
  };
}

/**
 * 6. Child Education Goal Calculator
 * Computes inflation-adjusted college cost and required monthly SIP.
 *
 * @param {Object} params
 * @param {number} params.childAge - Current age of child
 * @param {number} params.collegeAge - Target college entrance age (default 18)
 * @param {number} params.costToday - Current cost of higher education
 * @param {number} params.infRate - Education inflation rate in percent
 * @param {number} params.growthRate - Expected investment return in percent
 * @returns {Object}
 */
export function calculateEducationGoal({ childAge, collegeAge = 18, costToday, infRate, growthRate }) {
  const age = Math.max(0, parseInt(childAge, 10) || 0);
  const targetAge = Math.max(age + 1, parseInt(collegeAge, 10) || 18);
  const yearsLeft = targetAge - age;
  const cost = Math.max(0, parseFloat(costToday) || 0);
  const inf = Math.max(0, parseFloat(infRate) || 0) / 100;
  const growth = Math.max(0, parseFloat(growthRate) || 0) / 100;

  const futureCost = cost * Math.pow(1 + inf, yearsLeft);
  const monthlyRate = growth / 12;
  const totalMonths = yearsLeft * 12;

  let reqSIP = 0;
  if (totalMonths > 0) {
    if (monthlyRate === 0) {
      reqSIP = futureCost / totalMonths;
    } else {
      reqSIP = (futureCost * monthlyRate) / ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));
    }
  }

  const totalInvested = reqSIP * totalMonths;
  const wealthGain = Math.max(0, futureCost - totalInvested);

  return {
    yearsLeft,
    futureCost,
    reqSIP,
    totalInvested,
    wealthGain
  };
}

/**
 * 7. Marriage Goal Calculator
 * Computes inflation-adjusted wedding cost and required monthly SIP.
 *
 * @param {Object} params
 * @param {number} params.years - Timeline in years
 * @param {number} params.costToday - Budget in today's money
 * @param {number} params.infRate - Inflation rate in percent
 * @param {number} params.growthRate - Expected portfolio return in percent
 * @returns {Object}
 */
export function calculateMarriageGoal({ years, costToday, infRate, growthRate }) {
  const t = Math.max(1, parseInt(years, 10) || 1);
  const cost = Math.max(0, parseFloat(costToday) || 0);
  const inf = Math.max(0, parseFloat(infRate) || 0) / 100;
  const growth = Math.max(0, parseFloat(growthRate) || 0) / 100;

  const futureCost = cost * Math.pow(1 + inf, t);
  const monthlyRate = growth / 12;
  const totalMonths = t * 12;

  let reqSIP = 0;
  if (totalMonths > 0) {
    if (monthlyRate === 0) {
      reqSIP = futureCost / totalMonths;
    } else {
      reqSIP = (futureCost * monthlyRate) / ((Math.pow(1 + monthlyRate, totalMonths) - 1) * (1 + monthlyRate));
    }
  }

  const totalInvested = reqSIP * totalMonths;
  const wealthGain = Math.max(0, futureCost - totalInvested);

  return {
    yearsLeft: t,
    futureCost,
    reqSIP,
    totalInvested,
    wealthGain
  };
}

/**
 * 8. Retirement Corpus & SIP Planner
 * Inflation-adjusts monthly expenses to retirement age,
 * computes required post-retirement annuity corpus using real yield,
 * and determines required pre-retirement monthly SIP accumulation.
 *
 * @param {Object} params
 * @param {number} params.currAge - Current age
 * @param {number} params.retAge - Planned retirement age
 * @param {number} params.monthlyExpenses - Current monthly living expenses
 * @param {number} params.infRate - General inflation rate in percent
 * @param {number} params.preRate - Pre-retirement accumulation CAGR in percent
 * @param {number} [params.postRate=0.085] - Post-retirement defensive yield (default 8.5%)
 * @param {number} [params.lifespanPostRet=25] - Assumed retirement drawdown lifespan in years
 * @returns {Object}
 */
export function calculateRetirementCorpus({
  currAge,
  retAge,
  monthlyExpenses,
  infRate,
  preRate,
  postRate = 0.085,
  lifespanPostRet = 25
}) {
  const cAge = Math.max(18, parseInt(currAge, 10) || 30);
  const rAge = Math.max(cAge + 1, parseInt(retAge, 10) || 60);
  const yearsToRet = rAge - cAge;
  const exp = Math.max(0, parseFloat(monthlyExpenses) || 0);
  const inf = Math.max(0, parseFloat(infRate) || 0) / 100;
  const pre = Math.max(0, parseFloat(preRate) || 0) / 100;

  const futMonthlyExp = exp * Math.pow(1 + inf, yearsToRet);
  const annualExpAtRet = futMonthlyExp * 12;

  // Real return rate post-retirement: (postRate - inf) / (1 + inf), minimum 1.5%
  const rReal = Math.max(0.015, (postRate - inf) / (1 + inf));
  const corpusRequired = annualExpAtRet * ((1 - Math.pow(1 + rReal, -lifespanPostRet)) / rReal);

  const monthlyPreRate = pre / 12;
  const totalMonths = yearsToRet * 12;

  let reqSIP = 0;
  if (totalMonths > 0) {
    if (monthlyPreRate === 0) {
      reqSIP = corpusRequired / totalMonths;
    } else {
      reqSIP = (corpusRequired * monthlyPreRate) / ((Math.pow(1 + monthlyPreRate, totalMonths) - 1) * (1 + monthlyPreRate));
    }
  }

  const totalInvested = reqSIP * totalMonths;
  const wealthGrowth = Math.max(0, corpusRequired - totalInvested);

  return {
    yearsToRet,
    futMonthlyExp,
    annualExpAtRet,
    rReal,
    corpusRequired,
    reqSIP,
    totalInvested,
    wealthGrowth
  };
}

/**
 * 9. Standard Reducing-Balance Loan EMI Calculator
 * Formula: EMI = L * i * (1 + i)^n / ((1 + i)^n - 1)
 *
 * @param {Object} params
 * @param {number} params.principal - Loan principal in INR
 * @param {number} params.annualRate - Annual interest rate in percent (e.g. 8.5 for 8.5%)
 * @param {number} params.tenureYears - Loan duration in years
 * @returns {Object}
 */
export function calculateEMI({ principal, annualRate, tenureYears }) {
  const p = Math.max(0, parseFloat(principal) || 0);
  const r = Math.max(0, parseFloat(annualRate) || 0) / 100;
  const t = Math.max(0, parseInt(tenureYears, 10) || 0);

  const totalMonths = t * 12;
  if (totalMonths === 0 || p === 0) {
    return {
      monthlyEMI: 0,
      totalPayment: p,
      totalInterest: 0,
      interestRatio: 0
    };
  }

  const monthlyRate = r / 12;
  let emi = 0;

  if (monthlyRate === 0) {
    emi = p / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    emi = (p * monthlyRate * factor) / (factor - 1);
  }

  const totalPayment = emi * totalMonths;
  const totalInterest = Math.max(0, totalPayment - p);
  const interestRatio = p > 0 ? +((totalInterest / p) * 100).toFixed(1) : 0;

  return {
    monthlyEMI: emi,
    totalPayment,
    totalInterest,
    interestRatio
  };
}

/**
 * 10. Asset Allocation Simulator
 * Defines strategic institutional multi-asset weightings by risk profile.
 *
 * @param {Object} params
 * @param {number} params.capital - Investable capital in INR
 * @param {number} params.riskLevel - Risk mandate level (1 to 5)
 * @returns {Object}
 */
export function calculateAssetAllocation({ capital, riskLevel }) {
  const cap = Math.max(0, parseFloat(capital) || 0);
  const level = Math.min(5, Math.max(1, parseInt(riskLevel, 10) || 3));

  const riskProfiles = {
    1: {
      badge: 'Capital Preservation Mandate',
      label: 'Conservative (Level 1)',
      rate: 8.8,
      volatility: 'Low (Defensive)',
      alloc: { equity: 15, debt: 65, gold: 15, alt: 5 }
    },
    2: {
      badge: 'Income & Stability Mandate',
      label: 'Moderate-Cons (Level 2)',
      rate: 10.4,
      volatility: 'Low-Moderate',
      alloc: { equity: 30, debt: 50, gold: 12, alt: 8 }
    },
    3: {
      badge: 'Balanced Alpha Mandate',
      label: 'Balanced Growth (Level 3)',
      rate: 12.8,
      volatility: 'Moderate',
      alloc: { equity: 55, debt: 25, gold: 10, alt: 10 }
    },
    4: {
      badge: 'Capital Appreciation Mandate',
      label: 'Aggressive Growth (Level 4)',
      rate: 14.6,
      volatility: 'Moderate-High',
      alloc: { equity: 70, debt: 15, gold: 7, alt: 8 }
    },
    5: {
      badge: 'High-Alpha Growth Mandate',
      label: 'High Alpha (Level 5)',
      rate: 16.8,
      volatility: 'High (Aggressive Alpha)',
      alloc: { equity: 80, debt: 5, gold: 5, alt: 10 }
    }
  };

  const profile = riskProfiles[level];

  return {
    capital: cap,
    level,
    badge: profile.badge,
    label: profile.label,
    expectedReturn: profile.rate,
    volatility: profile.volatility,
    weights: profile.alloc,
    values: {
      equity: Math.round((profile.alloc.equity / 100) * cap),
      debt: Math.round((profile.alloc.debt / 100) * cap),
      gold: Math.round((profile.alloc.gold / 100) * cap),
      alt: Math.round((profile.alloc.alt / 100) * cap)
    }
  };
}
