# Reviewed provider contract

`StockProvider` in `src/providers/types.ts` is the extension interface for regional licensed APIs. The initial registry uses `ReviewedFileProvider`. It reads an operator-prepared structured export and checks it against the source review; it does not request a portal's market API.

## Files

Keep all files below inside a job. Paths use `/`, are relative to the job and cannot escape it through `..`, absolute paths or symlinks.

- `provider-data.json`: a complete `FactDocument` (see `src/domain/stock.ts`). Start from the unverified template created by `job:init`.
- `evidence/*`: legally obtained source text/JSON/screenshot/PDF or other evidence reviewed against each fact. Each entry names the source URL and retrieval time of that evidence.
- `inputs/concept.png`: real AI-generated square PNG, with model/prompt/time/license metadata. Arbitrary stock photos are not a substitute.
- `source-hints.json`: binds data, evidence, official site and concept provenance to a reviewed fingerprint.

No template contains valid financial values. Tests under `tests/fixtures/` are synthetic and may not be used for a real post.

## FactDocument fields

Top-level: `schemaVersion:1`, the exact `jobId`/`asOfDate` from `request.json`, `identity`, `overview`, `quote`, `marketCap`, `range52w`, `business`, `outlook`.

`identity`: `assetType:'stock'`, string `ticker`, `market`, `issuerName`, `mic`, `exchange`, `securityType` (`common_stock`, `preferred_stock`, `adr`), `currency`, `status:'active'`, `verified:true`, HTTPS `sourceUrl`, nonempty `evidenceIds`.

| Market | MIC | Exchange | Currency |
|---|---|---|---|
| KRX:KOSPI | XKRX | KOSPI | KRW |
| KRX:KOSDAQ | XKRX | KOSDAQ | KRW |
| NASDAQ | XNAS | NASDAQ | USD |
| NYSE | XNYS | NYSE | USD |

Every following fact is a `VerifiedValue<T>` with unique `factId`, typed `value`, HTTPS `sourceUrl`, `sourceName`, ISO `retrievedAt`/`asOf` including timezone offset, IANA `timezone`, `status:'verified'`, `method:'official_direct'|'licensed_provider'|'derived'`, nonempty `evidenceIds`.

| Fact | value shape |
|---|---|
| overview | `{summary:string,industry:string}`; short reviewed company summary |
| quote | `{amount:number,currency:string,mic:string,priceBasis:string,kind:'close'|'intraday'|'delayed',delayMinutes:number}` |
| marketCap | `{amount:number,currency:string,kind:'total'}`; optional rank/derivation below |
| range52w | `{low:number,high:number,currency:string,mic:string,priceBasis:string,definition:'close'|'intraday',periodFrom:'YYYY-MM-DD',periodTo:'YYYY-MM-DD'}` |
| business | `{segments:[{name:string,description:string,revenueShare?:number}],revenueBasis?:...}`; 2–4 segments |
| outlook | `{positive:[string],caution:[string]}`; 1–2 entries on each side |

Optional rank: `{value:positiveInteger,population:string,rules:string,asOf:timestamp,sourceUrl:HTTPS,evidenceIds:[string]}`. If unavailable, omit it completely.

Derived cap: set method `derived` and value.derivation `{shareCount:number,shareBasis:'issued'|'outstanding',priceAsOf:timestamp,sharesAsOf:timestamp,sourceUrl:HTTPS,evidenceIds:[string]}`. Quote, share count and published cap timestamps must agree. Amount must equal `quote.amount * shareCount`. A changing share count cannot be carried to a new date silently.

Revenue basis: `{fiscalYear:'YYYY',scope:string,mutuallyExclusive:true,complete:true,sourceUrl:HTTPS,evidenceIds:[string]}`. Supply a share for every segment and match the complete official total. Do not add percentages when scope/date/complete total is unknown.

## source-hints.json

```json
{
  "schemaVersion": 1,
  "provider": {
    "kind": "reviewed_file",
    "relativePath": "provider-data.json",
    "sha256": "<actual 64-character lowercase SHA-256>",
    "permission": {"status":"approved","basis":"<actual usage permission>"}
  },
  "officialSite": {
    "url":"<verified official company overview HTTPS URL>",
    "hostname":"<exact host>",
    "selector":"<one visible company overview element>",
    "requiredLabels":["<verified issuer name>"],
    "issuerName":"<same issuer name as identity>",
    "verificationUrl":"<authority used to verify company domain>",
    "licenseNote":"<actual capture/use permission>"
  },
  "evidence": [{
    "evidenceId":"quote-evidence",
    "relativePath":"evidence/quote.json",
    "sourceUrl":"<same source URL as the bound fact>",
    "sha256":"<actual evidence SHA-256>",
    "retrievedAt":"<same retrieval time as the bound fact>",
    "licenseNote":"<actual evidence use rights>",
    "factIds":["quote","range_52w"]
  }],
  "review": {"status":"pending","reviewedBy":"","reviewedAt":"","basisFingerprint":""},
  "concept": {
    "kind":"reviewed_import","relativePath":"inputs/concept.png",
    "sha256":"<actual input image SHA-256>",
    "model":"<generation model>","prompt":"<full actual generation prompt>",
    "generatedAt":"<ISO generation timestamp>","licenseNote":"<actual image rights>",
    "reviewStatus":"approved"
  }
}
```

The example is a field guide, not valid input. `source:inspect` reports actual file hashes and, once metadata is complete, `basisFingerprint`. Add enough evidence entries to cover `identity` and every fact, including separate rank/share-count/revenue-basis sources. Evidence binding checks URLs, fact IDs, hashes and retrieval time. The operator must inspect evidence content and verify its values; hashing alone cannot prove factual accuracy.

After reviewing the actual source values and all metadata, run `source:approve --job <absolute path> --fingerprint <basisFingerprint> --reviewer <name>`. The CLI verifies structural/date/evidence integrity before recording the attestation. Changing the provider, evidence, official capture specification or concept metadata invalidates it.

## New adapters

Implement every `StockProvider` method, return the same strict `VerifiedValue` contracts, and register the adapter explicitly. Require credential configuration outside Git, a lawful usage basis, original evidence with hashes and source dates; never store secrets in facts/receipts. An API's missing or blocked response is `needs_user`, never a fixture fallback. Keep market adapters independent from official-site/filing adapters so their source times and licences remain explicit.

## Source screenshot mode

### Writing-date research for new manuscripts

New source-screen jobs set `conditions.editorialStyle: 'reader_focused_v2'`. Add `marketResearch` as a normal `VerifiedValue<MarketResearch>` with its own unique factId, source URL/name, retrieval/asOf timestamps, verification status/method and evidenceIds. It participates in all provider hashes, source reviews and evidence bindings. Do not manufacture a verified record from a screenshot or a template.

Its value contains `writingDate`, `tradingDate`, `nonTradingDates`, `currency`, `mic`, `priceBasis`, and `chart: {periodFrom, periodTo, trend: 'up'|'down'|'sideways', summary, volumeSummary}`. `writingDate` equals the job's asOfDate. `tradingDate` and research.asOf agree with the verified quote date. Every intervening calendar date must appear in `nonTradingDates` and be supported by reviewed exchange-calendar evidence. An empty array is used for same-day data. Weekend and weekday-holiday dates are both recorded; do not assume Friday traded. The calendar claim is an operator-reviewed source attestation, not an automatic holiday lookup.

The chart represents approximately one year ending on tradingDate, with the quote's market/currency/adjustment basis. Its description and volume summary need actual price/volume source evidence and review; a 52-week high/low pair is insufficient. Optional `return1m: {percent, periodFrom, periodTo}` must have its actual provider period, end on tradingDate and use the same basis. If not supplied, omit 1M rather than carrying an older figure forward.

Also provide `outlook.value.growthImpact`: a reviewed, conditional positive description of the specific business and how it could contribute to sales/profit. It uses the outlook fact's evidence bindings. Missing research or growth-impact evidence stops the new style with needs_user. Older jobs with no editorialStyle and no added fields retain their prior output and fingerprint.

Capture settings live in capture-hints.json, separately from source-hints.json. collect:run in stock_sources_five_v1 verifies only the reviewed financial export and writes facts/receipts; no browser is required. post:prepare combines it with a complete current capture manifest. Market overview and price history require matching date, currency unit and market scope; price history additionally needs the exact provider adjustment definition and a reviewed chart-period mapping. Preserve raw visible labels in capture metadata. When labels differ, financialMapping.priceBasis must name an evidenceId already bound to the quote and the exact reviewed provider definition. A one_year chart remains independent of the financial 52-week numeric period; explicit chart dates are checked against the visible selected period, without replacing range facts. Recognized 원/억원 units map to KRW while the raw label remains unchanged. KRX+NXT is not KRX. performance_context adds no new revenue/profit facts. Capture success without an export remains financial_source_required.
