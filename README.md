# N_Blog_V11_stock

회사·주식 자료 화면 5장으로 네이버 블로그 소개 초안을 준비합니다. 기본 순서는 **회사 소개 → 기업현황 → 주가 화면 → 사업분야 → 실적 자료**입니다. PNG의 원본 크기와 비율을 보존하고 SmartEditor 사진 설명칸에 캡션을 넣습니다.

금융 제공자는 검토한 파일을 가져오는 `reviewed_file` 어댑터입니다. 티커만으로 시세를 자동 인증하지 않습니다. 캡처와 금융 검증을 따로 준비한 뒤 원고에서 연결합니다. 사용 허용 근거·종목·기준일·가격 기준이 부족하면 `needs_user`로 중단합니다.

## 설치

Windows 11, Node >=22.12, pnpm 11, Chrome을 사용합니다.

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm build
node dist/cli.js help
```

제한된 Windows 실행 환경에서 임시 폴더의 파일 교체가 막히면 `TEMP`와 `TMP`를 쓰기 가능한 `.runtime/test-temp`로 지정한 뒤 테스트하세요. legacy 카드 모드는 OS 맑은 고딕 또는 `NBLOG_FONT_FILE`/`NBLOG_FONT_FAMILY`가 필요합니다.

## 작업과 캡처 설정

```powershell
$stockJobResult = node dist/cli.js job:init --ticker 009150 --market KRX:KOSPI --issuer-name 삼성전기 | ConvertFrom-Json
$stockJobPath = $stockJobResult.jobPath
node dist/cli.js capture:inspect --job $stockJobPath
```

`workspaces/`의 작업 폴더에 `request.json`, `state.json`, `capture-hints.json`, `source-hints.json`, `provider-data.template.json`을 만듭니다. 기본 `conditions.imageLayout`은 `stock_sources_five_v1`입니다.

`capture-hints.json`의 5개 source를 실제 UI 확인 결과로 채웁니다. 초기 템플릿은 승인된 자료가 아닙니다.

| 설정 | 기록할 내용 |
|---|---|
| url / hostname / verificationUrl | HTTPS 자료 주소, 허용 호스트, 회사·코드·거래소를 확인할 주소 |
| identitySelector / requiredIdentityLabels | verificationUrl에서 읽는 식별 영역과 회사명·정확한 ticker·거래소 문구 |
| selector / requiredRegionLabels | 실제 캡처 영역 하나와 반드시 보이는 문구 |
| frame | 필요한 경우 부모 iframe selector와 실제 자료 호스트 |
| selection | 기간/탭 버튼 selector와 문구; 클릭 뒤 활성 상태를 검사 |
| sourceDateText / unitText / marketScope | 실제 표시된 날짜·단위·시장 범위; 미표시는 null |
| priceBasis / selectedPeriod | 검토한 가격 기준과 `YYYY-MM-DD~YYYY-MM-DD` 기간 |
| permission / licenseNote | 사용 허용 상태 approved, 구체적인 허용 근거와 출처 이용 조건 |

회사 페이지는 `company`, 국내 네이버페이 화면은 `naverpay` 프로필을 사용합니다. 별도의 verificationUrl을 지정하면 그 페이지에서 종목 식별을 확인하고, 캡처할 회사 페이지에서도 회사명을 확인합니다. 네이버페이는 `stock.naver.com/domestic/stock/<ticker>/...`, 프레임은 검토한 `navercomp.wisereport.co.kr` 호스트와 정확한 `cmp_cd`를 검사합니다. 회사명이 같아도 코드가 다른 우선주를 허용하지 않습니다. 해외 종목은 검토한 다른 자료의 `company` 프로필을 사용하세요.

회사 소개·사업분야·실적 자료의 미표시 날짜를 촬영일로 대신 인증하지 않습니다. 가격·기업현황은 날짜, 단위, 시장 범위가 금융 사실과 일치해야 합니다. KRX와 KRX+NXT는 다르게 취급합니다. '수정주가' 문구만으로 조정 정의를 추정하지 않습니다. 확인한 자료의 정의를 공급자 근거와 일치시켜야 합니다. 1년 차트의 극값으로 52주 원천 값을 대신하지 않습니다.

```powershell
node dist/cli.js capture:inspect --job $stockJobPath
node dist/cli.js capture:approve --job $stockJobPath --fingerprint <basisFingerprint> --reviewer <검토자명>
```

## Chrome과 캡처

전용 프로필로 Chrome을 시작합니다. CLI는 실행 중인 Chrome에 연결하며 로그인 보안을 우회하지 않습니다. `--profile`에는 실제 해당 세션의 전용 프로필 절대경로를 지정합니다. 기본 CDP는 **http://127.0.0.1:9223**이며 `--cdp`로 바꿀 수 있습니다.

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --remote-debugging-port=9223 --user-data-dir=C:\BlogChromeProfile
node dist/cli.js capture:run --job $stockJobPath --profile C:\BlogChromeProfile
node dist/cli.js capture:check --job $stockJobPath
```

회사명·코드·시장·호스트·탭 선택·필요 문구·로딩·가림·잘림·PNG 해시를 검사합니다. 부모 프레임이 로딩 중이면 자식 DOM이 읽혀도 중단합니다. 실패한 재캡처는 이전 결과를 재사용하지 않습니다. 캡처 완료는 금융 사실 준비 완료와 별개입니다.

## 금융 사실과 원고 준비

[제공자 계약](docs/provider-contract.md)에 따라 실제 `provider-data.json`과 근거 파일, 사용 허용 근거를 준비합니다. 템플릿의 null을 단순히 verified로 바꾸지 말고 실제 출처·날짜·수치와 대조하세요.

```powershell
node dist/cli.js source:inspect --job $stockJobPath
node dist/cli.js source:approve --job $stockJobPath --fingerprint <financialBasisFingerprint> --reviewer <검토자명>
node dist/cli.js collect:run --job $stockJobPath
node dist/cli.js collect:check --job $stockJobPath
node dist/cli.js post:prepare --job $stockJobPath
```

새 모드의 `collect:run`은 금융 facts와 영수증만 준비해 브라우저가 필요 없습니다. `post:prepare`는 facts와 캡처를 대조해 `assets.json`과 `post.json`을 만들고 이미지 검토 필요(종료코드 3)를 반환합니다. source 모드에서 `render:run`을 실행하면 새 명령을 안내합니다.

PNG 5장과 캡션을 실제로 보고 이미지 fingerprint로 승인합니다. 이후 원고도 읽고 별도로 승인합니다.

```powershell
node dist/cli.js assets:approve --job $stockJobPath --fingerprint <reviewFingerprint> --reviewer <검토자명>
node dist/cli.js post:review-basis --job $stockJobPath
node dist/cli.js post:approve --job $stockJobPath --fingerprint <postBasisFingerprint> --reviewer <검토자명>
node dist/cli.js draft:check --job $stockJobPath
```

제목 후보 7개, 소제목 5개, 사진 설명 5개, 태그 5개를 만듭니다. 본문·소제목·캡션·출처와 줄바꿈 포함 기본 800–1000자를 검사하며 제목/태그는 제외합니다. `job:init --length-min <정수> --length-max <정수>`로 지정할 수 있습니다. 원천 사실은 자르지 않고 분량 초과를 보고합니다. `post.json`을 편집하면 다시 검토·승인해야 합니다. [원고 검토 가이드](docs/editorial-guide.md)를 참고하세요.

## 임시저장과 재개

```powershell
node dist/cli.js draft:run --job $stockJobPath --profile C:\BlogChromeProfile
# 중단된 작업만 같은 CDP/프로필/소유 탭에서 재개
node dist/cli.js draft:resume --job $stockJobPath --profile C:\BlogChromeProfile
node dist/cli.js job:status --job $stockJobPath
```

입력과 저장 시도는 실행 전에 기록합니다. 결과가 불확실하면 재전송/재저장하지 않습니다. 저장 목록에서 해당 글을 다시 열어 제목·본문·캡션·이미지 리소스·순서·비율을 확인해야 `draft_saved`입니다. 기존 복구 글이나 내용이 있는 편집기는 사용자 확인이 필요합니다. 공개 발행 명령은 없습니다.

입력을 시작하거나 저장한 작업은 수정/재수집/재승인하지 말고 새 작업을 만드세요. 불확실 입력 파일을 지워 강제로 재개하지 마세요. 강제 종료 후 잠금 파일은 pid·token·시작시각과 실제 프로세스/소유자를 확인한 뒤 수동 해제합니다. V10과 CDP 잠금 공간을 공유해 동시 제어를 막습니다.

## 기존 작업 호환과 검증 범위

`imageLayout` 없는 기존 작업은 `legacy_cards`입니다. 기존 이미지 역할·승인·입력 fingerprint를 유지합니다. 새 작업에서도 `job:init --image-layout legacy_cards`로 공식 화면 1장·숫자 카드 3장·AI 콘셉트 1장 방식을 선택할 수 있습니다. 이 방식은 기존 `source:approve → collect:run --profile ... → render:run → assets:approve → draft:check` 흐름과 콘셉트 provenance를 사용합니다.

V10 `2b7f772bdf5817604a3019115a308d8265f962f4`에서 브라우저·캡처·입력·저장 코어를 이식했습니다. 인증정보, 금융 원천 자료, 실제 캡처와 작업 산출물은 Git 제외 `workspaces/` 또는 `.runtime/`에 보관하세요.

종료코드는 0 성공, 2 검수/실행 실패, 3 자료·설정·검토 필요, 4 저장 불확실입니다. 오프라인 테스트와 실제 Chrome/네이버 계정 인수검사는 구분합니다. 실제 사용권·금융 자료·브라우저 연결이 없는 예시 캡처를 승인 자산으로 쓰지 않습니다. [검증 기록](docs/validation/live-checks.md).
