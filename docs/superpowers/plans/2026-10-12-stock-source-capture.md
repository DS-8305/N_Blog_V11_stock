# Stock Source Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 V11 작업에서 실제 자료 화면 5장과 근거 기반 제목·본문을 준비하고, 검토한 결과를 네이버 임시저장 흐름에 전달한다.

**Architecture:** 작업별 이미지 모드로 기존 카드·AI 작업과 새 캡처 작업을 구분한다. 캡처 설정·화면 증거는 금융 제공자와 별도로 검토·저장하며 원고 준비 단계에서 양쪽 근거를 결합한다. 네이버페이 공통 프로필과 확인한 회사별 영역 설정을 사용하고 기존 입력 이벤트·저장 확인 코어를 유지한다.

**Tech Stack:** Windows 11, Node >=22.12.0, pnpm 11, TypeScript, Playwright 1.61.1, sharp 0.35.4, Vitest 2.1.9. 추가 런타임 의존성 없음.

**Spec:** [승인된 설계](../specs/2026-10-12-stock-source-capture-design.md). 사용자 승인: 2026-10-12 “이 설계로 진행”.

## Global Constraints

- 새 작업의 conditions.imageLayout=stock_sources_five_v1. 필드가 없는 기존 작업은 기존 카드·AI 계약으로 해석하며 parser가 필드를 추가하지 않는다.
- company_intro → market_overview → price_history → business_structure → performance_context 순서의 source_screenshot PNG 정확히 5장.
- 캡처의 원본 크기·비율을 보존한다. 새 모드에는 1200×1200 조건을 적용하지 않는다.
- 금융 검증과 캡처 준비 상태를 구분한다. 누락한 금융 사실을 화면·fixtures로 보충하지 않는다.
- 회사명·ticker·market·기간·가격 기준·사용 허용 근거·출처·해시와 검토 fingerprint를 연결한다.
- 본문·소제목·캡션·출처 합계 기본 800–1000자, 제목 후보 7개, 태그 5개, native 캡션. 사용자 지정 우선.
- 실제 사진·데이터·브라우저 프로필·계정 자료·실행 로그는 ignored .runtime/ 또는 workspaces/.
- 입력 또는 저장한 작업은 변경 금지. 불확실 입력·저장 재전송 금지. 공개 발행 없음.
- 기본 CDP=http://127.0.0.1:9223. 실제 Chrome·사이트 검증과 모의 검증을 별도로 기록한다.

## Review Focus

1. 모드 없는 옛 작업의 해석·저장·재개 fingerprint 유지 → Task 1/3/5.
2. 같은 회사명·다른 시장·보통주/우선주·iframe cmp_cd 불일치 중단 → Task 2.
3. 자식 DOM은 읽혀도 부모 로딩 표시·고정 패널이 남으면 캡처 중단 → Task 2.
4. 1년 차트와 52주 원천 값, KRX+NXT 가격과 KRX 기업 지표를 같은 근거로 추정하지 않음 → Task 2/3.
5. 원고 승인 후 제목·본문·캡션·태그 수정, 근거 없는 한글 가격 추가 시 컴파일 차단 → Task 4/5.

## 파일별 책임

- domain/imageLayout.ts: 이미지 모드·역할·사실 연결.
- domain/capture.ts: 캡처 설정·실제 화면 기록·manifest의 타입과 parser.
- capture/sourceConfig.ts: 설정 검수·승인·fingerprint.
- capture/sourceProfiles.ts: 페이지 이동·종목·프레임·선택 상태·영역 확인.
- capture/sourceCapture.ts: 원본 PNG·영수증 저장, 캡처 집합 재검수.
- editorial/preparePost.ts: 검증된 사실과 캡처를 assets.json/post.json으로 결합.
- editorial/factPresentation.ts, titles.ts: 검증 값의 독자용 표현과 제목 선정.
- editorial/postReview.ts: 현재 원고의 검토 기록.
- 기존 작업·이미지·원고 검증·CLI를 위 계약에 연결한다. 파일 경로의 기준은 src/다.

## Task 1: 이미지 모드와 캡처 설정 계약

**Files:** Create src/domain/imageLayout.ts, src/domain/capture.ts; Modify src/domain/job.ts, asset.ts, bundle.ts; Test tests/domain/imageLayout.test.ts, tests/domain/capture.test.ts.

**Interfaces:**
- ImageLayout='legacy_cards'|'stock_sources_five_v1'; imageLayoutFor(request:JobRequest):ImageLayout; rolesFor(request:JobRequest):readonly AssetRole[]; factIdsFor(role:AssetRole,facts:FactDocument):string[].
- 기존 requiredRoles export는 legacy 배열을 유지한다. JobRequest.conditions.imageLayout는 선택 필드.
- AssetRole에 새 역할 5개, assetKind에 source_screenshot을 추가한다. StockAsset.capture?:CapturedScreen, AssetManifest.captureBasisFingerprint?:string.
- CaptureHints={schemaVersion:1,jobId,identity:{ticker,market,issuerName},sources:CaptureSourceHint[],review:{status,reviewedBy,reviewedAt,basisFingerprint}}.
- CaptureSourceHint={role,profile:'company'|'naverpay',url,hostname,verificationUrl,sourceName,licenseNote,permission:{status:'approved',basis},selector,identitySelector,requiredIdentityLabels,requiredRegionLabels,frame?:{selector,hostname},selection?:{selector,expectedText},sourceDateText:string|null,unitText:string|null,marketScope:string|null,priceBasis:string|null,selectedPeriod:string|null}.
- CapturedScreen={role,runId,parentUrl,frameUrl?:string,regionSelector,sourceName,capturedAt,sourceDateText,unitText,marketScope,priceBasis,selectedPeriod,identityText,regionText,contentSignature,relativePath,width,height,sha256,hintsFingerprint}.
- CaptureManifest={schemaVersion:1,jobId,runId,requestFingerprint,basisFingerprint,screens:CapturedScreen[]}; parseCaptureHints(unknown):CaptureHints; parseCaptureManifest(unknown):CaptureManifest.
- Nullable 메타데이터는 원문에 미표시라는 뜻이다. 날짜·단위·시장 기준을 추정해서 채우지 않는다. 공식 소개의 촬영일과 사실 asOf를 구분한다.

- [ ] Setup: pnpm install --frozen-lockfile. TEMP/TMP를 .runtime/test-temp로 지정하고 pnpm test, pnpm typecheck, pnpm build로 76개 baseline을 확인한다.
- [ ] Red: 새 역할 순서·kind·다른 캡처 비율·옛 요청 fingerprint 보존·4장/6장/중복·HTTP·경로 탈출·사용권 근거 누락을 검사한다.

    expect(rolesFor(sourceRequest)).toEqual(['company_intro','market_overview','price_history','business_structure','performance_context']);
    expect(fingerprint(parseJobRequest(oldRequest))).toBe(fingerprint(oldRequest));

- [ ] Run: pnpm exec vitest run tests/domain/imageLayout.test.ts tests/domain/capture.test.ts → 새 계약 부재로 FAIL.
- [ ] Implement: 위 타입·parser·역할/사실 연결. 모든 source_screenshot manifest에서 captureBasisFingerprint와 캡처 메타데이터를 검사한다.
- [ ] Verify: 위 테스트와 pnpm typecheck → PASS.
- [ ] Commit: feat: add source capture image contracts.

## Task 2: 설정 승인과 실제 화면 캡처

**Files:** Create src/capture/sourceConfig.ts, sourceProfiles.ts, sourceCapture.ts; Modify src/capture/captureRegion.ts, readiness.ts; Test tests/capture/sourceConfig.test.ts, sourceProfiles.test.ts, sourceCapture.test.ts, frameReadiness.test.ts.

**Interfaces:**
- captureHintsBasis(hints:CaptureHints):string는 review 제외 설정의 fingerprint.
- inspectCaptureConfig(jobPath:string):Promise<{status:'ready'|'needs_user';basisFingerprint?:string;issues:string[]}>.
- approveCaptureConfig(jobPath:string,expectedFingerprint:string,reviewedBy:string):Promise<void>.
- resolveSourceRegion(page:Page,hint:CaptureSourceHint,identity:CaptureHints['identity']):Promise<{region:Locator;frameOwner?:Locator;frameUrl?:string;identityText:string;regionText:string}>.
- captureSources(jobPath:string,options:Omit<SessionOptions,'jobId'>,dependencies?:{open?:typeof openCollectionSession;resolve?:typeof resolveSourceRegion;capture?:typeof captureRegion}):Promise<{status:'captured';manifest:CaptureManifest}|{status:'needs_user'|'failed';code:string}>.
- checkCapturedSources(jobPath:string):Promise<CaptureManifest>는 설정 승인·request·5장·각 영수증·실제 PNG 해시/크기를 다시 검사한다.
- captureRegion의 기존 인자는 유지하고 frameOwner?:Locator만 추가한다. 기존 호출의 동작은 유지한다.

- [ ] Red: 다른 ticker/시장·009155 우선주·iframe cmp_cd/host·redirect·부모 로딩·가림·잘림·미완료 이미지·설정 변경·미확인 사용권을 검사한다. 재캡처 실패 후 옛 manifest·이미지 승인 재사용도 차단한다.

    expect(resultForWrongTicker.status).toBe('needs_user');
    expect(parentLoadingCaptureCalls).toBe(0);
    expect(changedConfigIssues).toContain('capture_review_stale');

- [ ] Run: pnpm exec vitest run tests/capture/sourceConfig.test.ts tests/capture/sourceProfiles.test.ts tests/capture/sourceCapture.test.ts tests/capture/frameReadiness.test.ts → FAIL.
- [ ] Implement config: job lock과 assertJobMutable 안에서 승인 기록. identity·5개 source가 request와 일치해야 한다.
- [ ] Implement profile: company는 확인된 HTTPS URL/host/영역을 사용한다. naverpay는 KRX 국내 종목 경로·확인된 탭·부모 종목 식별·iframe cmp_cd/host를 검사한다. 다른 시장의 naverpay는 needs_user:naverpay_market_not_supported. 검토된 다른 출처를 사용하는 generic company 프로필은 지원한다.
- [ ] Implement readiness: 자식 영역과 부모 iframe/페이지의 clipping·가림·로딩을 함께 검사한다. 클릭 후 선택 상태를 확인한다. 변경된 화면 값과 캡처 증거가 일치하지 않으면 재검토 필요로 중단한다.
- [ ] Implement save: 설정 검수 후 새 UUID runId와 capture-attempt.json의 capturing 상태를 실행 전에 기록한다. assets/<role>.png, receipts/captures/<role>.json, capture-manifest.json을 atomic 저장하고 동일 runId의 5장이 완성된 뒤 attempt를 captured로 바꾼다. 실패 시 failed를 기록하며 checkCapturedSources는 마지막 attempt와 일치하지 않는 옛 결과를 거부한다. 같은 출처·영역·선택 상태의 중복 2장도 차단한다. 잠금 실패와 이미 입력한 작업에서는 상태를 변경하지 않는다.
- [ ] Verify: 위 테스트와 기존 captureRegion, browser/session, collectors/lockSafety 테스트 → PASS.
- [ ] Commit: feat: capture reviewed stock source screens.

## Task 3: 원고 준비와 이미지 승인 연결

**Files:** Create src/editorial/preparePost.ts, tests/helpers/captureBundle.ts; Modify src/collectors/collectJob.ts, src/editorial/assetValidation.ts, createPost.ts, postValidation.ts, src/render/captions.ts, renderJob.ts; Test tests/editorial/sourceScreens.test.ts, tests/collectors/sourceMode.test.ts.

**Interfaces:**
- preparePost(jobPath:string):Promise<{jobId:string;reviewFingerprint:string}>는 collectionCheck의 검증된 사실과 checkCapturedSources를 소비한다.
- source 모드 assets.json.captureBasisFingerprint=CaptureManifest.basisFingerprint. 각 asset.capture는 해당 CapturedScreen; sourceUrl은 실제 자료 URL.
- StockAsset.asOf는 연결된 원고 fact의 기준시각이다. 실제 화면 기준은 capture.sourceDateText에 별도 보존한다. performance_context.factIds=[]이며 새 매출/이익 숫자 주장은 생성하지 않는다.
- captionFor의 기존 3개 인자는 유지하고 optional capture?:CapturedScreen을 추가. 새 캡션은 회사·주제·출처·화면 기간/촬영일을 표시한다.
- approveImages는 이미지 모드별 영수증을 검사한다. 기존 assetReviewBasis를 유지하고 새 captureBasisFingerprint를 포함한다.

- [ ] Red: 800×500/1100×800 등의 원본 PNG 5장이 통과하고 legacy도 그대로 통과하는지 검사한다. 4장/6장/순서·변조·설정 변경·금융 미준비를 검사한다.

    expect(sourceReport.errors).not.toContainEqual(expect.objectContaining({code:'square_1200_png_required'}));
    expect(legacyReport.errors).toEqual([]);
    await expect(preparePost(jobWithoutFinancialEvidence)).rejects.toThrow('needs_user:financial_source_required');

- [ ] Run: pnpm exec vitest run tests/editorial/sourceScreens.test.ts tests/collectors/sourceMode.test.ts → FAIL.
- [ ] Implement collection: 새 모드는 금융 facts와 source receipts만 준비한다. legacy의 공식 화면 캡처 흐름을 유지한다.
- [ ] Implement prepare: 금융 파일 미준비는 needs_user:financial_source_required로 안내하고 다른 근거 오류는 보존한다. 금융 근거와 각 캡처의 종목·날짜·시장 기준을 대조한다. 금융 역할 2/3의 표시 기준·시장 범위가 미확인이거나 price_history의 priceBasis가 미확인/불일치면 중단한다. 가격 기준 정의는 실제 제공자의 검토한 근거에서 가져오며 '수정주가'라는 UI 문구만으로 보정 방법을 추정하지 않는다. KRX+NXT와 KRX를 같은 값의 근거로 추정하지 않는다.
- [ ] Implement assets/post: 새 역할·원본 비율을 사용한다. source 모드에서 render.json·AI provenance·1200×1200을 요구하지 않는다. render:run은 새 모드에서 needs_user:source_capture_mode와 capture:run/post:prepare 안내를 반환한다.
- [ ] Verify: 위 테스트와 기존 editorial/workflow, render/cards → PASS.
- [ ] Commit: feat: prepare drafts from five source screenshots.

## Task 4: 제목·본문 품질과 원고 검토 기록

**Files:** Create src/editorial/factPresentation.ts, titles.ts, postReview.ts, docs/editorial-guide.md; Modify src/editorial/createPost.ts, postValidation.ts, compileDraft.ts; Test tests/editorial/titles.test.ts, factPresentation.test.ts, postReview.test.ts, claimSafety.test.ts.

**Interfaces:**
- readerMoney(amount:number,currency:string):string는 검증 값의 정확한 독자용 표현. KRW 원/만/억/조를 사용하되 정보가 사라지는 반올림 없이 표현하고 필요한 경우 raw 표기를 사용한다.
- supportedClaimTexts(facts:FactDocument):Record<string,string[]>는 기존 raw와 정확한 독자용 표현을 반환한다. 기존 claimTexts export는 이 함수를 사용하는 호환 wrapper.
- TitleCandidate={text:string;factIds:string[];angle:string;priority:number}; buildTitleCandidates(facts:FactDocument):TitleCandidate[]; selectTitle(candidates:TitleCandidate[]):TitleCandidate.
- postReviewBasis(bundle:Awaited<ReturnType<typeof loadBundle>>):string; approvePost(jobPath:string,expectedFingerprint:string,reviewedBy:string):Promise<void>; validatePostReview(jobPath:string,bundle:Awaited<ReturnType<typeof loadBundle>>):Promise<ValidationIssue[]>.
- receipts/post-review.json={schemaVersion:1,jobId,basisFingerprint,reviewedBy,reviewedAt,checks:{facts:true,titleAnswer:true,opinionSeparation:true,promotion:true,captions:true}}.
- validateBundle은 새 모드에서 원고 review도 검사한다. validatePostReview의 오류 코드는 post_review_required/post_review_stale/post_review_invalid다. approvePost는 review 자체의 부족을 제외한 원고·이미지 검증을 먼저 통과해야 하며 순환 호출을 만들지 않는다. review는 실제 검토자의 확인 기록이며 자동 사실 인증이 아니다. legacy의 저장 fingerprint·review 요건은 바꾸지 않는다.

- [ ] Red: 7개 서로 다른 관점의 후보와 본문에 답이 있는 후보 선정, 회사·사업 변경에 따른 후보·도입 변화, 값의 정밀도 보존을 검사한다.

    expect(new Set(candidates.map(c=>c.text)).size).toBe(7);
    expect(readerMoney(450000000000000,'KRW')).toBe('450조 원');
    expect(readerMoney(75000,'KRW')).toBe('7만 5,000원');

- [ ] Red: 근거 없는 “주가는 005930 KRW”, “주가는 구만 원”, “지금 반드시 사야 하는 종목이에요”를 차단한다. 새 모드에서 review 없이 컴파일하거나 승인 후 근거 없는 사업 설명·제목·caption·tag를 수정하면 중단한다.
- [ ] Run: pnpm exec vitest run tests/editorial/titles.test.ts tests/editorial/factPresentation.test.ts tests/editorial/postReview.test.ts tests/editorial/claimSafety.test.ts → FAIL.
- [ ] Implement writer: 5개 section 역할을 유지한다. 기업 특징으로 도입하고 절별 새 정보를 담는다. 제목 후보는 기업 소개·사업 질문·사업 구조·기업 규모 읽기·가격 읽기·초보자 상황·체크포인트의 7개 관점이다. 사실 연결·본문의 답을 먼저 검사하고 기업 특징의 구체성·질문 명확성·중복·길이로 priority를 정하며 동일 priority는 후보 순서를 사용한다. 첫 항목을 고정 선정하거나 CTR 수치를 만들지 않는다. 공통 확인 문장을 반복하는 padding을 제거하고 원천 사실을 임의 축약하지 않는다. 분량 밖이면 검수 결과로 보고한다. 다른 기업의 성장·투자 사례를 가져오지 않는다.
- [ ] Implement safety/review: ticker 예외는 종목 식별 문구로 제한하고 한글 금액·권유 표현의 누락 사례를 보강한다. 임의의 한국어 기업 사실을 정규식만으로 완전히 판정한다고 주장하지 않는다. 현재 원고를 실제로 읽은 review fingerprint가 있어야 새 모드의 컴파일을 허용한다.
- [ ] Verify: 위 테스트·기존 editorial/workflow·저장된 legacy fixture fingerprint → PASS.
- [ ] Commit: feat: improve evidence based stock editorial output.

## Task 5: CLI·문서·입력 회귀와 전달

**Files:** Create src/cli/captureCommands.ts, postCommands.ts, tests/cli/sourceCaptureCommands.test.ts, tests/automation/sourceDraft.test.ts; Modify src/cli/main.ts, sourceCommands.ts, README.md, AGENTS.md, docs/data-policy.md, provider-contract.md, validation/implementation-notes.md, validation/live-checks.md.

**Interfaces:**
- initializeCaptureHints(jobPath:string):Promise<void> → 검토 전 template. 새 job:init의 default는 source 모드, --image-layout legacy_cards로 기존 방식 새 작업도 가능.
- capture:inspect --job; capture:approve --job --fingerprint --reviewer; capture:run --job --cdp --profile; capture:check --job.
- post:prepare --job; post:review-basis --job; post:approve --job --fingerprint --reviewer. 기존 assets:approve/draft 명령 유지.
- 새 실행 순서: job:init → capture 설정 검토/승인 → capture:run → financial source 검토/승인·collect:run → post:prepare → assets:approve → post 검토/승인 → draft:check → draft:run.
- 기본 CDP 9223, 확인·자료 필요 exit 3, 검수 실패 exit 2, 저장 불확실 exit 4.

- [ ] Red: 새 default·명시적 legacy·잘못된 mode·금융 미준비·누락 검토·변조에 대한 상태/exit를 검사한다. 새 source fixture의 native caption 5개·원본 비율·partial resume·save 1회·persisted reopen·승인 후 수정 차단을 추가한다.

    expect(sourceDraft.events.filter(e=>e.type==='insertImage')).toHaveLength(5);
    expect(sourceDraft.events.filter(e=>e.type==='setImageCaption')).toHaveLength(5);
    expect(saveCallsAfterResume).toBe(1);

- [ ] Run: pnpm exec vitest run tests/cli/sourceCaptureCommands.test.ts tests/automation/sourceDraft.test.ts → FAIL.
- [ ] Implement CLI/docs: 위 함수를 연결하고 금융·캡처·이미지 검토·원고 검토의 상태를 구분한다. 자료·사용권·Chrome이 없을 때 필요한 항목을 구체적으로 안내한다.
- [ ] Verify full: pnpm test 모두 PASS, pnpm typecheck/build exit 0, node dist/cli.js help에 새 명령·9223 표시.
- [ ] Verify actual: 사용권 근거와 적합한 CDP가 준비되면 한 종목의 실제 5장·가독성·사진 설명·저장 목록 재열람을 검사한다. 연결이 없으면 실제 단계는 needs_user로 기록한다. 현재 예시 캡처를 게시용 승인 자료로 사용하지 않는다.
- [ ] Review: 전체 브랜치를 독립 검토한다. 필요한 수정을 반영하고 해당 테스트와 최종 확인을 다시 실행한다.
- [ ] Commit: feat: wire stock screenshot editorial workflow.
- [ ] Delivery: 코드·테스트·실제 검증 제한을 보고하고 검토 가능한 브랜치/PR로 전달한다. 만든 PR은 앱에 attach한다. main merge는 사용자 요청 범위에 따른다.

## 실행 전 검토

권장 방식은 현재 codex/stock-source-capture 브랜치에서 직접 구현하는 것이다. 다섯 task가 같은 작업·이미지·검토 계약을 공유하므로 한 세션에서 연결하고 마지막에 독립 검토하는 편이 적합하다. 별도 작업 사본을 추가하지 않는 선택을 함께 확인한다.

사용자가 이 계획을 검토하고 실행 방식을 선택한 뒤 구현을 시작한다.
