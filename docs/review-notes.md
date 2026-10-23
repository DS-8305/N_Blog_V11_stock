# Review notes

## 2026-10-23 — V11 제목 후보 틀 다양화

- 배경: 최근 제목 대부분이 '[숫자] 찍은/진입한 OO 주가, 지금이 바닥일까?'로 반복됨(사용자 지적).
- 변경: 후보 7→5개, 프레임 5종(사건 도입형 / 숫자 대비형 / 독자 관점형 / 회의적 질문형 / 기타) 1개씩.
- 규칙: 같은 어미는 5개 중 최대 1회; 선택 제목은 최근 10건 제목의 어미 재사용 금지('지금이 바닥일까?' 지양).
- 반영: AGENTS.md, p11 프롬프트(레포 밖), src/editorial/titleDiversity.ts(checkTitleDiversity), postValidation.ts(five_titles_required·title_ending_repeated), createPost.ts·titles.ts 기본 후보 5개, 테스트.
- 호환: asOfDate < 2026-10-24 인 기존 잡은 7개 후보 그대로 재검증 통과.
- 승인: 2026-10-23 사용자 채팅 승인.
