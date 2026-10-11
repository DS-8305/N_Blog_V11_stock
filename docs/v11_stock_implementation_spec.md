# V11_STOCK — 개별 주식 네이버 홈판 콘텐츠 자동화 구현 설계서

> **상태:** Codex 구현 지시용 기술 설계서 (코드 구현 완료를 뜻하지 않음)  
> **대상 저장소:** `DS-8305/v11_stock` (새 PRIVATE GitHub 저장소; 아직 만들어지지 않은 경우 이 문서의 명령대로 생성)  
> **원본 참조:** `DS-8305/N_Blog_V10_Budong`, `main` commit `2b7f772bdf5817604a3019115a308d8265f962f4` (2026-10-07)  
> **사용 환경:** Windows 11, Chrome, Node.js >=22.12, pnpm 11.12.0, TypeScript, Playwright/CDP, sharp, Vitest  
> **기본 목표:** 주식 티커 하나를 입력하면 *검증된 정보 + 이미지 5장 + 초보자용 글 + 네이버 SmartEditor 임시저장*까지 지원한다. 공개 발행은 하지 않는다.

## 0. Codex에 가장 먼저 전달할 지시문 (복사 가능)

```text
프로젝트: DS-8305/v11_stock (새 private repository)
기준 참조: DS-8305/N_Blog_V10_Budong main commit 2b7f772bdf5817604a3019115a308d8265f962f4
첨부한 v11_stock_implementation_spec.md를 유일한 구현 명세로 사용하라.
원본 V10은 절대 수정하지 말고, 먼저 읽기 전용으로 구조/테스트를 분석하라.
내 환경은 Windows 11 + Chrome + Node22 + pnpm + Codex/Hermes이고, 인증은 기존 합법적 사용자 브라우저 세션을 활용한다.
새 GitHub 저장소는 존재 여부를 확인하고, 없으면 사용자 GitHub 인증이 준비된 경우에만 private로 생성한다. 존재하면 덮어쓰지 않는다.
먼저 M0부터 M1까지 구현하고 `pnpm test`, `pnpm typecheck`, `pnpm build`를 통과시켜 보고하라.
그 다음 각 마일스톤을 차례로 구현하라. 단계를 건너뛰거나 mock 데이터를 실제 수집 성공이라고 보고하지 마라.
실제 시세/시총/순위/52주 수치는 출처·기준시점 검증 없이는 생성하거나 보정하지 마라.
네이버 편집기에서 공개발행, 저장 불확실 때 재저장, 기존 글 삭제, 시트 수정은 하지 마라.
모든 결과물과 테스트 로그는 작업 폴더에 남기고, 작동하지 않는 기능은 미구현/needs_user로 표시하라.
```

## 1. 범위와 완료 조건

**MVP 산출물**: ① 회사 소개 공식 화면 캡처 ② 시가총액·상장시장 인포그래픽 ③ 52주 최고·최저 가격 범위 카드 ④ 주요 사업 구조 인포그래픽 ⑤ 산업 테마 실사형 콘셉트 이미지, 초보자용 소제목 5개가 들어간 `post.json`과 HTML이 아닌 네이버 SmartEditor 임시저장 검증 기록.

**명시적 비범위**: 실제 수익/주가 예측, 매수·매도 신호, 재무제표 전수분석, 유료 시세 공급자의 무단 수집, 로그인/차단 우회, 자동 공개발행. 5번 생성 이미지는 실재 공장·실재 인물·제품을 재현했다는 주장 금지.

**완료 정의**: 단일 주식에 대해 모든 필수 데이터가 검증되었을 때 `assets/`에 다섯 개의 유효 PNG와 `facts.json`,`assets.json`,`post.json`,`validation-report.json`이 생성되어야 한다. 새 네이버 초안 임시저장은 저장 목록에서 해당 제목과 본문/이미지를 다시 열어 대조한 경우에만 `draft_saved`로 보고한다. 하나라도 필수 근거가 불충분하면 `needs_user`로 멈춘다.

## 2. 초보자용 5개 섹션과 이미지 계약

| 순서 | 소제목 | 이미지 role | 생성 방식 | 반드시 표시할 것 |
|---|---|---|---|---|
| 1 | 이 회사는 어떤 곳인가요? | `overview_hero` | 공식 홈페이지 About/사업 소개 우선, 부득이하면 공식 홈의 주제 관련 영역 **실제 캡처** | 회사 정체성, 출처 URL(내부), 촬영일 |
| 2 | 기업 규모는 어느 정도인가요? | `market_cap_card` | 검증 수치로 텍스트·숫자형 PNG 직접 렌더링 | 회사명/티커, 시장, 시총, 기준시각, 통화, 순위는 검증된 경우만 |
| 3 | 최근 1년 주가는 어떻게 움직였나요? | `price_52w_card` | 가격 범위 바 + 현재 위치 마커, sharp/SVG로 **결정적 렌더링** | 저가·고가·현재가, 가격 기준·통화·기준시각 |
| 4 | 회사는 어떤 사업으로 돈을 버나요? | `core_business_card` | 공식 IR/사업보고서/사업 사이트를 근거로 구성한 카드 | 검증된 사업부문 2~4개, 매출 비중은 근거 있을 때만 |
| 5 | 앞으로 어떤 점을 보면 될까요? | `outlook_visual` | 산업/기술 환경을 표현한 AI **콘셉트 실사 이미지** | 사실을 암시하는 합성 로고·데이터 금지, `AI 생성 콘셉트 이미지` 표시 |

**배치 원칙:** 제목 1개 / 초보자용 섹션 5개 / 섹션 직후 대응 이미지 1장 / 짧은 본문 / 이미지 설명은 SmartEditor 네이티브 캡션을 우선한다. 숫자 카드 2~4는 기본 `1200x1200px PNG`; 실제 공식 사이트 캡처 1번은 원본 비율을 보존해도 된다. 5번은 `1200x1200px`, 주식 종목의 실제 모습을 입증하는 사진으로 오인하지 않도록 한다. UI 캡처 이미지와 자체 생성 인포그래픽은 `assetKind`에서 구분한다.

## 3. V10 기반 모듈 재사용/변경표

| V10 파일 | V11 처리 | 이유/변경 |
|---|---|---|
| `src/browser/session.ts`, `runLock.ts`, `ownedPage.ts` | 로직 이식 후 회귀 테스트 | V10의 CDP 연결과 세션·탭 잠금 보존 |
| `src/capture/captureRegion.ts`, `readiness.ts`, `captureAsset.ts` | 공통 화면 캡처 엔진 재사용·범용화 | `role`의 아파트 의존성을 제거, `assetKind` 추가 |
| `src/collectors/collectJob.ts`, `cache.ts`, `retry.ts` | 수집/체크포인트 패턴 재사용 | 금융 자료별 asOfDate/TTL 변경, 출처·인증 실패는 중단 |
| `src/domain/bundle.ts`, `src/editorial/assetValidation.ts` | **새 스키마로 재작성** | 아파트 ID/면적/거래 `requiredRoles`를 주식 role로 교체 |
| `src/editorial/compileDraft.ts`, `postValidation.ts` | 이벤트·검증 원리만 이식 | 투자 정보 관련 위험표현, 숫자와 factId 매핑, 5장 순서 |
| `src/automation/imageUploader.ts`, `draftRunner.ts`, `draftVerifier.ts` | 가능한 한 로직 보존 | 이미지 해시·비율·저장 재검증, 기존 글 복구 안내 보존 |
| `src/collectors/naverLand.ts`, `naverExterior.ts`, `kakaoMap.ts`, `kbLand.ts`, `asil.ts` | **이식하지 않음** | 부동산 전용 수집기 |
| `src/collectors/profiles/*` | 주식용 신규 정의 | 공식 홈페이지/IR/시세 사이트별 독립 어댑터 |

V10의 `asset` 스키마를 단순 문자열 치환하지 말 것: `CapturedAsset`의 `displayContext`, `requiredRoles`, 검증, 네이버 입력 `EditorEvent`의 호환성을 변경한 후 반드시 관련 테스트를 수정한다. 원본 V10 저장소와 브라우저 프로필, 로컬 workspaces, 시트/토큰은 절대 복사해 커밋하지 않는다.

## 4. 신규 저장소 권장 구조

```text
v11_stock/
  README.md
  AGENTS.md
  docs/v11_stock_implementation_spec.md
  docs/data-policy.md
  src/cli/{main,arguments}.ts
  src/browser/{session,runLock,ownedPage}.ts
  src/domain/{stock,asset,post,job,validation}.ts
  src/providers/{types,registry,officialSite,marketQuote,companyFiling}.ts
  src/collectors/{collectJob,companyIdentity,companyOverview,marketCap,price52w,business}.ts
  src/capture/{captureRegion,captureAsset,readiness}.ts
  src/render/{marketCapCard,priceRangeCard,businessCard,conceptImage,fonts,svgSanitize}.ts
  src/editorial/{compileDraft,assetValidation,postValidation}.ts
  src/automation/{imageUploader,imageCaption,draftRunner,draftVerifier,sessionProbe}.ts
  src/state/{jobStore,jsonStore}.ts
  tests/{fixtures,unit,integration,live-manual}/
  workspaces/                   # .gitignore; 개인 데이터/캡처/시세
```

새 저장소는 단독 `pnpm install && pnpm test && pnpm typecheck && pnpm build` 가능해야 한다. 의존성을 두 번째 저장소(v12)의 비공개 개발 상태에 결합하지 않는다.

## 5. 종목 식별과 데이터 제공자 계약

### 5.1 식별 및 소스 우선순위

입력: `ticker` + `market`(예 `KRX:KOSPI`, `KRX:KOSDAQ`, `NASDAQ`, `NYSE`) + `asOfDate` + 필요 시 회사명. **ticker만으로 종목 확정하지 않는다.** KRX 6자리 종목코드는 문자열로 유지하며 선행 0을 보존한다. 미국 시장은 클래스주/ADR/상장폐지/심볼 변경 여부 확인. 코드는 업종/기업 종목을 혼동하지 않도록 `issuerName`, `mic`, `exchange`, `securityType` 교차 검증.

원칙: 한국 기업개요/사업은 회사 공식 사이트·DART 공시, 미국은 회사 IR·SEC EDGAR, 시세/시총은 이용 허용·라이선스를 갖춘 시장 데이터 제공자 또는 공식 공개 수치. 데이터 공급자는 지역별 설정 가능한 어댑터로 만들고 **출처가 없으면 `needs_user:data_provider_required`**로 중단한다. 공식 사이트 렌더링의 내용은 사실 주장과 별개로 검증한다.

```ts
interface VerifiedValue<T> {
  value: T;
  sourceUrl: string;
  retrievedAt: string;     // ISO timestamp
  asOf: string;            // quoted market date or source statement date
  timezone: string;
  currency?: string;
  status: 'verified' | 'unverified';
  method: 'official_direct' | 'licensed_provider' | 'derived';
  evidenceIds: string[];
}
interface StockProvider {
  resolve(symbol: string, market: string): Promise<SecurityIdentity>;
  getQuote(identity: SecurityIdentity): Promise<VerifiedValue<Quote>>;
  getMarketCap(identity: SecurityIdentity): Promise<VerifiedValue<MarketCap>>;
  get52WeekRange(identity: SecurityIdentity): Promise<VerifiedValue<PriceRange>>;
  getBusinessSegments(identity: SecurityIdentity): Promise<VerifiedValue<Segment[]>>;
}
```

### 5.2 핵심 데이터 규칙

* **시총**: 제공자 직접 수치 우선. `주가 × 유통/발행주식 수` 직접 계산 시 *어떤 주식 수 기준인지* 명시하고 가격과 기준 시점이 일치하는지 확인. 시총과 기업가치(EV), 유통주식 시가총액(free-float)을 혼용하지 않는다.
* **시총 순위**: 제공자가 순위와 모집단(예 전체 KOSPI 상장 보통주), 기준일, 계산 규칙을 명시할 때만 표시. 다른 경우 `시총 순위: 확인 불가` 또는 카드에서 생략. 미확인 순위를 추정하지 않는다.
* **52주 최고/최저**: 같은 거래소·통화·가격 보정 기준(분할·배당 조정 여부)인지 검증. 장중/종가 정의와 제공자 기준을 저장. 현재가가 같은 기준이 아니면 위치 표시하지 않는다.
* **마지막 가격**: 장중인지 전일 종가인지, 장중 지연 호가인지 라벨 표시. 장이 닫힌 날은 최종 거래일 명시. 제공자 최신성 정책으로 오래된 자료를 자동 갱신하지 못하면 초안 생성을 중단하거나 명시적으로 과거 기준 글만 허용한다.
* **주력 사업**: 공식 IR·사업보고서로 뒷받침되는 사실만. `비중(%)`은 공식 매출 기준일/연결 범위/합계 일치 검증 뒤 표시. 근거가 부족하면 사업명과 짧은 설명만 표시.
* **전망/체크포인트**: 확정적 주가예측, 목표가, 투자 권유 문구 금지. 긍정/유의 항목 모두 1~2개씩, 출처 사실과 의견을 구분. 최신 기사 인용 시 기사 날짜와 출처 기록.

### 5.3 계산 검증

`position = (current - low) / (high - low)`은 분모 양수, 통화/가격조정 기준 일치, 현재값이 범위 내일 때만 사용하며 `[0,1]` 이외의 값을 무조건 clamp하지 않고 불일치로 보고한다. 동일 저가/고가에서는 위치 계산 생략. 상승/하락 백분율은 분모와 기간을 명시한다. 가격 수치 자체는 렌더러나 언어 모델이 생성할 수 없다.

## 6. 아티팩트 스키마 (v11 전용)

```json
{
  "schemaVersion": 1,
  "jobId": "stock-20261011-005930",
  "identity": {"assetType":"stock","ticker":"005930","market":"KRX:KOSPI","issuerName":"(검증된 회사명)","currency":"KRW"},
  "asOfDate": "2026-10-11",
  "facts": [
    {"factId":"market_cap","kind":"market_cap","value":null,"unit":"KRW","asOf":null,"verification":"unverified","sourceUrl":null},
    {"factId":"range_52w","kind":"price_range","low":null,"high":null,"quote":null,"priceBasis":null,"verification":"unverified","sourceUrl":null}
  ]
}
```

> 위 값은 **스키마를 설명하기 위한 미확인 예시**다. 실제 실행에선 필수 필드 `null`이나 `unverified`는 통과시키지 말 것. 소스 URL이 `null`일 때도 `needs_user` 처리. `jobId`는 날짜·티커 충돌을 피하도록 UUID suffix를 부여한다.

`assets.json`: 각 자산 `{assetId,role,assetKind:'official_screenshot'|'data_card'|'ai_concept',relativePath,sourceUrl,capturedAt,generatedAt?,asOf?,factIds,caption,sha256,width,height,reviewStatus,licenseNote}`. `facts.json`과 단일 주식/시장/통화/기준일을 함께 묶어 저장; 모든 데이터 카드 안에 출처 이름·기준일 표시. `post.json`은 5개 `heading`→`paragraph`→`image` 블록과 `factIds`를 포함하며 정확히 5장 이미지와 정해진 순서를 강제. 출처 원문 URL은 내부 보관, 네이버 공개글에는 출처 이름·기준일을 읽기 쉽게 표시한다.

작업 폴더 출력 예시:

```text
workspaces/stock-.../
  request.json source-hints.json facts.json assets.json post.json
  validation-report.json collection-checkpoint-*.json
  assets/{overview_hero,market_cap_card,price_52w_card,core_business_card,outlook_visual}.png
  receipts/{source-review,images,draft-save}.json
```

## 7. 이미지 엔진 상세 명세

**이미지 1**: 공식 도메인 사전 검증 → `About/Company/Business` 중 실제로 회사 정체성 보이는 요소 → Playwright 페이지 접근 → UI 차단/중복 탭/광고 팝업 확인 → 이미지 완전 로딩 → 필요한 영역 `captureRegion` → 실제 화면 PNG(원본 종횡비 유지). 캡처 사진에는 텍스트/로고를 임의 재합성하지 않는다. 공식 페이지에 알맞은 화면이 없으면 출처가 있는 회사 프로필 자료로 대체하되 사용자 승인 필수.

**이미지 2**: 원천 데이터 값과 화면 표시 값의 정확한 일치를 검증한 다음 sharp + SVG 템플릿으로 카드 렌더. `종목명`, `ticker`, `시가총액`, `시장`, `기준일/시각`, `통화`, *검증된 경우* 순위. 출처 명칭은 하단. 큰 숫자 가독성, 한국어 폰트 번들 금지(라이선스 확인된 OS 폰트 사용/앱이 필요 폰트를 참조하도록 구현).

**이미지 3**: 범위 바(저가~고가), 현재가 마커, 52주 의미 안내, 출처/가격 정의. 수치는 `facts.json` 그대로, 그래픽에서 숫자를 생성형 이미지 AI에 넘기지 않는다. 읽기 쉬운 텍스트 테스트/정확도 스냅샷 필수.

**이미지 4**: 공식 IR·사업보고서/회사 소개 페이지의 `segment`를 구조화해 2~4칸 카드. 마땅한 매출 비중 없으면 원형그래프/비중 차트 금지. 비율이 있더라도 사업부문 상호배타성·대상연도·연결범위를 검증. 포털 검색 결과 통캡처는 기본 사용하지 않는다.

**이미지 5**: `ConceptImageProvider` 인터페이스로 공급자 교체 가능하게 구현한다. 입력은 산업·활동·톤과 금지 요소 목록(실재 기업 공식 사진으로 오인 금지, 위조 데이터 차트 금지, 임의 금융수치 금지). 성공 이미지의 provenance(모델, 프롬프트, 생성일, 라이선스)를 저장. 생성 모델을 연결하지 못하면 **임의의 사진을 첨부하거나 생성 성공으로 표시하지 말고** `needs_user:concept_image_required` 또는 사용자가 허용한 템플릿 대체로 처리한다. 필수 5장 조건은 최종 검증까지 보존.

## 8. 네이버 원고·출력 정책

제목 7개 후보/최종 1개, 5개 소제목, 초보자용 -해요/-에요, 과장 없는 도입, 공백 포함 800~1,000자(사용자 지정 시 우선), 모바일 짧은 문단, 태그 5개가 기본. 52주 숫자·순위·시총·사업 비중 등 숫자 주장마다 검증된 `factId` 연결. `outlook_visual`의 콘셉트는 사실 근거 역할이 아니다.

작성 이벤트는 V10 `compileDraft → insertImage → setImageCaption → draft:run → readback` 구조를 유지. SmartEditor 화면에 기존 미작성 글 복구 안내가 있으면 임의로 건너뛰지 않는다. 저장 여부가 불확실하면 재클릭 금지. 임시저장 목록 재열람/제목·본문·이미지 개수 검증 후 완료 처리. **공개 발행 금지**.

## 9. CLI 계약과 실행 예시

```powershell
pnpm install
pnpm test
pnpm typecheck
pnpm build
node dist/cli.js help
node dist/cli.js job:init --ticker 005930 --market KRX:KOSPI --workspace-root "C:\\BlogProjects\\v11_stock\\workspaces"
node dist/cli.js source:inspect --job "<job 절대경로>"
node dist/cli.js collect:run --job "<job 절대경로>" --cdp http://127.0.0.1:9222 --profile "<Chrome 전용 profile 절대경로>"
node dist/cli.js collect:check --job "<job 절대경로>"
node dist/cli.js render:run --job "<job 절대경로>"
node dist/cli.js draft:check --job "<job 절대경로>"
node dist/cli.js draft:run --job "<job 절대경로>" --cdp http://127.0.0.1:9222 --profile "<Chrome 전용 profile 절대경로>"
node dist/cli.js draft:resume --job "<job 절대경로>" --cdp http://127.0.0.1:9222 --profile "<Chrome 전용 profile 절대경로>"
```

옵션/명령이 실제 구현되기 전 문서상 계약임. `source:inspect`는 공식 URL/시세 출처/이용허가/데이터 날짜 검증 상태를 보여주고 `source-hints.json`을 생성 또는 수동 확인하도록 해야 한다. `render:run`은 원천 값/출처 변조 없이 이미지 2~5를 생성; 역할 1 PNG는 캡처 단계에서 생성. 수집 실패/서비스 약관 차단 시 자격증명 탈취나 브라우저 보안 우회 금지.

종료코드: 0 정상, 2 검증/실행 실패, 3 사용자 확인 필요, 4 저장 불확실 — V10과 일치. 중간 저장은 작업 ID+출처+데이터 날짜+해시를 검증하고 재개한다.

## 10. 단계별 Codex 구현 로드맵

| 단계 | 구현 작업 | 통과 기준 |
|---|---|---|
| M0 | 기존 V10 확인/새 private repo/`AGENTS.md`·CI·테스트셋업 | V10 변경 0건, 새 repo만 초기 commit |
| M1 | `stock` 스키마·5개 role·금융 수치 검증 함수·fixtures | 타입/유닛 테스트 통과; invalid quote/rank 차단 |
| M2 | 공식 사이트·시세 provider 인터페이스, ID/기준일/사용권 검증 | 종목 혼동·오래된 데이터·출처 누락 시 needs_user |
| M3 | 공통 브라우저 캡처 이식, 이미지 1 캡처/출처 기록 | 안정된 요소 캡처·정확한 SHA/비율 |
| M4 | 카드 2·3·4 SVG/sharp 렌더 + 금액 표기/위치 검증 | 골든 이미지 테스트, 숫자 대조 통과 |
| M5 | 콘셉트 이미지 provider + 수동/템플릿 대체 경로 | AI 이미지 출처·라벨·실패 시 stop |
| M6 | 원고 생성 계약/5장 배치/네이버 임시저장 검증 | 기존 V10의 resume/save safety 재현 |
| M7 | 한국 종목·미국 종목 각각 최소 1개 **실제 수집 통합 검증** | 실제 출처와 이미지 품질 검토; 미지원 결과 명시 |

**권장 구현 순서:** M0~M4까지 먼저 안정화, M5 선택적 AI 연결, M6~M7 순차 진행. 임시저장 안정성이 가장 중요하므로 브라우저/쓰기 코드 수정 최소화.

## 11. 실패 테스트 매트릭스 (반드시 자동화)

- 시장 심볼 충돌 / KRX 선행 0 소실 / 상장시장 불일치 → 정지.
- 제공자 응답 누락/차단/약관 제약 → 다른 숫자 임의 보충 금지.
- quote는 KRW, 52주 데이터는 USD이거나 보정 기준 불일치 → 범위 카드 생성 금지.
- 고가==저가 / current가 공식 범위 밖 / 날짜 역전 → 무조건 clamp하지 않고 확인 필요.
- KOSPI 순위 출처·모집단·기준일 누락 → 순위 출력 금지.
- 공식 사이트 메인 화면에서 실제 관련 회사가 아닌 이미지 → 검증 실패.
- 사업 비중 합계/연도/연결범위 불일치 → 비중 표기 금지.
- 한글 폰트 깨짐·자막 숫자 누락·이미지 비율 왜곡 → 렌더 실패.
- `post.json` 이미지 4장/6장·중복 role·잘못된 소제목 배치 → 검수 실패.
- 캐시 값 변경·해시 변경·출처 URL 변경 → 무효화 후 재수집.
- 임시저장 확인 불가/기존 글 복구안내/502·CDP 오류 → 안전 중단, 중복 입력 금지.

## 12. GitHub PRIVATE 저장소 생성 순서 (사용자가 Codex에서 수행)

```powershell
# 1. gh가 설치/인증된 상태여야 함. 존재 여부를 먼저 검사.
gh auth status
gh repo view DS-8305/v11_stock
# 저장소가 없다는 것이 명확히 확인되었을 때만:
mkdir v11_stock
cd v11_stock
git init -b main
# 이 설계서를 docs/v11_stock_implementation_spec.md에 복사하고
# AGENTS.md/README.md/package.json 등을 Codex가 만든 뒤:
git add .
git commit -m "chore: bootstrap v11 stock automation"
gh repo create DS-8305/v11_stock --private --source=. --remote=origin --push
```

`gh repo view`가 권한/네트워크 오류라면 단순 미존재로 단정하고 새 repo를 만들지 말 것. 저장소 만들기 권한이 없다면 사용자에게 GitHub 웹사이트에서 새 비공개 저장소를 생성하도록 안내. V10 `git clone` 후 전체 커밋 히스토리/브라우저 데이터 복제하는 방식은 지양.

## 13. 인수·운영 체크리스트

- [ ] V10은 GitHub에서도 로컬에서도 변경 없음
- [ ] 새 repo 비공개, workspaces/.runtime/.env/프로필/gitignored
- [ ] 한국/미국 티커 식별·영업일·통화·기준일 처리
- [ ] 5개의 이미지 role/순서/원본 출처/라이선스/해시 검증
- [ ] 모든 숫자 사실은 검증된 sourceUrl 및 시각과 연결
- [ ] 이미지 2~4 PNG 시각 검수, 이미지 5 AI 콘셉트 표시
- [ ] 5개 소제목 + 5장 배치·한글 줄바꿈 검수
- [ ] 오프라인 자동테스트와 실제 사이트 수동 통합테스트 별도 보고
- [ ] 네이버 임시저장 재열람 확인; 공개발행 없음
- [ ] 완료 시 `README.md`, 실행법, 테스트 성적, 잔여 제약 정리

## 14. 참고 코드 (GitHub 로그인 필요)

- 원본: https://github.com/DS-8305/N_Blog_V10_Budong/tree/2b7f772bdf5817604a3019115a308d8265f962f4
- 화면 캡처: `src/capture/captureRegion.ts`, `readiness.ts`, `captureAsset.ts`
- 오케스트레이션: `src/collectors/collectJob.ts`
- 자료 계약: `src/domain/bundle.ts`, `src/editorial/assetValidation.ts`
- 네이버 입력: `src/automation/imageUploader.ts`, `draftRunner.ts`, `draftVerifier.ts`

**종료 조건:** 실제로 확인한 주식 한 종목을 원천 증거와 다섯 장 이미지 및 임시저장 검증 자료로 재현 가능하게 만들 것. 실제 입력 가능성 검증 없이 완성/100% 자동화를 주장하지 말 것.
