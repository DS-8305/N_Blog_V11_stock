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

## 2026-10-12: source screenshot workflow

Offline verification: 41 test files / 146 tests pass; pnpm typecheck and pnpm build pass; built help lists capture/post commands and port 9223. Tests cover five original-ratio PNGs, permissions/configuration review, exact ticker/market/frame host, parent readiness, visible crops in tall frames, failed recapture, financial context mismatch (including KRX+NXT), manuscript review invalidation, Korean money/promotion regressions, old manuscript fingerprint, five native captions and save-once/unchanged-prefix resume simulations.

At that earlier checkpoint, actual acceptance remained needs_user: no reviewed live financial export or screen-republication permission was supplied, and a read-only local TCP probe found no CDP listener on 127.0.0.1:9223. No actual five-screen collection, Naver draft save or saved-row reopen had been performed.

Independent review found raw-label/provider mismatches, checkbox selection and partial overlay gaps. Regression tests reproduced them before fixes. Reviewed mappings now retain raw 억원/1년/price labels, require quote evidence for differing price definitions, and keep one-year charts separate from 52-week values. Associated checked inputs and Korean exchange labels are recognized. Intersecting fixed/sticky panels block capture, and recoverable readiness failures return needs_user.

### Later live check: explicitly approved public-source preview

The user subsequently started and authenticated the dedicated Chrome on port 9223, requested proceeding without separate evidence files, and explicitly approved uploading and temporarily saving one Samsung Electro-Mechanics preview draft. This was a separate `user_directed_public_source_preview` operation, not financial-provider certification or a permission attestation. No `facts.json`, reviewed export or license certificate was fabricated, and the normal financial workflow's evidence gates remain in place.

Five actual source screenshots were inspected and used in order: official company introduction, Naver Pay/FnGuide company overview, Naver Pay one-year price chart, official business structure, and the original FnGuide financial frame. Original aspect ratios were retained. The qualitative article contains 975 characters and five native captions; its text makes no numeric financial or trading recommendation claims. Captions distinguish the source dates and the original financial frame.

Live input exposed two obstructions: the help panel blocked initial body focus, and the image library sidebar covered the paragraph's former right-edge click coordinate. Following the user's panel-closing instruction, body focus now closes only those observed editor panels and uses the paragraph's horizontal center. Three regressions cover the overlapping sidebar, help dismissal and library closure.

Input resumed only after the owned editor matched the full acknowledged prefix and the pending text event was proved unapplied. All five images, captions and the complete body were then acknowledged. Temporary save was dispatched once. Its first confirmation was inconclusive; a later confirmation reopened the unique persisted row without dispatching another save and matched the title, full body, five ordered image resources/aspect ratios, captions and sources. The result is `draft_saved`. No public publication or prior-draft deletion occurred. Account details, screenshots, authorization, input checkpoints and the saved-draft receipt remain in ignored `.runtime/`.

Fresh verification after the panel fix: **42 test files / 149 tests passed**, typecheck passed and build passed. The initial sandboxed full-suite run failed on temporary-file `rename` permissions; the same full command passed with normal local permissions. The separate reviewed-financial-data and US-security acceptance checks above remain pending.

### Reader feedback and writing-date research

New jobs use reader_focused_v2: fact-linked number hooks, three introduction lines, concrete same-session quote/range/cap and optional reviewed 1M return, reviewed annual chart and volume observations, actual business descriptions, reviewed growthImpact ending, and ten unique tags. Previous source jobs and legacy manuscripts keep their absent-style behavior and stored fingerprints. Research goes through normal provider evidence/hash/review binding; calendar gaps need reviewed non-trading dates rather than an assumed Friday. Section-specific validation rejects deleted figures/chart/volume/growth claims and cannot substitute an optional cap rank for the cap amount.

Live research on 2026-10-12 found the Naver Pay price page dated October 12, while the embedded company overview remained October 8. The current page labels price/range/volume as KRX+NXT and cap as KRX. These were recorded as source observations, not promoted to a matched verified export. The October 8 figures were not relabeled as writing-day facts. No revised numeric draft or new Naver save is claimed.

Image 1 was recaptured from the actual official introduction at 1465×2021, including the title and introduction text. Image 5 was recaptured from the original financial frame at 1100×1532, including both charts and the original table. Both were visually inspected. The full financial table's native sticky first column triggers the conservative occlusion detector; its PNG is explicitly an unapproved review preview, not a passing production capture receipt. No readiness or financial guard was weakened. Images 2/3/4 were not modified. All samples and observations remain ignored under .runtime.

Final offline verification: **43 files / 156 tests passed**, typecheck passed and build passed. Independent review findings about an invented growth mechanism, missing per-section claims, missing research attribution and cap-rank substitution were fixed with failure-reproducing regressions. A separately initialized writing-date job returned needs_user:data_provider_required without supplying fake values or saving a revised post.
