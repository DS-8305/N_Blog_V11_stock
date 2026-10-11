# Stock blog workflow implementation plan

> For agentic workers: use superpowers:executing-plans for inline implementation with a whole-branch review.

**Goal:** Implement the supplied stock blog design in DS-8305/N_Blog_V11_stock main.
**Architecture:** Use independently validated financial documents, five ordered image assets and a deterministic beginner article. Reuse V10 browser/editor safety code at 2b7f772bdf5817604a3019115a308d8265f962f4; replace its apartment and sheet contracts. Providers require explicit source evidence and permission; live integrations never imply success from fixtures.
**Tech stack:** Node >=22.12, pnpm 11.12.0, TypeScript, Playwright CDP, sharp, Vitest.
**Spec:** ../../v11_stock_implementation_spec.md (reference; user's target repository takes precedence over its new-repository commands).

## Global constraints
- Five PNG roles, cards 1200 x 1200, exact source values, no inferred rank or clamped out-of-range marker.
- Seven titles, five headings and tags, 800–1000 characters including spaces by default.
- No public publish, uncertain save retry, prior draft deletion or sheet modification.
- Source and job inputs remain ignored; public target repository visibility is preserved.

## Review focus
- A provider file edited after review must invalidate collection and existing checkpoints.
- Future/stale dates, cross-market identity and inconsistent adjustment bases must stop before rendering.
- Symlink/path escape must never let a job read an asset outside itself.
- Mutated post claims or additional image roles must stop before editor input.
- Input interrupted before its acknowledgement must never duplicate the last event on resume.

### Task 1: M0–M2 data contracts
Files: src/domain/{stock,asset,post,job,validation,bundle}.ts, src/providers/{types,registry,reviewedFile}.ts, src/state/*.ts; tests/domain/*.test.ts.
Interfaces: validateFacts(request, facts): ValidationIssue[]; pricePosition(quote, range): number|null; collectJob(jobPath, options): Promise<Result>.
- [ ] Write failing tests for market/ticker/date/currency/price basis, rank and segment share evidence.
- [ ] Implement strict runtime parsers and evidence-backed reviewed provider.
- [ ] Run unit tests; reject absent, tampered and unlicensed data.
- [ ] Commit the validated data contracts.

### Task 2: M3–M5 image artifacts
Files: src/browser/*.ts, src/capture/*.ts, src/render/*.ts, src/editorial/assetValidation.ts; tests/render/*.test.ts.
Interfaces: renderJob(jobPath): Promise<Result>; validateAssets(jobPath, facts, manifest): Promise<ValidationReport>.
- [ ] Write failing render/asset tests for exact values, five roles, hashes, PNG dimensions and provenance.
- [ ] Reuse generic capture and browser locks, implement three deterministic SVG cards and reviewed concept image import.
- [ ] Inspect rendered PNGs and run integrity tests.
- [ ] Commit image pipeline.

### Task 3: M6 article and safe editor input
Files: src/editorial/{createPost,postValidation,compileDraft,loadBundle}.ts, src/automation/*.ts, src/cli/*.ts; tests/editorial and automation.
Interfaces: createPost(request, facts, assets): PostDocument; compileDraft(jobPath,bundle,report): PreparedDraft; runDraft(jobPath,options): Promise<DraftRunResult>.
- [ ] Write failing layout, unsupported claim, source/asset mismatch and save/restart safety tests.
- [ ] Implement article contract and CLI; reuse V10 editor events, native captions, receipt/readback and locks.
- [ ] Run complete suite, typecheck, build and offline CLI scenario.
- [ ] Commit workflow and operational docs.

### Task 4: M7 validation and delivery
Files: docs/validation/*.md, README.md, docs/data-policy.md.
- [ ] Distinguish offline fixtures and actual live checks; record unavailable authenticated/provider dependencies.
- [ ] Review full implementation, fix material findings, rerun required checks.
- [ ] Push tested commits to requested main, verify remote SHA and CI.

## Decisions
The user supplied a written design and explicitly requested implementation on main; continue inline without asking them to authorize it again. The fresh target checkout provides isolation from reference and synced sources. The attachment is reference material, not authority to create another repo or change visibility. Live stock and Naver checks require real configured providers and browser sessions; report them pending if unavailable.
