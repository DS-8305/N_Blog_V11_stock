# Review notes

## 2026-10-24 — 국내 2·5번 이미지 WiseReport 요소 박스 캡처

- 배경: 유안타증권(003470) 2·5번이 LG유플러스 기준과 달랐음. 원인: v3(theme=light) URL + 고정 좌표 clip, 그리고 삼성전자 이후 스크립트들이 `#cTB25`(투자의견/추정실적 컨센서스)로 먼저 스크롤해 5번에 컨센서스 카드가 찍힘.
- 변경: capture:init 국내 기본값 — 2번 `#pArea`(v2 URL, extent maxHeight 680, 라벨 시세 및 주주현황·주요주주), 5번 `#wrapper` 안 `#finSummary`~`#cTB00 + div`(maxHeight 620, 라벨 Financial Summary·연간·분기). 둘 다 forbiddenRegionLabels ['투자의견 컨센서스','추정실적 컨센서스'].
- 규칙: 캡처는 요소 boundingBox(extent) 기준, 영역 안에 실제 렌더된 텍스트로 라벨 검증; 금지 라벨 → forbidden_label_present / capture_forbidden_label_present(needs_user). naverpay 부모 URL로 navercomp.wisereport.co.kr `/v2/company/` + cmp_cd=티커만 허용(v3 거부).
- 반영: AGENTS.md 11행, src/domain/capture.ts(forbiddenRegionLabels·extent), capture/readiness.ts(resolveExtentArea·영역 텍스트·금지 라벨), sourceProfiles.ts, captureRegion.ts, sourceCapture.ts(재검증 시 regionText 라벨 확인), cli/captureCommands.ts, 테스트.
- 호환: 새 필드는 선택 — 없으면 기존 동작·fingerprint 그대로, 기존 매니페스트 재검증 통과.
- 승인: 2026-10-24 사용자 승인(잡Bot 경유).

## 2026-10-23 — V11 제목 후보 틀 다양화

- 배경: 최근 제목 대부분이 '[숫자] 찍은/진입한 OO 주가, 지금이 바닥일까?'로 반복됨(사용자 지적).
- 변경: 후보 7→5개, 프레임 5종(사건 도입형 / 숫자 대비형 / 독자 관점형 / 회의적 질문형 / 기타) 1개씩.
- 규칙: 같은 어미는 5개 중 최대 1회; 선택 제목은 최근 10건 제목의 어미 재사용 금지('지금이 바닥일까?' 지양).
- 반영: AGENTS.md, p11 프롬프트(레포 밖), src/editorial/titleDiversity.ts(checkTitleDiversity), postValidation.ts(five_titles_required·title_ending_repeated), createPost.ts·titles.ts 기본 후보 5개, 테스트.
- 호환: asOfDate < 2026-10-24 인 기존 잡은 7개 후보 그대로 재검증 통과.
- 승인: 2026-10-23 사용자 채팅 승인.
