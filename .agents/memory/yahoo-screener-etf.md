---
name: Yahoo Finance Screener ETF API
description: Field formats and auth pattern for Yahoo's POST screener API used in the ETF screener endpoint
---

## Endpoint
POST `https://query2.finance.yahoo.com/v1/finance/screener?crumb=CRUMB&lang=en-US&region=US&formatted=false`

Body: `{ offset, size: 250, sortField: "fundnetassets", sortType: "DESC", quoteType: "ETF", query: { operator: "AND", operands: [{ operator: "EQ", operands: ["region", "us"] }] }, userId: "", userIdType: "guid" }`

## Auth pattern
1. `GET https://fc.yahoo.com` → grab `set-cookie` header first segment
2. `GET https://query2.finance.yahoo.com/v1/test/getcrumb` with that cookie → raw crumb string
3. Pass cookie + crumb to screener POST

## Field formats (critical — confirmed June 2026)
- `regularMarketChangePercent`: **decimal percent** (−0.197 = −0.197%, NOT −19.7%) — do NOT multiply by 100
- `ytdReturn`: already a percentage (11.44 = +11.44%)
- `trailingThreeMonthReturns`: already a percentage (10.29 = +10.29%)
- `fiftyTwoWeekChangePercent`: already a percentage (19.18 = +19.18%)
- `netExpenseRatio`: already a percent (0.03 = 0.03%, NOT 3%) — do NOT multiply by 100
- `netAssets`: raw dollars (2308925030000 = $2.3T AUM)
- `dividendYield`: already a percent (1.01 = 1.01%)

## Scale
- 5,649 US ETFs total · 250 per page = 23 pages
- 6 pages concurrent → ~4 rounds → ~1.6s total (remarkable)
- Cache 10 minutes server-side

**Why:** Screener returns full quote data per ETF in one batch — no separate quote calls needed. 5,649 ETFs vs 320 hardcoded, with AUM/ER/returns included.
