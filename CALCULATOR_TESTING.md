# Vintage Finvest — Calculator Quality Assurance & Financial Calculation Verification Guide

This document provides documentation for the quality assurance, mathematical verification, test harness, and historical mutual fund NAV validation suite for **Vintage Finvest** mutual fund calculators.

---

## 1. Project Testing Overview

Vintage Finvest provides high-net-worth investors, family offices, and retail clients with two calculation methodologies:
1. **Real NAV Historical Backtesting Engine**: Pulls real daily historical Net Asset Value (NAV) records from the Association of Mutual Funds in India (AMFI) via [MFAPI.in](https://api.mfapi.in) to simulate unit purchases, dated cashflows, XIRR returns, and capital accumulation.
2. **Hypothetical CAGR Compounding Engine**: Employs closed-form financial equations (Annuity Due, Reducing-Balance Loan Amortization, Fisher Real Rates) to model projected wealth accumulation under constant annualized compounding assumptions.

This QA suite validates every financial algorithm, edge case, division boundary, date shifting rule, API exception, and UI mode toggle to guarantee zero financial drift, strict compliance with SEBI/AMFI factsheet standards, and resilient error recovery.

---

## 2. Scope and List of Calculators

The test suite covers all **14 modules and calculators** implemented across the Vintage Finvest platform:

| # | Calculator / Module | Engine Type | Data Source | Primary Formulas / Algorithms |
|---|---|---|---|---|
| 1 | **SIP Calculator** | Dual Mode (Real NAV & Hypo) | AMFI / Pure Math | Annuity Due: $FV = P \times \frac{(1+i)^n - 1}{i} \times (1+i)$ & Real NAV units |
| 2 | **Lumpsum + SIP Calculator** | Dual Mode (Real NAV & Hypo) | AMFI / Pure Math | $L \times (1+r)^t$ + Monthly Annuity Due & Day-0 Lumpsum units + Monthly units |
| 3 | **Step-Up SIP Calculator** | Dual Mode (Real NAV & Hypo) | AMFI / Pure Math | Annual stepped installments $P_k = P(1+s)^k$ compounding over remaining tenure |
| 4 | **SIP Cost of Delay Calculator** | Hypothetical Model | Pure Math | Opportunity cost $\Delta FV = FV_{\text{ontime}} - FV_{\text{delayed}}$ & Catch-up SIP equation |
| 5 | **SIP Tenure Calculator** | Hypothetical Model | Pure Math | Inverted logarithmic annuity formula: $n = \lceil \frac{\ln(1 + \frac{T \cdot i}{P(1+i)})}{\ln(1+i)} \rceil$ |
| 6 | **STP Calculator** | Dual Mode (Real NAV & Hypo) | AMFI / Pure Math | Liquid/Debt yield drawdown with concurrent monthly Equity NAV unit purchase |
| 7 | **SWP Calculator** | Dual Mode (Real NAV & Hypo) | AMFI / Pure Math | Monthly capital redemption, units liquidation, and depletion guard |
| 8 | **Child Education Goal** | Hypothetical Model | Pure Math | Education inflation compounding + Annuity Due target accumulation SIP |
| 9 | **Marriage Goal** | Hypothetical Model | Pure Math | Wedding inflation compounding + Annuity Due target accumulation SIP |
| 10 | **Retirement Goal** | Hypothetical Model | Pure Math | Inflation expense projection + Fisher real rate post-retirement annuity corpus |
| 11 | **EMI Calculator** | Standard Loan Model | Pure Math | Reducing balance loan amortization: $\text{EMI} = \frac{L \cdot i \cdot (1+i)^n}{(1+i)^n - 1}$ |
| 12 | **Asset Allocation Diagnostic** | Multi-Asset Allocation | Pure Math | 5 Risk Mandates (Conservative to High-Alpha) across Equity, Debt, Gold & Alts |
| 13 | **Mutual Fund Search & NAV API** | Live API Integration | MFAPI.in / AMFI | Direct Plan Growth regex validation, error mapping, timeout abort, search cache |
| 14 | **Mode Switching Engine** | UI & State Engine | DOM State | Clean isolation between historical backtest and mathematical projection |

---

## 3. Terminology & QA Definitions

To maintain institutional QA standards across development teams, the following testing hierarchy is established:

- **Test Case**: The smallest atomic unit of verification, containing a single set of preconditions, inputs, execution steps, expected outcomes, and pass/fail assertion criteria (e.g., `SIP-001`).
- **Test Scenario**: A high-level end-to-end user journey or operational capability being validated (e.g., *“Verify that zero return rates do not trigger division-by-zero errors in the SIP engine”*).
- **Test Suite**: A logical collection of related test cases executed together to validate a component, module, or integration boundary (e.g., *Independent Financial Calculator Suite* or *Real NAV & Modes Suite*).
- **Test Plan**: The overarching quality roadmap defining scope, risk analysis, resource allocation, schedule, entrance/exit criteria, and defect-triage protocols.
- **Test Script**: The executable code artifact (such as [test_financial_calculators.js](file:///c:/Users/tarad/Downloads/vintage/tests/test_financial_calculators.js), [test_nav_and_modes.js](file:///c:/Users/tarad/Downloads/vintage/tests/test_nav_and_modes.js), or [test_runner.js](file:///c:/Users/tarad/Downloads/vintage/tests/test_runner.js)) that automates the execution and logs the results.

---

## 4. Testing Types Employed

1. **Unit Testing**: Isolated verification of pure mathematical functions with zero external dependencies ([financialCalculators.js](file:///c:/Users/tarad/Downloads/vintage/src/services/financialCalculators.js)).
2. **Deterministic Fixture Testing**: Real NAV functions executed against static synthetic time-series fixtures to guarantee mathematical determinism without network variance.
3. **Integration Testing**: Live query testing against `api.mfapi.in` testing HTTP timeouts, 404s, invalid scheme IDs, and payload schema validation.
4. **Boundary Value Analysis (BVA)**: Evaluating 0%, 1-month horizons, 35-year horizons, 0 principal, and child age equaling college age.
5. **Equivalence Partitioning (EP)**: Validating distinct risk categories (Levels 1 through 5) and plan types (Direct Growth vs. Regular vs. IDCW).
6. **Regression Testing**: Re-running previously failed test cases to ensure fixed defects do not reappear.
7. **Time-Series Historical Backtesting**: Simulating historical daily NAV transactions across trading calendars, weekend forward-rolling, and leap years.

---

## 5. Test Environment & Execution Instructions

### Prerequisites
- Node.js: **v18.0.0 or higher** (ES Modules enabled).
- Operating System: Windows, macOS, or Linux.
- Zero external testing dependencies required (runs natively using standard Node.js runtime).

### Test Scripts Configured in package.json

```bash
# Execute the complete automated test harness (Financial + Real NAV + Modes)
npm test

# Alternatively execute test runner directly:
node tests/test_runner.js

# Run the live AMFI integration & date-regression audit test:
node test_mf_validation.js

# Build the production bundle to verify asset compilation:
npm run build
```

---

## 6. Test Case Inventory with Unique Identifiers

A total of **61 unique test cases** are cataloged and automated in the primary test harness:

### Suite 1: Pure Financial Formulas ([test_financial_calculators.js](file:///c:/Users/tarad/Downloads/vintage/tests/test_financial_calculators.js))
- **`SIP-001`**: Standard 10-year monthly SIP with 12% p.a. CAGR
- **`SIP-002`**: Zero return rate ($r = 0\%$) division guard
- **`SIP-003`**: Zero monthly installment ($P = 0$)
- **`SIP-004`**: Minimum horizon boundary: 1 Year (12 months)
- **`SIP-005`**: Maximum long-horizon 35-year compounding
- **`SIP-006`**: Negative and malformed input clamping
- **`LS-001`**: Combined ₹ 5 Lakhs Lumpsum and ₹ 10,000/mo SIP over 10 years at 12%
- **`LS-002`**: Pure Lumpsum investment with zero monthly SIP
- **`LS-003`**: Pure SIP with zero initial Lumpsum
- **`LS-004`**: Zero return rate across Lumpsum and SIP
- **`STEP-001`**: 3-Year schedule with 10% annual increment and 12% CAGR
- **`STEP-002`**: 0% Step-up increment reduces to standard Flat SIP
- **`STEP-003`**: Zero growth rate with 10% annual step-up
- **`STEP-004`**: 1-Year boundary: step-up occurs only after Month 12
- **`DELAY-001`**: 5-Year postponement on a 20-year ₹ 10,000/mo SIP at 12%
- **`DELAY-002`**: Zero delay: starting on time
- **`DELAY-003`**: Mathematical precision of Catch-Up SIP
- **`TENURE-001`**: Tenure required to accumulate ₹ 1 Crore with ₹ 25,000/mo at 12% CAGR
- **`TENURE-002`**: Zero interest rate linear tenure: $n = \text{Target} / P$
- **`TENURE-003`**: Zero target corpus input boundary
- **`TENURE-004`**: Target corpus less than first monthly installment
- **`EDU-001`**: 10-Year college goal with 10% education inflation and 12% portfolio growth
- **`EDU-002`**: Zero education inflation assumption
- **`EDU-003`**: Immediate college entrance boundary (Child Age $\ge$ College Age)
- **`MAR-001`**: 7-Year wedding goal with 6% inflation and 12% investment return
- **`MAR-002`**: 1-Year short horizon boundary
- **`MAR-003`**: Zero current budget input
- **`RET-001`**: 30-Year horizon retirement planning with Fisher real yield drawdown
- **`RET-002`**: Real rate safety floor ($r_{\text{real}} \ge 1.5\%$) when inflation exceeds post-ret yield
- **`RET-003`**: 1-Year immediate retirement boundary
- **`RET-004`**: Zero living expenses input
- **`RET-005`**: Zero pre-retirement investment return ($0\%$ pre-rate)
- **`EMI-001`**: Standard 20-Year ₹ 50 Lakhs loan at 8.5% interest rate
- **`EMI-002`**: Zero interest rate loan ($0\%$ interest linear amortization)
- **`EMI-003`**: 1-Year short-duration loan (12 installments)
- **`EMI-004`**: Zero loan principal input
- **`EMI-005`**: Negative loan input sanitation
- **`ALLOC-001`**: Level 1 Conservative Mandate: ₹ 1 Crore capital allocation
- **`ALLOC-002`**: Level 3 Balanced Growth Mandate: ₹ 2.5 Crore capital allocation
- **`ALLOC-003`**: Level 5 High Alpha Mandate: ₹ 5 Crore capital allocation

### Suite 2: Real NAV Data, API & Mode Switching ([test_nav_and_modes.js](file:///c:/Users/tarad/Downloads/vintage/tests/test_nav_and_modes.js))
- **`API-001`**: Direct Plan – Growth scheme name regex matching
- **`API-002`**: Rejection of Regular and IDCW / Dividend schemes
- **`API-003`**: Invalid scheme code raises typed MFDataError (`SCHEME_NOT_FOUND`)
- **`API-004`**: Network abort / timeout handling via AbortController (`TIMEOUT`)
- **`API-005`**: Live AMFI scheme metadata and NAV history parsing
- **`REAL-001`**: Strict monotonic chronological NAV ordering (Oldest to Newest)
- **`REAL-002`**: Non-trading day forward resolution (Sunday rolls forward to Monday)
- **`REAL-003`**: 7-Calendar-day limit guard on missing NAV forward search
- **`REAL-004`**: Deterministic 36-month Real SIP backtest on controlled NAV fixture
- **`REAL-005`**: Combined Lumpsum and monthly SIP backtest on historical NAV fixture
- **`REAL-006`**: 3-Year Step-Up SIP (10% annual increment) schedule on Real NAV data
- **`REAL-007`**: XIRR Newton-Raphson convergence on known dated cash flow
- **`REAL-008`**: 2-Year Real STP: Debt source redemption and Equity target accumulation
- **`REAL-009`**: Real SWP: Sustainable monthly payouts vs capital exhaustion guard
- **`REAL-010`**: Insufficient history raises typed `INSUFFICIENT_HISTORY` error in strict mode
- **`REAL-011`**: Graceful partial history execution with transparent advisory notice
- **`REAL-012`**: 10-Year full historical SIP backtest on Parag Parikh Flexi Cap (`122639`)
- **`MODE-001`**: Preservation of monthly investment and horizon inputs across mode toggles
- **`MODE-002`**: UI controls dynamically adapt between Real and Hypothetical modes
- **`MODE-003`**: Prohibition of silent fallback from Real NAV errors to CAGR projection
- **`MODE-004`**: User-directed error recovery button provides seamless switch to Hypothetical mode

---

## 7. Complete Test Execution Results & Statuses

All **61 tests were executed** against the codebase using `node tests/test_runner.js`. Results are summarized below:

| Test ID | Module | Inputs | Expected Result | Actual Result | Status | Severity |
|---|---|---|---|---|---|---|
| **SIP-001** | SIP Calculator | ₹ 10k/mo, 12% p.a., 10 yrs | Inv: ₹ 12L, FV: ₹ 23,23,391 | Inv: ₹ 12L, FV: ₹ 23,23,391 | **PASS** | Critical |
| **SIP-002** | SIP Calculator | ₹ 15k/mo, 0% p.a., 5 yrs | Inv: ₹ 9L, FV: ₹ 9L, Gain: ₹ 0 | Inv: ₹ 9L, FV: ₹ 9L, Gain: ₹ 0 | **PASS** | High |
| **SIP-003** | SIP Calculator | ₹ 0/mo, 15% p.a., 10 yrs | Inv: ₹ 0, FV: ₹ 0, Gain: ₹ 0 | Inv: ₹ 0, FV: ₹ 0, Gain: ₹ 0 | **PASS** | Medium |
| **SIP-004** | SIP Calculator | ₹ 25k/mo, 12% p.a., 1 yr | Inv: ₹ 3L, FV: ₹ 3,20,233 | Inv: ₹ 3L, FV: ₹ 3,20,233 | **PASS** | High |
| **SIP-005** | SIP Calculator | ₹ 10k/mo, 15% p.a., 35 yrs | Inv: ₹ 42L, FV: > ₹ 14 Cr | Inv: ₹ 42L, FV: ₹ 14.84 Cr | **PASS** | Medium |
| **SIP-006** | SIP Calculator | -₹ 5k/mo, -10%, -5 yrs | Inv: ₹ 0, FV: ₹ 0, Gain: ₹ 0 | Inv: ₹ 0, FV: ₹ 0, Gain: ₹ 0 | **PASS** | High |
| **LS-001** | Lumpsum & SIP | ₹ 5L lump, ₹ 10k sip, 12%, 10y | Total Inv: ₹ 17L, Wealth: ₹ 38,76,315 | Total Inv: ₹ 17L, Wealth: ₹ 38,76,315 | **PASS** | Critical |
| **LS-002** | Lumpsum & SIP | ₹ 10L lump, ₹ 0 sip, 15%, 5y | Total Inv: ₹ 10L, Wealth: ₹ 20,11,357 | Total Inv: ₹ 10L, Wealth: ₹ 20,11,357 | **PASS** | High |
| **LS-003** | Lumpsum & SIP | ₹ 0 lump, ₹ 20k sip, 12%, 5y | Match pure SIP: ₹ 16,49,727 | Matches pure SIP: ₹ 16,49,727 | **PASS** | High |
| **LS-004** | Lumpsum & SIP | ₹ 5L lump, ₹ 10k sip, 0%, 5y | Total Wealth: ₹ 11,00,000, Gain: 0 | Total Wealth: ₹ 11,00,000, Gain: 0 | **PASS** | Medium |
| **STEP-001** | Step-Up SIP | ₹ 10k/mo, 10% step, 12%, 3y | Inv: ₹ 3,97,200, FV: ₹ 4,89,681 | Inv: ₹ 3,97,200, FV: ₹ 4,89,681 | **PASS** | Critical |
| **STEP-002** | Step-Up SIP | ₹ 15k/mo, 0% step, 13%, 5y | Advantage: exactly ₹ 0 | Advantage: ₹ 0 | **PASS** | High |
| **STEP-003** | Step-Up SIP | ₹ 10k/mo, 10% step, 0%, 2y | Inv: ₹ 2,52,000, FV: ₹ 2,52,000 | Inv: ₹ 2,52,000, FV: ₹ 2,52,000 | **PASS** | Medium |
| **STEP-004** | Step-Up SIP | ₹ 20k/mo, 15% step, 12%, 1y | Month 1-12 step-up adv: ₹ 0 | Step-up adv: ₹ 0 | **PASS** | High |
| **DELAY-001** | Cost of Delay | ₹ 10k/mo, 5y delay, 20y horiz | Cost: ₹ 49,60,653, Catchup: ₹ 20,772 | Cost: ₹ 49,60,653, Catchup: ₹ 20,772 | **PASS** | Critical |
| **DELAY-002** | Cost of Delay | ₹ 25k/mo, 0y delay, 10y horiz | Cost of Delay: ₹ 0 | Cost of Delay: ₹ 0 | **PASS** | High |
| **DELAY-003** | Cost of Delay | ₹ 10k/mo, 5y delay, 15y, 12% | Catchup SIP recreates Ontime FV | Exactly regenerates ₹ 50.45L | **PASS** | High |
| **TENURE-001** | SIP Tenure | Target: ₹ 1 Cr, ₹ 25k/mo, 12% | 161 months (13 Yrs 5 Mos) | 161 months (13 Yrs 5 Mos) | **PASS** | Critical |
| **TENURE-002** | SIP Tenure | Target: ₹ 50L, ₹ 50k/mo, 0% | 100 months (8 Yrs 4 Mos) | 100 months (8 Yrs 4 Mos) | **PASS** | High |
| **TENURE-003** | SIP Tenure | Target: ₹ 0, ₹ 25k/mo, 12% | 0 months | 0 months | **PASS** | Medium |
| **TENURE-004** | SIP Tenure | Target: ₹ 10k, ₹ 20k/mo, 12% | 1 month | 1 month | **PASS** | Low |
| **EDU-001** | Child Education | Age 8, Coll 18, ₹ 25L, 10% inf | Fut: ₹ 64,84,356, SIP: ₹ 27,909 | Fut: ₹ 64,84,356, SIP: ₹ 27,909 | **PASS** | Critical |
| **EDU-002** | Child Education | Age 5, Coll 18, 0% inf | Fut Cost: ₹ 30,00,000 | Fut Cost: ₹ 30,00,000 | **PASS** | Medium |
| **EDU-003** | Child Education | Age 18, Coll 18 boundary | Clamps to min 1 year horizon | Clamped to 1 year | **PASS** | High |
| **MAR-001** | Marriage Goal | 7y, ₹ 30L today, 6% inf, 12% | Fut: ₹ 45,10,892, SIP: ₹ 34,228 | Fut: ₹ 45,10,892, SIP: ₹ 34,228 | **PASS** | High |
| **MAR-002** | Marriage Goal | 1y, ₹ 15L today, 5% inf, 10% | Fut: ₹ 15,75,000 | Fut: ₹ 15,75,000 | **PASS** | Medium |
| **MAR-003** | Marriage Goal | 5y, ₹ 0 today | Req SIP: ₹ 0 | Req SIP: ₹ 0 | **PASS** | Low |
| **RET-001** | Retirement | Age 30-60, ₹ 50k exp, 6% inf | Corpus: ₹ 6.45 Cr, SIP: ₹ 18,280 | Corpus: ₹ 6.45 Cr, SIP: ₹ 18,280 | **PASS** | Critical |
| **RET-002** | Retirement | 9% inf, 8.5% post yield | Real rate floored at 1.5% | Floored at 1.5% | **PASS** | High |
| **RET-003** | Retirement | Age 59 to 60 immediate | 1-year accumulation horizon | 1-year horizon executed | **PASS** | High |
| **RET-004** | Retirement | 0 monthly living expenses | Corpus: ₹ 0, Req SIP: ₹ 0 | Corpus: ₹ 0, Req SIP: ₹ 0 | **PASS** | Medium |
| **RET-005** | Retirement | Age 40-60, 0% pre-rate | Req SIP = Corpus / 240 mos | Req SIP = Corpus / 240 mos | **PASS** | Medium |
| **EMI-001** | EMI Calculator | ₹ 50L, 8.5% p.a., 20y loan | EMI: ₹ 43,391.16/mo | EMI: ₹ 43,391.16/mo | **PASS** | Critical |
| **EMI-002** | EMI Calculator | ₹ 12L, 0% p.a., 5y loan | EMI: ₹ 20,000/mo, Interest: 0 | EMI: ₹ 20,000/mo, Interest: 0 | **PASS** | High |
| **EMI-003** | EMI Calculator | ₹ 1L, 12% p.a., 1y loan | EMI: ₹ 8,884.88/mo | EMI: ₹ 8,884.88/mo | **PASS** | Medium |
| **EMI-004** | EMI Calculator | Principal: ₹ 0 | EMI: ₹ 0, Interest: ₹ 0 | EMI: ₹ 0, Interest: ₹ 0 | **PASS** | Low |
| **EMI-005** | EMI Calculator | Negative principal & rate | Sanitized to ₹ 0 | Sanitized to ₹ 0 | **PASS** | Medium |
| **ALLOC-001** | Asset Alloc | Level 1 Conservative, ₹ 1 Cr | Eq: 15L, Debt: 65L, Gold: 15L, Alt: 5L | Exact match, Sum = ₹ 1 Cr | **PASS** | High |
| **ALLOC-002** | Asset Alloc | Level 3 Balanced, ₹ 2.5 Cr | Eq: 1.375 Cr, Debt: 62.5L, Gold: 25L | Exact match, Sum = ₹ 2.5 Cr | **PASS** | High |
| **ALLOC-003** | Asset Alloc | Level 5 High Alpha, ₹ 5 Cr | Eq: 4 Cr, Debt: 25L, Gold: 25L, Alt: 50L | Exact match, Sum = ₹ 5 Cr | **PASS** | Medium |
| **API-001** | Search & API | 4 Direct Growth scheme names | All 4 matched true | All 4 matched true | **PASS** | Critical |
| **API-002** | Search & API | Regular & IDCW scheme names | All 3 matched false | All 3 matched false | **PASS** | Critical |
| **API-003** | Search & API | Scheme Code 9999999 | Throws `SCHEME_NOT_FOUND` | Caught typed `SCHEME_NOT_FOUND` | **PASS** | High |
| **API-004** | Search & API | Aborted signal + forceRefresh | Throws `TIMEOUT` | Caught typed `TIMEOUT` | **PASS** | High |
| **API-005** | Search & API | Live Scheme 122639 | Code: 122639, History > 2500 | Code: 122639, Records: 3290 | **PASS** | Critical |
| **REAL-001** | Real NAV | Scheme 122639 dataset | Monotonic oldest to newest | Monotonic across 3290 rows | **PASS** | Critical |
| **REAL-002** | Real NAV | Sunday 2026-10-11 request | Rolls forward to Mon 2026-10-12 | Resolved: 2026-10-12, NAV: 102.5 | **PASS** | High |
| **REAL-003** | Real NAV | 14-day holiday gap | Returns null (> 7 day limit) | Returned null | **PASS** | High |
| **REAL-004** | Real NAV | 3-yr synthetic fixture, ₹ 10k | 36 installments, Gain > 0 | 36 installments, Gain verified | **PASS** | Critical |
| **REAL-005** | Real NAV | ₹ 2L lump + ₹ 5k sip, 3y | 36 SIPs, 1 Lumpsum Day-0 | Total units = Lump + SIP units | **PASS** | Critical |
| **REAL-006** | Real NAV | 3y Step-Up (10%), ₹ 10k base | Yr1: 10k, Yr2: 11k, Yr3: 12.1k | Stepped schedule executed | **PASS** | High |
| **REAL-007** | Real NAV | 1-year 10% dated cashflow | XIRR converges to 10.00% | Converged: 9.97% (~10.0%) | **PASS** | Critical |
| **REAL-008** | Real NAV | 2y STP: ₹ 10L corpus, ₹ 25k/m | 24 transfers, dual valuations | 24 transfers, Debt + Eq wealth | **PASS** | High |
| **REAL-009** | Real NAV | Sustainable vs Exhaustion | Exhaustion triggered month 2 | Month 2 depletion, Units = 0 | **PASS** | Critical |
| **REAL-010** | Real NAV | 5y request on 1y data, strict | Throws `INSUFFICIENT_HISTORY` | Caught `INSUFFICIENT_HISTORY` | **PASS** | Critical |
| **REAL-011** | Real NAV | 5y request, `allowPartial` | Executes 12 installments + notice | `isPartialHistory: true`, Notice | **PASS** | High |
| **REAL-012** | Real NAV | Parag Parikh Flexi Cap 10y | 120 installments, XIRR > 14% | 120 of 120 executed, 16.28% XIRR | **PASS** | Critical |
| **MODE-001** | Mode Switching | ₹ 25k/mo, 10y slider position | Form state preserved | Form state preserved | **PASS** | High |
| **MODE-002** | Mode Switching | Toggle Real $\leftrightarrow$ Hypo | Dynamic DOM control display | Controls toggled cleanly | **PASS** | Medium |
| **MODE-003** | Mode Switching | API error in Real Mode | No silent CAGR fallback | Throws typed error banner | **PASS** | Critical |
| **MODE-004** | Mode Switching | Live data error banner | Switch to Hypo button present | Button present and functional | **PASS** | High |

---

## 8. Independent Reference Formulas & Mathematical Assumptions

### 1. SIP Compounding Formula (Annuity Due)
In Indian mutual fund investing, SIP installments are debited and invested at the **beginning of each monthly installment period** rather than at the end. Thus, the annuity due formula applies:

$$i = \frac{r}{12}$$

$$n = t \times 12$$

$$FV = P \times \left[ \frac{(1 + i)^n - 1}{i} \right] \times (1 + i)$$

*Zero-Rate Special Case*:
$$\lim_{i \to 0} FV = P \times n$$

### 2. Reducing-Balance Loan EMI
Amortization follows standard compound interest reducing-balance schedules:

$$\text{EMI} = \frac{L \times i \times (1 + i)^n}{(1 + i)^n - 1}$$

Where:
- $L$ = Loan Principal
- $i = \frac{\text{Annual Interest Rate}}{12}$
- $n = \text{Tenure in Years} \times 12$
- *Zero-Rate Special Case*: $\lim_{i \to 0} \text{EMI} = \frac{L}{n}$

### 3. Logarithmic Inversion for SIP Tenure
Given a target wealth $T$, monthly installment $P$, and monthly rate $i$:

$$T = P \times \frac{(1+i)^n - 1}{i} \times (1+i)$$

$$1 + \frac{T \cdot i}{P(1+i)} = (1+i)^n$$

$$n = \left\lceil \frac{\ln\left(1 + \frac{T \cdot i}{P(1+i)}\right)}{\ln(1+i)} \right\rceil$$

### 4. Fisher Real Return Rate & Retirement Corpus
To account for purchasing power erosion during a 25-year post-retirement drawdown, the real return yield $r_{\text{real}}$ is calculated via the Fisher equation:

$$r_{\text{real}} = \max\left(0.015, \; \frac{r_{\text{post}} - r_{\text{inf}}}{1 + r_{\text{inf}}}\right)$$

The required retirement corpus for $L = 25$ years of post-retirement living expenses is:

$$\text{Corpus} = \text{AnnualExpense}_{\text{atRet}} \times \left[ \frac{1 - (1 + r_{\text{real}})^{-L}}{r_{\text{real}}} \right]$$

---

## 9. Examples of Hand-Verified Calculations

### Hand-Verified Example 1: 1-Year SIP at ₹ 10,000/mo and 12% p.a.
- Monthly installment: $P = 10,000$
- Nominal monthly rate: $i = 0.12 / 12 = 0.01$
- Installments: $n = 12$
- Factor: $(1.01)^{12} = 1.1268250301$
- Annuity factor: $\frac{1.1268250301 - 1}{0.01} = 12.68250301$
- Annuity due factor: $12.68250301 \times 1.01 = 12.80932804$
- **Future Value**: $10,000 \times 12.80932804 = \mathbf{₹\ 1,28,093.28}$
- **Invested Capital**: $10,000 \times 12 = \mathbf{₹\ 1,20,000.00}$
- **Wealth Gain**: $1,28,093.28 - 1,20,000.00 = \mathbf{₹\ 8,093.28}$
- *Code Result*: `calculateHypotheticalSIP({ monthlyAmount: 10000, annualRate: 12, years: 1 })` returns `128093.28`. **Matched to 0.01 tolerance.**

### Hand-Verified Example 2: Home Loan EMI for ₹ 50 Lakhs at 8.5% for 20 Years
- Principal: $L = 50,00,000$
- Monthly rate: $i = \frac{0.085}{12} = 0.0070833333$
- Months: $n = 240$
- Compounding factor: $(1 + 0.0070833333)^{240} = 5.4190822$
- Numerator: $5000000 \times 0.0070833333 \times 5.4190822 = 191925.91$
- Denominator: $5.4190822 - 1 = 4.4190822$
- **Monthly EMI**: $\frac{191925.91}{4.4190822} = \mathbf{₹\ 43,391.16}$
- **Total Repayment**: $43391.16 \times 240 = \mathbf{₹\ 1,04,13,878.40}$
- **Total Interest**: $1,04,13,878.40 - 50,00,000 = \mathbf{₹\ 54,13,878.40}$
- *Code Result*: `calculateEMI({ principal: 5000000, annualRate: 8.5, tenureYears: 20 })` returns `43391.16`. **Matched to 0.01 tolerance.**

---

## 10. Real NAV Verification Methodology

The real historical backtesting engine strictly complies with AMFI and SEBI reporting protocols:

1. **Strict Monotonic Chronological Sorting**:
   AMFI historical endpoints stream data in reverse chronological order (newest date first). The engine reverses and validates that timestamps strictly satisfy:
   $$t_0 < t_1 < t_2 < \dots < t_N$$

2. **Weekend & Holiday Forward-Rolling (AMFI Next-Business-Day Convention)**:
   Mutual fund NAVs are never computed on non-trading days (Saturdays, Sundays, statutory holidays). When an SIP installment date lands on a non-trading day, the engine traverses forward day-by-day:
   $$\text{ApplicableNAV}(d) = \min_{k \ge 0} \{\text{NAV}(d + k) \mid \text{NAV}(d + k) \text{ exists and } k \le 7\}$$
   If no NAV is published within 7 calendar days, the lookup returns `null`, preventing association with stale prices.

3. **Dated Cash Flow XIRR Calculation via Newton-Raphson**:
   Annualized compound growth is evaluated across all dated cash flows:
   $$\sum_{i=1}^{M} \frac{C_i}{(1 + r)^{\frac{d_i - d_1}{365}}} = 0$$
   The solver applies Newton-Raphson iteration with boundary safeguards:
   $$r_{k+1} = r_k - \frac{f(r_k)}{f'(r_k)}$$
   Terminating when $|r_{k+1} - r_k| < 10^{-6}$.

---

## 11. API Error and Insufficient-History Tests

The platform includes comprehensive guards for network disruptions and data anomalies:

1. **Network Timeouts & AbortController**:
   API calls are wrapped with an `AbortController` bounded by `timeoutMs` (default 10,000ms). Aborted requests throw typed `MFDataError('...', 'TIMEOUT')`.
2. **Invalid Scheme Codes**:
   Querying non-existent codes (e.g. `9999999`) throws typed `MFDataError('...', 'SCHEME_NOT_FOUND')`.
3. **Empty / Corrupt Responses**:
   Responses lacking valid `data` arrays throw `MFDataError('...', 'INVALID_DATA')`.
4. **Regular & Dividend Plan Rejection**:
   Schemes not matching direct growth naming are filtered out or rejected with `INVALID_PLAN_TYPE`.

---

## 12. Root Cause Investigation: The 10-Year Historical SIP Error

### Reported Error
> *"Insufficient historical NAV records: The fund has data from 31-08-2020, which is insufficient for the requested 10-year period (74 of 120 installments executed)."*

### Root Cause Analysis & Verification

1. **Fund Identity**:
   The default fund selected was Scheme Code `148457` (*Nippon India Multi Asset Allocation Fund - Direct Plan - Growth*).
2. **Inception Date**:
   Authoritative AMFI records verify that Nippon India Multi Asset Allocation Fund was launched on **August 31, 2020**.
3. **Elapsed Calendar History**:
   From August 31, 2020 to October 2026, exactly **74 calendar months** have elapsed.
4. **Installment Calculation**:
   A 10-year monthly SIP requires:
   $$10 \text{ years} \times 12 \text{ months} = 120 \text{ installments}$$
   Because the fund did not exist prior to August 2020, exactly **74 installments** could physically be executed. The system's reporting of **74 of 120 installments executed** is **mathematically exact**.

### Why This is NOT a Code Bug
The error message was a **designed compliance feature**, not a defect. SEBI regulations prohibit fabricating historical mutual fund NAVs or backdating performance for periods before a fund was incepted.

### Implemented Resolutions
To optimize user experience while strictly adhering to financial compliance:
1. **Dynamic Horizon Slider Clamping**:
   When a user selects Real NAV mode for a scheme, the horizon slider's maximum allowable value dynamically clamps to the fund's actual live history:
   $$\text{MaxYears} = \min\left(10, \left\lfloor \frac{\text{RecordCount}}{248} \right\rfloor\right)$$
   For Nippon Multi Asset Allocation Fund, the slider clamps to 6 years.
2. **10-Year Benchmark Fund Support**:
   For testing 10-year histories, the curated selection includes **Parag Parikh Flexi Cap Fund - Direct Plan - Growth (Code 122639)**. Parag Parikh launched on May 28, 2013 (>13 years of continuous AMFI NAV data). In our automated test `REAL-012`, Parag Parikh successfully executes **120 of 120 installments**, accumulating ₹ 12,00,000 invested into ₹ 27,85,000+ portfolio value at 16.28% XIRR.
3. **Explicit Error Recovery Button**:
   When an insufficient history exception occurs, the error banner presents an accessible, one-click button:
   `"Switch to Hypothetical CAGR Projection"`
   This seamlessly switches the engine to hypothetical compounding mode, projecting all 120 installments at the user's desired CAGR without data errors.

---

## 13. Regression Testing Procedure

To prevent regressions during future development:
1. Run the test harness prior to staging commits:
   ```bash
   npm test
   ```
2. Run the full AMFI historical verification audit:
   ```bash
   node test_mf_validation.js
   ```
3. Verify that all 61 primary tests and 56 validation tests pass with zero failures.
4. Verify production build integrity:
   ```bash
   npm run build
   ```

---

## 14. Test Execution Summary

```
======================================================================
TEST EXECUTION METRICS:
======================================================================
  Total Test Cases in Primary Harness: 61
  Total Additional Audit Cases:        56
  Total Test Executions:               117
  ------------------------------------------------------------------
  ✓ Passed:                            117 (100.0%)
  ✗ Failed:                            0   (0.0%)
  ⊘ Blocked:                           0   (0.0%)
  ⏸ Not Run:                           0   (0.0%)
  Execution Elapsed Time:              ~1.5 seconds total
======================================================================
```

---

## 15. Steps for Adding Future Test Cases

1. **Adding a Financial Calculation Test**:
   - Open [test_financial_calculators.js](file:///c:/Users/tarad/Downloads/vintage/tests/test_financial_calculators.js).
   - Compute the expected result using an independent closed-form formula.
   - Call `recordTest({...})` with a unique ID (e.g. `SIP-007`).
   - Run `npm test` to verify.

2. **Adding a Real NAV or API Test**:
   - Open [test_nav_and_modes.js](file:///c:/Users/tarad/Downloads/vintage/tests/test_nav_and_modes.js).
   - Use `createMockSchemeData(code, name, history)` for deterministic offline fixtures or live `fetchSchemeData(code)`.
   - Call `recordTest({...})` with a unique ID (e.g. `REAL-013`).
   - Run `npm test` to verify.
