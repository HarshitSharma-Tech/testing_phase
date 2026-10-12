// ============================================================
// VINTAGE FINVEST — REAL MUTUAL FUND DATA ENGINE
// Powered by AMFI / MFAPI.in live historical NAV feeds
// Fully aligned with SEBI & AMFI Factsheet Standards
// ============================================================

/**
 * Transaction Date Convention:
 * Mutual fund NAVs are not published on weekends, public holidays, or market closures.
 * By default, this engine applies the 'NEXT_BUSINESS_DAY_FORWARD_7D' convention:
 * if the scheduled date (e.g., 1st or 10th of month) is a non-business day, it resolves
 * forward up to 7 calendar days to the next published business day NAV.
 */
export const TRANSACTION_DATE_CONVENTION = 'NEXT_BUSINESS_DAY_FORWARD_7D';

export class MFDataError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'MFDataError';
    this.code = code; // 'TIMEOUT' | 'NETWORK_ERROR' | 'INVALID_DATA' | 'SCHEME_NOT_FOUND'
    this.details = details;
  }
}

export const CURATED_AMCS = [
  { id: 'kotak', name: 'Kotak Mahindra Mutual Fund' },
  { id: 'hdfc', name: 'HDFC Mutual Fund' },
  { id: 'sbi', name: 'SBI Mutual Fund' },
  { id: 'icici', name: 'ICICI Prudential Mutual Fund' },
  { id: 'ppfas', name: 'Parag Parikh Financial Advisory Services (PPFAS)' },
  { id: 'nippon', name: 'Nippon India Mutual Fund' },
  { id: 'mirae', name: 'Mirae Asset Mutual Fund' }
];

export const CURATED_SCHEMES = [
  // Kotak Mahindra Mutual Fund (Verified with AMFI Master & Factsheet)
  { amc: 'kotak', code: 120166, name: 'Kotak Flexi Cap Fund - Direct Plan - Growth', category: 'Equity: Flexi Cap', type: 'equity', isin: 'INF174K01LS2' },
  { amc: 'kotak', code: 119775, name: 'Kotak Mid Cap Fund - Direct Plan - Growth', category: 'Equity: Mid Cap', type: 'equity', isin: 'INF174K01LT0' }, // Formerly Kotak Emerging Equity
  { amc: 'kotak', code: 120152, name: 'Kotak Large Cap Fund - Direct Plan - Growth', category: 'Equity: Large Cap', type: 'equity', isin: 'INF174K01LG7' }, // Formerly Kotak Bluechip
  { amc: 'kotak', code: 120164, name: 'Kotak Small Cap Fund - Direct Plan - Growth', category: 'Equity: Small Cap', type: 'equity', isin: 'INF174K01LK9' },
  { amc: 'kotak', code: 144335, name: 'Kotak Balanced Advantage Fund - Direct Plan - Growth Option', category: 'Hybrid: Dynamic Asset Allocation', type: 'hybrid', isin: 'INF174KA1808' },
  { amc: 'kotak', code: 119766, name: 'Kotak Liquid Fund - Direct Plan - Growth', category: 'Debt: Liquid Fund', type: 'debt', isin: 'INF174K01DY8' },

  // HDFC
  { amc: 'hdfc', code: 118955, name: 'HDFC Flexi Cap Fund - Direct Growth', category: 'Equity: Flexi Cap', type: 'equity', isin: 'INF179K01UT0' },
  { amc: 'hdfc', code: 118989, name: 'HDFC Mid-Cap Opportunities Fund - Direct Growth', category: 'Equity: Mid Cap', type: 'equity', isin: 'INF179K01CN8' },
  { amc: 'hdfc', code: 118968, name: 'HDFC Balanced Advantage Fund - Direct Growth', category: 'Hybrid: Dynamic Asset Allocation', type: 'hybrid', isin: 'INF179K01BM5' },
  { amc: 'hdfc', code: 119091, name: 'HDFC Liquid Fund - Direct Growth', category: 'Debt: Liquid Fund', type: 'debt', isin: 'INF179K01EK2' },

  // SBI
  { amc: 'sbi', code: 119598, name: 'SBI Large Cap Fund - Direct Growth', category: 'Equity: Large Cap', type: 'equity', isin: 'INF200K01RA8' },
  { amc: 'sbi', code: 119718, name: 'SBI Flexicap Fund - Direct Growth', category: 'Equity: Flexi Cap', type: 'equity', isin: 'INF200K01SZ1' },
  { amc: 'sbi', code: 125497, name: 'SBI Small Cap Fund - Direct Plan - Growth', category: 'Equity: Small Cap', type: 'equity', isin: 'INF200K01T51' }, // Verified AMFI Regression Scheme
  { amc: 'sbi', code: 149134, name: 'SBI Balanced Advantage Fund - Direct Growth', category: 'Hybrid: Dynamic Asset Allocation', type: 'hybrid', isin: 'INF200KA1998' },
  { amc: 'sbi', code: 119800, name: 'SBI Liquid Fund - Direct Growth', category: 'Debt: Liquid Fund', type: 'debt', isin: 'INF200K01TK4' },

  // ICICI Prudential
  { amc: 'icici', code: 120503, name: 'ICICI Prudential Bluechip Fund - Direct Growth', category: 'Equity: Large Cap', type: 'equity', isin: 'INF109K01BK0' },
  { amc: 'icici', code: 120377, name: 'ICICI Prudential Balanced Advantage Fund - Direct Growth', category: 'Hybrid: Dynamic Asset Allocation', type: 'hybrid', isin: 'INF109K01AP1' },
  { amc: 'icici', code: 120531, name: 'ICICI Prudential Liquid Fund - Direct Growth', category: 'Debt: Liquid Fund', type: 'debt', isin: 'INF109K01BW5' },

  // Parag Parikh
  { amc: 'ppfas', code: 122639, name: 'Parag Parikh Flexi Cap Fund - Direct Growth', category: 'Equity: Flexi Cap', type: 'equity', isin: 'INF879O01027' },
  { amc: 'ppfas', code: 143269, name: 'Parag Parikh Liquid Fund - Direct Growth', category: 'Debt: Liquid Fund', type: 'debt', isin: 'INF879O01118' },

  // Nippon
  { amc: 'nippon', code: 118778, name: 'Nippon India Small Cap Fund - Direct Growth', category: 'Equity: Small Cap', type: 'equity', isin: 'INF204K01H60' },
  { amc: 'nippon', code: 118834, name: 'Nippon India Liquid Fund - Direct Growth', category: 'Debt: Liquid Fund', type: 'debt', isin: 'INF204K01KK4' },

  // Mirae Asset
  { amc: 'mirae', code: 118825, name: 'Mirae Asset Large Cap Fund - Direct Growth', category: 'Equity: Large Cap', type: 'equity', isin: 'INF769K01DF8' }
];

// In-memory cache & In-flight request deduplication
const schemeCache = new Map();
const inFlightRequests = new Map();

/**
 * Filter to confirm Direct Plan - Growth scheme
 */
export function isDirectGrowth(schemeName) {
  if (!schemeName || typeof schemeName !== 'string') return false;
  const lower = schemeName.toLowerCase();
  const hasDirect = lower.includes('direct') || lower.includes('dir');
  const hasGrowth = lower.includes('growth') || lower.includes('gr');
  const isDividend = lower.includes('dividend') || lower.includes('idcw');
  return hasDirect && hasGrowth && !isDividend;
}

/**
 * Helper: parse 'DD-MM-YYYY' or 'YYYY-MM-DD' into local Date at 00:00:00 without timezone drift
 */
export function parseLocalDate(str) {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  } else {
    // DD-MM-YYYY
    return new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
  }
}

/**
 * Helper: format local Date into 'YYYY-MM-DD'
 */
export function formatYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Search schemes via MFAPI search endpoint
 */
export async function searchSchemes(query, { timeoutMs = 8000 } = {}) {
  if (!query || query.trim().length < 2) return [];

  const url = `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query.trim())}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      throw new MFDataError(`Search failed with HTTP ${res.status}`, 'NETWORK_ERROR');
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    
    return data.map(item => ({
      code: item.schemeCode,
      name: item.schemeName,
      isDirectGrowth: isDirectGrowth(item.schemeName)
    }));
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new MFDataError('Search query timed out', 'TIMEOUT');
    }
    throw new MFDataError(err.message || 'Network error during search', 'NETWORK_ERROR');
  }
}

/**
 * Fetch latest NAV only from /latest endpoint
 */
export async function fetchLatestNav(schemeCode, { timeoutMs = 8000 } = {}) {
  const code = parseInt(schemeCode, 10);
  if (isNaN(code)) throw new MFDataError('Invalid scheme code', 'INVALID_DATA');

  if (schemeCache.has(code)) {
    const cached = schemeCache.get(code);
    return {
      nav: cached.latestNav,
      date: cached.latestDate,
      meta: cached.meta
    };
  }

  const url = `https://api.mfapi.in/mf/${code}/latest`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      throw new MFDataError(`Failed to fetch latest NAV for scheme ${code}: HTTP ${res.status}`, 'NETWORK_ERROR');
    }
    const json = await res.json();
    if (!json || !json.data || !json.data.length) {
      throw new MFDataError(`No latest NAV returned for scheme ${code}`, 'INVALID_DATA');
    }
    return {
      nav: parseFloat(json.data[0].nav),
      date: json.data[0].date,
      meta: json.meta
    };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new MFDataError('Latest NAV request timed out', 'TIMEOUT');
    }
    throw err;
  }
}

/**
 * Fetch scheme details and historical NAV array from MFAPI with deduplication & caching
 * Supports optional startDate and endDate query parameters when filtering is needed.
 */
export async function fetchSchemeData(schemeCode, { startDate = null, endDate = null, timeoutMs = 10000, enforceDirectGrowth = false } = {}) {
  const code = parseInt(schemeCode, 10);
  if (isNaN(code)) {
    throw new MFDataError('Invalid scheme code provided', 'INVALID_DATA');
  }

  const cacheKey = (startDate || endDate) ? `${code}_${startDate || ''}_${endDate || ''}` : `${code}`;

  // 1. Check in-memory cache
  if (schemeCache.has(cacheKey)) {
    return schemeCache.get(cacheKey);
  }

  // 2. Check sessionStorage
  try {
    const cached = sessionStorage.getItem(`mf_nav_v3_${cacheKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      const navMap = new Map(parsed.navEntries);
      const processed = {
        meta: parsed.meta,
        latestNav: parsed.latestNav,
        latestDate: parsed.latestDate,
        navMap,
        sortedHistory: parsed.sortedHistory || [],
        isDirectGrowth: parsed.isDirectGrowth ?? isDirectGrowth(parsed.meta?.scheme_name || '')
      };
      schemeCache.set(cacheKey, processed);
      return processed;
    }
  } catch (e) {
    // SessionStorage unavailable
  }

  // 3. Request deduplication
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const urlObj = new URL(`https://api.mfapi.in/mf/${code}`);
      if (startDate) urlObj.searchParams.set('startDate', startDate);
      if (endDate) urlObj.searchParams.set('endDate', endDate);

      const response = await fetch(urlObj.toString(), {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 404) {
          throw new MFDataError(`Scheme ${code} not found in database`, 'SCHEME_NOT_FOUND');
        }
        throw new MFDataError(`Failed to fetch scheme ${code}: HTTP ${response.status}`, 'NETWORK_ERROR');
      }

      const json = await response.json();
      if (json && (json.status === 'FAIL' || (json.message && json.message.toLowerCase().includes('not found')))) {
        throw new MFDataError(`Scheme ${code} not found in database: ${json.message || ''}`, 'SCHEME_NOT_FOUND');
      }
      if (!json || !json.data || !Array.isArray(json.data) || json.data.length === 0 || json.meta?.scheme_code === 0 || !json.meta?.scheme_name) {
        throw new MFDataError(`Scheme ${code} not found or has no historical records in database`, 'SCHEME_NOT_FOUND');
      }

      const schemeName = json.meta?.scheme_name || '';
      const directGrowthMatch = isDirectGrowth(schemeName);

      if (enforceDirectGrowth && !directGrowthMatch) {
        throw new MFDataError(`Scheme "${schemeName}" (${code}) is not a verified Direct Plan - Growth scheme`, 'INVALID_PLAN_TYPE');
      }

      // Chronological parsing & Map creation
      const navMap = new Map();
      const sortedHistory = [];

      for (let i = json.data.length - 1; i >= 0; i--) {
        const item = json.data[i];
        const parts = item.date.split('-');
        if (parts.length === 3) {
          const iso = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          const navVal = parseFloat(item.nav);
          if (!isNaN(navVal) && navVal > 0) {
            navMap.set(iso, navVal);
            sortedHistory.push({ date: iso, rawDate: item.date, nav: navVal });
          }
        }
      }

      if (navMap.size === 0) {
        throw new MFDataError(`No valid historical NAV values could be parsed for scheme ${code}`, 'INVALID_DATA');
      }

      const latestItem = json.data[0];
      const processed = {
        meta: {
          ...(json.meta || {}),
          isDirectGrowth: directGrowthMatch
        },
        latestNav: parseFloat(latestItem.nav),
        latestDate: latestItem.date,
        navMap,
        sortedHistory,
        isDirectGrowth: directGrowthMatch
      };

      schemeCache.set(cacheKey, processed);

      try {
        sessionStorage.setItem(`mf_nav_v3_${cacheKey}`, JSON.stringify({
          meta: processed.meta,
          latestNav: processed.latestNav,
          latestDate: processed.latestDate,
          navEntries: Array.from(navMap.entries()).slice(-365 * 10),
          sortedHistory: sortedHistory.slice(-365 * 10),
          isDirectGrowth: processed.isDirectGrowth
        }));
      } catch (e) {
        // Quota exceeded
      }

      return processed;
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new MFDataError(`Request timed out while fetching scheme ${code} (${timeoutMs}ms)`, 'TIMEOUT');
      }
      if (err instanceof MFDataError) {
        throw err;
      }
      throw new MFDataError(err.message || `Failed to retrieve scheme ${code}`, 'NETWORK_ERROR');
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Resolve NAV on a target date, or the immediate next business day if holiday/weekend
 * Forward search convention: up to 7 calendar days
 */
export function getBusinessDayNav(navMap, targetDate) {
  const check = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  for (let offset = 0; offset <= 7; offset++) {
    const key = formatYMD(check);
    if (navMap.has(key)) {
      const parts = key.split('-');
      return {
        dateKey: key,
        rawDate: `${parts[2]}-${parts[1]}-${parts[0]}`,
        nav: navMap.get(key),
        offsetDays: offset
      };
    }
    check.setDate(check.getDate() + 1);
  }
  return null;
}

/**
 * Exact Newton-Raphson XIRR calculation matching Excel & AMFI Factsheet standard
 * Formula: sum( C_i / (1 + r)^((d_i - d_1) / 365) ) = 0
 */
export function calculateXIRR(cashflows, guess = 0.1) {
  if (!cashflows || cashflows.length < 2) return 0;
  
  // Sort chronologically
  const sorted = [...cashflows].sort((a, b) => a.date.getTime() - b.date.getTime());
  const startDate = sorted[0].date;

  const maxIter = 100;
  const tol = 1e-6;
  let rate = guess;

  for (let iter = 0; iter < maxIter; iter++) {
    let fValue = 0;
    let fDerivative = 0;

    for (const cf of sorted) {
      const days = (cf.date.getTime() - startDate.getTime()) / 86400000;
      const years = days / 365.0; // Standard Actual/365 convention
      const factor = Math.pow(1 + rate, years);
      if (factor === 0 || isNaN(factor) || !isFinite(factor)) continue;
      fValue += cf.amount / factor;
      fDerivative -= (years * cf.amount) / (factor * (1 + rate));
    }

    if (Math.abs(fDerivative) < 1e-12) break;
    const newRate = rate - fValue / fDerivative;

    if (Math.abs(newRate - rate) < tol) {
      return newRate * 100;
    }
    
    // Bounds guard to prevent negative divergence
    if (newRate <= -0.99) {
      rate = (rate - 0.99) / 2;
    } else {
      rate = newRate;
    }
  }

  return rate * 100;
}

/**
 * Real Historical SIP Simulation Aligned with Factsheet Standard
 *
 * Rules:
 * 1. Exactly totalMonths = years * 12 installments are executed.
 * 2. Valuation date is the exact latest NAV date of the scheme.
 * 3. Latest installment occurs in valuation month if sipDay <= valuationDate.getDate(),
 *    otherwise in the previous month.
 * 4. Units purchased = monthlyAmount / businessDayNav for every installment.
 * 5. Current valuation = totalUnits * latestNav.
 * 6. Annualized return is calculated using XIRR from actual cashflow dates to valuation date.
 */
export function calculateRealSIP({ schemeData, monthlyAmount, sipDay = 1, years = 3 }) {
  if (!schemeData || !schemeData.navMap) {
    throw new MFDataError('Invalid scheme data supplied for SIP calculation', 'INVALID_DATA');
  }

  const { navMap, latestNav, latestDate } = schemeData;
  const valuationDate = parseLocalDate(latestDate);
  if (!valuationDate) {
    throw new MFDataError('Could not determine valuation date from scheme metadata', 'INVALID_DATA');
  }

  const totalMonths = years * 12;

  // Determine latest installment offset:
  // If sipDay has already occurred in the valuation month (sipDay <= valuationDate.getDate()),
  // the latest installment is in the valuation month (endMonthOffset = 0).
  // Otherwise, the latest installment is in the preceding month (endMonthOffset = 1).
  let endMonthOffset = 0;
  if (valuationDate.getDate() < sipDay) {
    endMonthOffset = 1;
  }

  const transactions = [];
  const cashflows = [];
  let totalInvested = 0;
  let totalUnits = 0;

  for (let i = totalMonths - 1; i >= 0; i--) {
    const monthOffset = i + endMonthOffset;
    const targetScheduledDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - monthOffset, sipDay);
    const navRecord = getBusinessDayNav(navMap, targetScheduledDate);

    if (navRecord) {
      const units = monthlyAmount / navRecord.nav;
      totalUnits += units;
      totalInvested += monthlyAmount;

      const txDate = parseLocalDate(navRecord.dateKey);
      transactions.push({
        scheduledDate: formatYMD(targetScheduledDate),
        executedDate: navRecord.dateKey,
        navDateFormatted: navRecord.rawDate,
        amount: monthlyAmount,
        nav: navRecord.nav,
        units,
        cumulativeUnits: totalUnits
      });

      cashflows.push({
        date: txDate,
        amount: -monthlyAmount // Outflow
      });
    }
  }

  if (transactions.length < totalMonths) {
    const earliestAvailable = schemeData.sortedHistory && schemeData.sortedHistory.length > 0 ? schemeData.sortedHistory[0].rawDate : 'unknown';
    throw new MFDataError(`Insufficient historical NAV records: The fund has data from ${earliestAvailable}, which is insufficient for the requested ${years}-year period (${transactions.length} of ${totalMonths} installments executed).`, 'INSUFFICIENT_HISTORY');
  }

  const currentValuation = totalUnits * latestNav;
  const netGain = currentValuation - totalInvested;
  const absoluteReturnPercent = totalInvested > 0 ? ((netGain / totalInvested) * 100) : 0;

  // Terminal cashflow for XIRR on exact valuation date
  cashflows.push({
    date: valuationDate,
    amount: currentValuation
  });

  const xirr = calculateXIRR(cashflows);

  return {
    schemeName: schemeData.meta?.scheme_name || 'Selected Fund',
    latestNav,
    latestNavDate: latestDate,
    valuationDate: formatYMD(valuationDate),
    totalInvested,
    currentValuation,
    netGain,
    totalUnits,
    absoluteReturnPercent,
    annualizedReturnPercent: xirr,
    installmentsCount: transactions.length,
    firstInstallmentDate: transactions[0]?.navDateFormatted,
    lastInstallmentDate: transactions[transactions.length - 1]?.navDateFormatted,
    convention: TRANSACTION_DATE_CONVENTION,
    transactions
  };
}

/**
 * Real Historical STP Simulation
 */
export function calculateRealSTP({ sourceData, targetData, initialCorpus, monthlyTransfer, transferDay = 1, years = 2 }) {
  if (!sourceData || !targetData) {
    throw new MFDataError('Both source and target fund datasets are required for STP calculation', 'INVALID_DATA');
  }

  const sourceValDate = parseLocalDate(sourceData.latestDate);
  const targetValDate = parseLocalDate(targetData.latestDate);
  const valuationDate = sourceValDate && targetValDate ? (sourceValDate < targetValDate ? sourceValDate : targetValDate) : new Date();

  const totalMonths = years * 12;
  let endMonthOffset = 0;
  if (valuationDate.getDate() < transferDay) {
    endMonthOffset = 1;
  }

  // Day 0: Buy initial units in source fund totalMonths before end
  const startTargetDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - (totalMonths - 1 + endMonthOffset), transferDay);
  const startSourceNavRec = getBusinessDayNav(sourceData.navMap, startTargetDate) || { nav: sourceData.latestNav, rawDate: sourceData.latestDate };
  
  let sourceUnits = initialCorpus / startSourceNavRec.nav;
  let targetUnits = 0;
  let totalTransferred = 0;
  let exhaustedAtMonth = null;
  const transfers = [];

  for (let i = totalMonths - 1; i >= 0; i--) {
    const monthOffset = i + endMonthOffset;
    const targetDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - monthOffset, transferDay);
    const sNavRec = getBusinessDayNav(sourceData.navMap, targetDate);
    const tNavRec = getBusinessDayNav(targetData.navMap, targetDate);

    if (sNavRec && tNavRec && sourceUnits > 0) {
      const curSourceVal = sourceUnits * sNavRec.nav;
      const transferAmt = Math.min(curSourceVal, monthlyTransfer);

      if (transferAmt > 0) {
        const unitsRedeemed = transferAmt / sNavRec.nav;
        const unitsBought = transferAmt / tNavRec.nav;

        sourceUnits = Math.max(0, sourceUnits - unitsRedeemed);
        targetUnits += unitsBought;
        totalTransferred += transferAmt;

        transfers.push({
          scheduledDate: formatYMD(targetDate),
          executedDate: sNavRec.dateKey,
          amount: transferAmt,
          sourceNav: sNavRec.nav,
          targetNav: tNavRec.nav,
          sourceUnitsLeft: sourceUnits,
          targetUnitsAccumulated: targetUnits
        });

        if (sourceUnits <= 0 && !exhaustedAtMonth) {
          exhaustedAtMonth = totalMonths - i;
        }
      }
    }
  }

  if (transfers.length === 0) {
    throw new MFDataError('No historical NAV records matched the chosen STP schedule', 'INVALID_DATA');
  }
  if (!exhaustedAtMonth && transfers.length < totalMonths) {
    throw new MFDataError(`Insufficient historical NAV records: Only ${transfers.length} of ${totalMonths} STP transfers could be executed due to incomplete historical records in selected schemes.`, 'INSUFFICIENT_HISTORY');
  }

  const remainingSourceValuation = sourceUnits * sourceData.latestNav;
  const targetValuation = targetUnits * targetData.latestNav;
  const totalWealth = remainingSourceValuation + targetValuation;
  const netGain = totalWealth - initialCorpus;
  const absoluteReturnPercent = initialCorpus > 0 ? ((netGain / initialCorpus) * 100) : 0;

  return {
    sourceSchemeName: sourceData.meta?.scheme_name || 'Liquid Reserve Fund',
    targetSchemeName: targetData.meta?.scheme_name || 'Equity Accumulation Fund',
    sourceLatestNav: sourceData.latestNav,
    sourceLatestNavDate: sourceData.latestDate,
    targetLatestNav: targetData.latestNav,
    targetLatestNavDate: targetData.latestDate,
    initialCorpus,
    totalTransferred,
    remainingSourceValuation,
    targetValuation,
    totalWealth,
    netGain,
    absoluteReturnPercent,
    sourceUnitsRemaining: sourceUnits,
    remainingSourceUnits: sourceUnits,
    targetUnitsAccumulated: targetUnits,
    exhaustedAtMonth,
    transfersCount: transfers.length,
    convention: TRANSACTION_DATE_CONVENTION,
    transfers
  };
}

/**
 * Real Historical SWP Simulation
 */
export function calculateRealSWP({ schemeData, initialCorpus, monthlyWithdrawal, withdrawDay = 1, years = 3 }) {
  if (!schemeData) {
    throw new MFDataError('Scheme dataset is required for SWP calculation', 'INVALID_DATA');
  }

  const { navMap, latestNav, latestDate } = schemeData;
  const valuationDate = parseLocalDate(latestDate) || new Date();
  const totalMonths = years * 12;

  let endMonthOffset = 0;
  if (valuationDate.getDate() < withdrawDay) {
    endMonthOffset = 1;
  }

  const startTargetDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - (totalMonths - 1 + endMonthOffset), withdrawDay);
  const startNavRec = getBusinessDayNav(navMap, startTargetDate) || { nav: latestNav, rawDate: latestDate };

  let units = initialCorpus / startNavRec.nav;
  let totalWithdrawn = 0;
  let exhaustedAtMonth = null;
  const withdrawals = [];

  for (let i = totalMonths - 1; i >= 0; i--) {
    const monthOffset = i + endMonthOffset;
    const targetDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - monthOffset, withdrawDay);
    const navRec = getBusinessDayNav(navMap, targetDate);

    if (navRec && units > 0) {
      const curVal = units * navRec.nav;
      const withdrawAmt = Math.min(curVal, monthlyWithdrawal);
      const unitsRedeemed = withdrawAmt / navRec.nav;

      units = Math.max(0, units - unitsRedeemed);
      totalWithdrawn += withdrawAmt;

      withdrawals.push({
        scheduledDate: formatYMD(targetDate),
        executedDate: navRec.dateKey,
        amount: withdrawAmt,
        nav: navRec.nav,
        unitsRedeemed,
        remainingUnits: units
      });

      if (units <= 0 && !exhaustedAtMonth) {
        exhaustedAtMonth = totalMonths - i;
      }
    }
  }

  if (withdrawals.length === 0) {
    throw new MFDataError('No historical NAV records matched the chosen SWP schedule', 'INVALID_DATA');
  }
  if (!exhaustedAtMonth && withdrawals.length < totalMonths) {
    throw new MFDataError(`Insufficient historical NAV records: Only ${withdrawals.length} of ${totalMonths} SWP payouts could be processed before historical records ran out.`, 'INSUFFICIENT_HISTORY');
  }

  const remainingValuation = units * latestNav;
  const netTotalBenefit = remainingValuation + totalWithdrawn;
  const netGain = netTotalBenefit - initialCorpus;

  return {
    schemeName: schemeData.meta?.scheme_name || 'Selected Fund',
    latestNav,
    latestNavDate: latestDate,
    initialCorpus,
    totalWithdrawn,
    remainingValuation,
    remainingUnits: units,
    netTotalBenefit,
    netGain,
    exhaustedAtMonth,
    withdrawalsCount: withdrawals.length,
    convention: TRANSACTION_DATE_CONVENTION,
    withdrawals
  };
}

/**
 * Real Historical Lumpsum & SIP Hybrid Simulation
 * 
 * Rules:
 * 1. Initial lumpsum is invested on Day 0 of the historical period.
 *    Initial units = lumpsum / applicable starting NAV.
 *    Lumpsum is accounted only once and NOT counted as recurring monthly contribution.
 * 2. Monthly SIP installments are executed on chosen sipDay for each month in the period.
 *    Monthly units = monthlyAmount / applicable NAV.
 * 3. Initial units and SIP units are tracked separately, then totaled:
 *    Total accumulated units = Initial units + Accumulated SIP units.
 * 4. Portfolio valuation = Total accumulated units * latestNav.
 * 5. Dated cashflows: Day 0 lumpsum (-L), each SIP installment (-S), and terminal valuation (+V).
 * 6. Annualized XIRR calculated across all dated cash flows.
 */
export function calculateRealLumpsumSIP({ schemeData, lumpsumAmount = 500000, monthlyAmount = 20000, sipDay = 1, years = 3 }) {
  if (!schemeData || !schemeData.navMap) {
    throw new MFDataError('Invalid scheme data supplied for Lumpsum & SIP calculation', 'INVALID_DATA');
  }

  const { navMap, latestNav, latestDate } = schemeData;
  const valuationDate = parseLocalDate(latestDate);
  if (!valuationDate) {
    throw new MFDataError('Could not determine valuation date from scheme metadata', 'INVALID_DATA');
  }

  const lump = Math.max(0, parseFloat(lumpsumAmount) || 0);
  const sip = Math.max(0, parseFloat(monthlyAmount) || 0);

  if (lump === 0 && sip === 0) {
    throw new MFDataError('Either initial lumpsum or monthly SIP amount must be greater than zero', 'INVALID_DATA');
  }

  const totalMonths = years * 12;

  let endMonthOffset = 0;
  if (valuationDate.getDate() < sipDay) {
    endMonthOffset = 1;
  }

  const cashflows = [];
  const transactions = [];

  // 1. Initial Lumpsum Execution on Start of Period
  let initialLumpsumUnits = 0;
  let lumpsumNavRecord = null;
  const startTargetDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - (totalMonths - 1 + endMonthOffset), sipDay);

  if (lump > 0) {
    lumpsumNavRecord = getBusinessDayNav(navMap, startTargetDate);
    if (!lumpsumNavRecord) {
      throw new MFDataError(`Could not find starting NAV for historical date near ${formatYMD(startTargetDate)}`, 'INVALID_DATA');
    }

    initialLumpsumUnits = lump / lumpsumNavRecord.nav;
    const lumpTxDate = parseLocalDate(lumpsumNavRecord.dateKey);

    cashflows.push({
      date: lumpTxDate,
      amount: -lump
    });

    transactions.push({
      type: 'Lumpsum',
      scheduledDate: formatYMD(startTargetDate),
      executedDate: lumpsumNavRecord.dateKey,
      navDateFormatted: lumpsumNavRecord.rawDate,
      amount: lump,
      nav: lumpsumNavRecord.nav,
      units: initialLumpsumUnits,
      cumulativeUnits: initialLumpsumUnits
    });
  }

  // 2. Monthly SIP Installments
  let sipUnits = 0;
  let totalSipInvested = 0;

  for (let i = totalMonths - 1; i >= 0; i--) {
    const monthOffset = i + endMonthOffset;
    const targetDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - monthOffset, sipDay);
    const navRecord = getBusinessDayNav(navMap, targetDate);

    if (navRecord && sip > 0) {
      const units = sip / navRecord.nav;
      sipUnits += units;
      totalSipInvested += sip;

      const txDate = parseLocalDate(navRecord.dateKey);
      cashflows.push({
        date: txDate,
        amount: -sip
      });

      transactions.push({
        type: 'SIP',
        scheduledDate: formatYMD(targetDate),
        executedDate: navRecord.dateKey,
        navDateFormatted: navRecord.rawDate,
        amount: sip,
        nav: navRecord.nav,
        units,
        cumulativeUnits: initialLumpsumUnits + sipUnits
      });
    }
  }

  const executedSipCount = transactions.filter(t => t.type === 'SIP').length;
  if (sip > 0 && executedSipCount < totalMonths) {
    const earliestAvailable = schemeData.sortedHistory && schemeData.sortedHistory.length > 0 ? schemeData.sortedHistory[0].rawDate : 'unknown';
    throw new MFDataError(`Insufficient historical NAV records: Scheme data begins on ${earliestAvailable}, which is insufficient for the requested ${years}-year SIP schedule (${executedSipCount} of ${totalMonths} installments executed).`, 'INSUFFICIENT_HISTORY');
  }
  if (transactions.length === 0) {
    throw new MFDataError('No historical NAV records matched the chosen investment schedule', 'INVALID_DATA');
  }

  const totalUnits = initialLumpsumUnits + sipUnits;
  const totalInvested = lump + totalSipInvested;
  const currentValuation = totalUnits * latestNav;
  const lumpsumValuation = initialLumpsumUnits * latestNav;
  const sipValuation = sipUnits * latestNav;
  const netGain = currentValuation - totalInvested;
  const absoluteReturnPercent = totalInvested > 0 ? ((netGain / totalInvested) * 100) : 0;

  // Terminal cashflow for XIRR
  cashflows.push({
    date: valuationDate,
    amount: currentValuation
  });

  const xirr = calculateXIRR(cashflows);

  return {
    schemeName: schemeData.meta?.scheme_name || 'Selected Fund',
    latestNav,
    latestNavDate: latestDate,
    valuationDate: formatYMD(valuationDate),
    initialLumpsum: lump,
    initialLumpsumUnits,
    lumpsumNav: lumpsumNavRecord ? lumpsumNavRecord.nav : null,
    lumpsumDate: lumpsumNavRecord ? lumpsumNavRecord.rawDate : null,
    totalSipInvested,
    sipUnits,
    totalInvested,
    totalUnits,
    lumpsumValuation,
    sipValuation,
    currentValuation,
    netGain,
    absoluteReturnPercent,
    annualizedReturnPercent: xirr,
    installmentsCount: transactions.filter(t => t.type === 'SIP').length,
    firstInstallmentDate: transactions[0]?.navDateFormatted,
    lastInstallmentDate: transactions[transactions.length - 1]?.navDateFormatted,
    convention: TRANSACTION_DATE_CONVENTION,
    transactions
  };
}

/**
 * Real Historical SIP Step-Up Simulation
 * 
 * Rules:
 * 1. Starting monthly amount increases by stepUpPercent each year.
 *    Year 1: S_0 / month
 *    Year 2: S_0 * (1 + g/100) / month
 *    Year 3: S_0 * (1 + g/100)^2 / month
 * 2. For every monthly installment, units = monthlyAmountForYear / applicable NAV.
 * 3. Total units = sum(units); Portfolio valuation = totalUnits * latestNav.
 * 4. Dated cashflows: each installment (-S_m), terminal valuation (+V).
 * 5. Returns annual step-up schedule breakdown for transparency.
 */
export function calculateRealStepUpSIP({ schemeData, initialMonthlyAmount = 25000, stepUpPercent = 10, sipDay = 1, years = 3 }) {
  if (!schemeData || !schemeData.navMap) {
    throw new MFDataError('Invalid scheme data supplied for Step-Up SIP calculation', 'INVALID_DATA');
  }

  const { navMap, latestNav, latestDate } = schemeData;
  const valuationDate = parseLocalDate(latestDate);
  if (!valuationDate) {
    throw new MFDataError('Could not determine valuation date from scheme metadata', 'INVALID_DATA');
  }

  const baseMonthly = Math.max(0, parseFloat(initialMonthlyAmount) || 0);
  if (baseMonthly <= 0) {
    throw new MFDataError('Initial monthly SIP amount must be greater than zero', 'INVALID_DATA');
  }

  const stepUp = Math.max(0, parseFloat(stepUpPercent) || 0);
  const totalMonths = years * 12;

  let endMonthOffset = 0;
  if (valuationDate.getDate() < sipDay) {
    endMonthOffset = 1;
  }

  // Pre-calculate annual schedule
  const annualSchedule = [];
  for (let y = 0; y < years; y++) {
    const monthlyForYear = Math.round(baseMonthly * Math.pow(1 + stepUp / 100, y));
    annualSchedule.push({
      year: y + 1,
      monthlyAmount: monthlyForYear,
      annualTotal: monthlyForYear * 12
    });
  }

  const cashflows = [];
  const transactions = [];
  let totalInvested = 0;
  let totalUnits = 0;

  for (let i = totalMonths - 1; i >= 0; i--) {
    const monthOffset = i + endMonthOffset;
    const targetDate = new Date(valuationDate.getFullYear(), (valuationDate.getMonth()) - monthOffset, sipDay);
    const navRecord = getBusinessDayNav(navMap, targetDate);

    // Month index from 0 to totalMonths - 1 chronologically
    const chronologicalMonthIndex = (totalMonths - 1) - i;
    const yearIndex = Math.floor(chronologicalMonthIndex / 12);
    const monthlyAmt = annualSchedule[yearIndex] ? annualSchedule[yearIndex].monthlyAmount : baseMonthly;

    if (navRecord) {
      const units = monthlyAmt / navRecord.nav;
      totalUnits += units;
      totalInvested += monthlyAmt;

      const txDate = parseLocalDate(navRecord.dateKey);
      cashflows.push({
        date: txDate,
        amount: -monthlyAmt
      });

      transactions.push({
        yearIndex: yearIndex + 1,
        scheduledDate: formatYMD(targetDate),
        executedDate: navRecord.dateKey,
        navDateFormatted: navRecord.rawDate,
        amount: monthlyAmt,
        nav: navRecord.nav,
        units,
        cumulativeUnits: totalUnits
      });
    }
  }

  if (transactions.length < totalMonths) {
    const earliestAvailable = schemeData.sortedHistory && schemeData.sortedHistory.length > 0 ? schemeData.sortedHistory[0].rawDate : 'unknown';
    throw new MFDataError(`Insufficient historical NAV records: Scheme data begins on ${earliestAvailable}, which is insufficient for the requested ${years}-year step-up schedule (${transactions.length} of ${totalMonths} installments executed).`, 'INSUFFICIENT_HISTORY');
  }

  const currentValuation = totalUnits * latestNav;
  const netGain = currentValuation - totalInvested;
  const absoluteReturnPercent = totalInvested > 0 ? ((netGain / totalInvested) * 100) : 0;

  // Terminal cashflow for XIRR
  cashflows.push({
    date: valuationDate,
    amount: currentValuation
  });

  const xirr = calculateXIRR(cashflows);

  return {
    schemeName: schemeData.meta?.scheme_name || 'Selected Fund',
    latestNav,
    latestNavDate: latestDate,
    valuationDate: formatYMD(valuationDate),
    initialMonthlyAmount: baseMonthly,
    stepUpPercent: stepUp,
    annualSchedule,
    totalInvested,
    totalUnits,
    currentValuation,
    netGain,
    absoluteReturnPercent,
    annualizedReturnPercent: xirr,
    installmentsCount: transactions.length,
    firstInstallmentDate: transactions[0]?.navDateFormatted,
    lastInstallmentDate: transactions[transactions.length - 1]?.navDateFormatted,
    convention: TRANSACTION_DATE_CONVENTION,
    transactions
  };
}

