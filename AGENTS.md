# V11 stock development

Read docs/data-policy.md before changing collection, financial validation, rendering or writing.
Keep account data, provider responses, screenshots and job artifacts in ignored workspaces/ or .runtime/.
Do not publish to Naver. Do not retry a save whose result is uncertain. Reopen the saved draft and compare its title, body, captions and five images before reporting draft_saved.
Do not substitute fixtures for live financial evidence. Missing evidence, permission, identity, dates or required legacy concept image provenance must stop with needs_user.
Run pnpm test, pnpm typecheck and pnpm build. Record live checks separately from offline tests.

New jobs use stock_sources_five_v1: five original-ratio source_screenshot assets. Keep financial verification separate from capture. Require current capture, image and manuscript reviews. Missing imageLayout means legacy_cards; preserve saved fingerprints.
Capture standards:
- Domestic stocks (금호전기 표준): 1) 공홈 소개, 2) FnGuide WiseReport 기업개요/시세표, 3) 네이버페이 증권 1년 일봉 인터랙티브 차트, 4) 네이버페이 증권 기업개요, 5) 네이버페이 증권 재무제표.
- US stocks (토스증권 A안 표준): 1) 공홈 소개/비전, 2) 토스증권 종목정보 넉넉한 기업개요 및 시세 카드(약 730x445px), 3) 토스증권 '일' 선택 1년 일봉 캔들 추이 차트 카드(약 456x425px), 4) 공홈 정규 제품 포트폴리오, 5) 토스증권 종목정보 매출구성 원형 차트(약 580x420px).
Captions must never include the word '촬영'; use natural date or '기준' notation instead (e.g. '2026.10.13 기준' or '2026.10.13').
Titles must follow docs/high-ctr-title-rules.md: prioritize hybrid high-CTR hook patterns (core search keyword + verified numbers/catalyst + curiosity trigger; e.g. 상한가, 급등 배경, 시총 5조 달러 돌파 + 진짜 이유, 왜 불기둥 뿜었을까, 팩트 점검 3가지). For price swings, prefer intuitive drop/gain metrics (e.g. '전고 대비 50% 이상 하락', '고점 대비 반토막', '3배 급등') over raw price range spans.
