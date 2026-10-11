# Validation record — 2026-10-11 (Asia/Seoul)

## Reference and target

V10 checked at `2b7f772bdf5817604a3019115a308d8265f962f4`; read-only source checkout and GitHub main remain unchanged. Target `DS-8305/N_Blog_V11_stock` existed with no commits and public visibility. Implementation uses that repository as requested; no new repository or visibility change was made.

## Offline verification

`pnpm test`, `pnpm typecheck`, `pnpm build`, and built CLI `help` are required. Tests exercise actual sharp rasterization, font availability, exact displayed values, deterministic pixel expectations, strict financial schema, tamper detection, five sections/assets, native captions, preserved aspect ratios, ownership/locks, interrupted input, uncertain save and persisted-list readback behavior. Editor behavior uses explicit simulated ports; it is not evidence of a saved Naver draft.

Code-review regressions cover: failed-lock state mutation, immutable entered jobs, first-event dispatch uncertainty, whitespace-normalized persisted readback, fabricated caption numbers, source changes leaving stale captures, derived-cap timestamp mismatch, rank evidence dates and corrupt confirmed receipts. All receipt-success paths compare the full body, five ordered images, captions and sources; a separate atomic `receipts/draft-save.json` records confirmed evidence. Final local command logs and render QA PNGs remain under ignored `.runtime/`.

Local results: **21 test files / 73 tests passed**, TypeScript check passed, build passed and bundled CLI help passed. Three deterministic card PNGs were inspected for Korean glyphs, numeric labels, chart placement and source/date visibility. The quote source and timestamp are shown independently from the 52-week range.

Delivery: implementation commit `622d99dbc286009e91d3ae471768b6a1c61b012f` was pushed to the requested `main`, and `git ls-remote` matched the local SHA. [GitHub Actions run 38129901917](https://github.com/DS-8305/N_Blog_V11_stock/actions/runs/38129901917) completed successfully, including the test suite, typecheck, build and CLI help on Windows. This CI result covers code behavior and offline fixtures; the live acceptance limits below still apply.

## Live observations and limits

The user selected 삼성전기. Its [official quote page](https://www.samsungsem.com/kr/about-us/investor-relations/stock.do) identifies A009150. The [official overview](https://www.samsungsem.com/kr/about-us/company/overview.do) provides company and business context. These URLs were inspected as source candidates; no scraped quote was promoted to a verified financial artifact. The user confirmed the displayed current-price/daily-close interpretation; the implementation still requires recorded last trading date, adjustment definition, quote kind, cap basis and source permission in provider evidence.

No reviewed financial provider/export, AI concept PNG or authenticated dedicated Chrome profile/CDP endpoint was supplied. A read-only probe of `127.0.0.1:9222/json/version` found no available endpoint. Samsung job `stock-20261011-009150-bd5f1191` was initialized under ignored `workspaces/`; the built CLI `source:inspect` returned exit 3 / `needs_user:data_provider_required`, with no collected prices or save attempt. Therefore the actual Samsung five-image run and Naver save/reopen acceptance remain `needs_user`. No public post or draft was created in the user's account. A US real-data acceptance run also remains pending. Offline fixture success is never reported as M7 success.

## Remaining acceptance checks

- Obtain reviewed Samsung data/evidence and usage permission; run full collection against the official overview in the dedicated browser.
- Check all five real PNGs for Korean glyphs, full numeric labels, source/date text, screenshot relevance and AI concept labeling.
- Run a separate US symbol with SEC/official IR and a licensed quote source to check class/ADR and price-adjustment semantics.
- Using an explicitly configured authenticated Chrome session, run draft input, save once, reopen the persisted row and compare title/body/captions/five image resources.
- On interruption/recovery popup/save uncertainty, verify the job stops with the intended status without altering prior drafts or duplicating input.

## CLI port update — 2026-10-11

The default CLI CDP endpoint is now `http://127.0.0.1:9223`. An explicit `--cdp` overrides it for collection, draft input and resume. Chrome is started separately with a matching debugging port and a dedicated profile; the README includes the launch command. Existing resume checkpoints still require the original endpoint/profile/owned tab.

Local verification: **22 test files / 76 tests passed**, typecheck and build passed, and the built help shows the 9223 default. Three CLI regressions check the omitted-option default, explicit alternative port forwarding and remote-endpoint rejection. They simulate collection dispatch and do not establish a live Chrome connection.
