# N_Blog_V11_stock

개별 주식 소개를 위한 네이버 블로그 초안 워크플로입니다. 종목·시장 식별, 원천 증거 검증, 공식 회사 화면 캡처, 숫자 카드 3장, AI 콘셉트 이미지 1장, 초보자용 원고, SmartEditor 임시저장 재열람 검증을 지원합니다.

현재 연결된 데이터 제공자는 **검토한 파일을 가져오는 `reviewed_file` 어댑터**입니다. 티커만 넣어 실시간 시세를 자동 수집하는 서비스는 아닙니다. 이용 가능한 공식/라이선스 자료와 증거를 준비해야 합니다. AI 이미지도 모델·프롬프트·생성일·사용권을 확인한 PNG를 가져옵니다. 공급자와 브라우저 연결이 없으면 `needs_user`로 멈춥니다.

V10의 `2b7f772bdf5817604a3019115a308d8265f962f4`에서 일반 브라우저 잠금, 캡처, 입력, 이미지 업로드와 임시저장 검증 로직을 이식했습니다. 주식 계약과 원고 검증은 새로 작성했습니다. 원본 V10과 프로젝트 `sources/`는 변경하지 않았습니다. 사용자가 지정한 기존 저장소의 공개 범위는 유지했습니다.

## 설치와 검증

Windows 11, Node >=22.12, pnpm 11.12.0, Chrome을 사용합니다. 한국어 카드에는 OS의 맑은 고딕을 참조하며 폰트를 저장소에 포함하지 않습니다.

```powershell
pnpm install
pnpm test
pnpm typecheck
pnpm build
node dist/cli.js help
```

다른 OS에서는 Noto Sans CJK KR을 설치하거나 `NBLOG_FONT_FILE`과 `NBLOG_FONT_FAMILY`를 함께 지정하세요. 임의 폰트 파일의 재배포 대신 설치된 폰트를 사용합니다. CI는 Windows에서 실행합니다.

## 삼성전기 예제

삼성전기 공식 주가 페이지의 종목 코드는 `009150`입니다. 보통주·상장시장 식별은 실제 제공자의 증거로 다시 확인해야 합니다. [공식 회사 소개](https://www.samsungsem.com/kr/about-us/company/overview.do), [주가정보](https://www.samsungsem.com/kr/about-us/investor-relations/stock.do)는 출처 후보입니다.

```powershell
$stockJobResult = node dist/cli.js job:init --ticker 009150 --market KRX:KOSPI --issuer-name 삼성전기 | ConvertFrom-Json
$stockJobPath = $stockJobResult.jobPath
node dist/cli.js source:inspect --job $stockJobPath
```

작업 폴더에 `request.json`, `state.json`, 미확인 `provider-data.template.json`, `source-hints.json`이 생성됩니다. `provider-data.json`과 근거 파일을 [제공자 계약](docs/provider-contract.md)에 맞게 준비한 뒤 다시 검사합니다. null/미확인 값을 단순히 verified로 바꾸지 말고 실제 자료와 날짜를 대조하세요.

```powershell
node dist/cli.js source:inspect --job $stockJobPath
# 실제 원천 값, 이용권, 종목, 기준시점과 근거 파일을 검토한 사람이 실행합니다.
node dist/cli.js source:approve --job $stockJobPath --fingerprint <basisFingerprint> --reviewer <검토자명>
```

`source:approve`는 자료를 자동으로 사실 인증하는 기능이 아니라 검토한 입력의 해시를 고정하는 기록입니다. 입력/출처/증거가 변경되면 승인은 무효화됩니다.

## 수집·이미지·원고

이미 로그인된 전용 Chrome 프로필의 루프백 CDP 세션을 사용합니다. 프로필을 복사하거나 로그인 보안을 우회하지 않습니다. `--profile`에는 그 세션을 시작한 전용 프로필의 절대경로를 지정하세요.

기본 CDP 포트는 **9223**입니다. CLI는 실행 중인 Chrome에 연결합니다. 전용 프로필의 Chrome을 아래처럼 시작하고 로그인한 뒤 수집/입력을 실행하세요.

```powershell
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --remote-debugging-port=9223 --user-data-dir=C:\BlogChromeProfile
```

`--cdp`를 생략하면 `http://127.0.0.1:9223`을 사용합니다. 다른 포트가 필요하면 Chrome의 `--remote-debugging-port`와 CLI의 `--cdp` 포트를 동일하게 지정하세요. 예를 들어 9333은 `--remote-debugging-port=9333`, `--cdp http://127.0.0.1:9333`으로 설정합니다. 이미 입력을 시작한 작업을 재개할 때는 원래 CDP 주소·프로필·소유 탭을 그대로 사용해야 합니다.

Chrome 136 이상은 원격 디버깅에 기본 프로필과 다른 `--user-data-dir`을 요구하므로 위 전용 프로필을 사용합니다. [Chrome 공식 안내](https://developer.chrome.com/blog/remote-debugging-port?hl=ko)

```powershell
node dist/cli.js collect:run --job $stockJobPath --cdp http://127.0.0.1:9223 --profile C:\BlogChromeProfile
node dist/cli.js collect:check --job $stockJobPath
node dist/cli.js render:run --job $stockJobPath
```

공식 페이지는 출처 검토에서 확인한 호스트·영역·회사명과 일치해야 합니다. 다른 도메인 이동, CAPTCHA, 잘린 화면, 가려진 영역, 미완료 이미지 로딩은 중단합니다. 캡처는 원본 비율을 유지합니다. 나머지 PNG는 1200×1200입니다.

이미지 역할은 `overview_hero`, `market_cap_card`, `price_52w_card`, `core_business_card`, `outlook_visual` 순서로 정확히 5개입니다. 숫자는 검증된 값으로 직접 렌더링하고, 생성 이미지에는 금융 수치나 합성 기업 로고를 사용하지 않습니다. 콘셉트 PNG에는 `AI 생성 콘셉트 이미지` 라벨을 직접 추가합니다.

`render:run`은 다섯 이미지와 원고를 만들고 **이미지 검토 필요(종료코드 3)**를 반환합니다. 출력한 PNG를 실제로 확인한 뒤 그 결과의 fingerprint로 승인하세요.

```powershell
node dist/cli.js assets:approve --job $stockJobPath --fingerprint <reviewFingerprint> --reviewer <검토자명>
node dist/cli.js draft:check --job $stockJobPath
```

기본 원고는 제목 후보 7개, 선택 제목 1개, 소제목 5개, 이미지 5장과 캡션, 태그 5개입니다. 본문·소제목·캡션·출처 줄을 합친 공백 포함 800–1000자를 검사합니다(제목/태그 제외). 명시적 길이 변경은 `job:init --length-min <정수> --length-max <정수>`로 지정합니다. 긴 회사/사업 설명은 잘라서 사실을 바꾸지 않고 원고 길이 검수에서 중단합니다. 필요하면 `post.json`의 설명 문장을 수정한 뒤 재검수하세요. 숫자 주장과 사실 인용은 원천 `factId`에 연결해야 합니다. 기본 캡션은 native, 대안은 `--caption-placement body`입니다.

## 네이버 임시저장

```powershell
node dist/cli.js draft:run --job $stockJobPath --cdp http://127.0.0.1:9223 --profile C:\BlogChromeProfile
# 중단된 작업만, 같은 CDP/프로필/소유 탭에서 재개합니다.
node dist/cli.js draft:resume --job $stockJobPath --cdp http://127.0.0.1:9223 --profile C:\BlogChromeProfile
node dist/cli.js job:status --job $stockJobPath
```

기존 미작성 글 복구 안내나 내용이 있는 편집기는 사용자 확인이 필요합니다. 임시저장 시도는 클릭 전에 기록합니다. 결과가 불확실하면 `draft_unconfirmed`로 남기고 재저장하지 않습니다. 저장 목록에서 해당 제목을 다시 열어 본문·캡션·이미지 리소스·비율·순서를 대조해야 `draft_saved`가 됩니다. 공개 발행 명령은 없습니다.

각 입력 이벤트도 실행 전에 기록합니다. 실행 여부를 확인할 수 없는 입력은 다시 보내지 않고 `input_dispatch_unconfirmed`로 멈춥니다. 파일을 지워 억지로 재개하지 말고 실제 편집기 내용을 확인하세요. 이미 입력하거나 저장한 작업의 수집/렌더/승인 변경은 금지됩니다. 새 데이터를 사용하려면 새 작업을 만드세요.

프로세스가 강제 종료되면 잠금 파일이 남을 수 있습니다. 자동으로 잠금을 해제하지 않습니다. 잠금 파일의 pid·token·시작시각과 실제 실행 프로세스, CDP/프로필 소유자를 대조해 작업이 종료됐음을 확인한 뒤에만 해당 잠금 파일을 수동으로 제거하세요. V10과 같은 endpoint 잠금 디렉터리를 사용해 버전 간 동시 제어도 막습니다.

## 출력과 현재 검증 범위

작업 출력은 Git 제외 `workspaces/`에 저장됩니다. 인증정보, 프로필, 원천 시세와 실제 캡처를 커밋하지 마세요.

```text
request.json source-hints.json source-inspection.json state.json
facts.json assets.json post.json prepared-draft.json validation-report.json
assets/{overview_hero,market_cap_card,price_52w_card,core_business_card,outlook_visual}.png
receipts/{source-review,official-capture,render,images,draft-save}.json
input-progress.json input-dispatch.json input-proof.json
collection-checkpoint-facts.json
```

종료코드: 0 성공, 2 검수/실행 실패, 3 사용자 자료·설정·검토 필요, 4 저장 불확실.

오프라인 금융 검증, 실제 PNG 렌더, 캡처 준비 검사, 이미지 해시, 입력 재개, 저장 불확실 및 저장 목록 재열람 모의 테스트를 제공합니다. 실제 한국/미국 종목의 완전 수집과 네이버 계정 임시저장 인수검사는 아직 통과한 것으로 표시하지 않습니다. 자세한 결과와 필요한 연결은 [검증 기록](docs/validation/live-checks.md)에 있습니다.
