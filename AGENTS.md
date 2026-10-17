# V11 stock development

Read docs/data-policy.md before changing collection, financial validation, rendering or writing.
Keep account data, provider responses, screenshots and job artifacts in ignored workspaces/ or .runtime/.
Do not publish to Naver. Do not retry a save whose result is uncertain. Reopen the saved draft and compare its title, body, captions and five images before reporting draft_saved.
Do not substitute fixtures for live financial evidence. Missing evidence, permission, identity, dates or required legacy concept image provenance must stop with needs_user.
Run pnpm test, pnpm typecheck and pnpm build. Record live checks separately from offline tests.

New jobs use stock_sources_five_v1: five original-ratio source_screenshot assets. Keep financial verification separate from capture. Require current capture, image and manuscript reviews. Missing imageLayout means legacy_cards; preserve saved fingerprints.
Capture standards:
- Domestic stocks (제일기획 표준): 1) 공홈 소개/비전, 2) FnGuide WiseReport 기업개요·시세표·주요주주 풀 카드(x: 0, y: 45, width: 680, height: 660), 3) 네이버페이 증권 1년 일봉 인터랙티브 차트(차트 컨테이너 boundingBox 동적 추출), 4) 공홈 주요 사업/제품 포트폴리오, 5) FnGuide Financial Summary 연간·분기 재무제표(#finSummary 상단 스크롤 후 x: 0, y: 0, width: 680, height: 600).
- US stocks (네이버페이 증권 모바일 표준): 1) 공홈 소개/비전, 2) 네이버페이 증권 모바일 시세·대금·시총·52주범위 그리드 풀 카드(680x680 등 넉넉하게), 3) 네이버페이 증권 모바일 '일봉' 선택 일봉 캔들 및 거래량 차트(주의: 상단 고정/플로팅 헤더 약 100px에 탭바와 캔들 윗부분이 가려지지 않도록 window.scrollTo({ top: docTop - 110 }) 스크롤 후 5분봉/일봉 탭바부터 캔들, 거래량, 차트자세히보기까지 680x340~360 카드를 상하 여백과 함께 온전히 캡처), 4) 공홈 정규 제품 포트폴리오, 5) 네이버페이 증권 모바일 주요재무 연간/분기 실적표('원화로 환산' 체크, 680x720).
캡처 원칙: 2, 3, 5번 등 금융 데이터 이미지는 영역을 타이트하게 자르지 말고 무조건 크게 넉넉하게 캡처할 것! 사용자가 발행 전 에디터에서 수동으로 자를 수 있으므로, 이미지가 작거나 윗부분/아랫부분이 잘리는 것보다 상하 여백과 탭 바를 충분히 포함하여 큼직하게 전체 카드가 다 나오는 것이 최우선. 특히 모바일 차트는 상단 플로팅 헤더 오버랩을 반드시 회피할 것!
Captions must never include the word '촬영'; use natural date or '기준' notation instead (e.g. '2026.10.13 기준' or '2026.10.13').
Paragraph formatting: 1) '자료 출처' 문구 시작 전 앞 단락에서 한 줄 줄바꿈(빈 줄) 추가, 2) 해시태그 시작 전 앞 단락에서 한 줄 줄바꿈(빈 줄) 추가.
Titles must follow docs/high-ctr-title-rules.md: prioritize hybrid high-CTR hook patterns (core search keyword + 1 single standout verified metric/catalyst + curiosity trigger). Never cram multiple metrics (e.g. 매출·영업익·PER·PBR) into a single title—pick only 1 core metric so the sentence reads naturally (e.g. '영업익 3조 찍은 GS 주가, 지금이 바닥일까?'). For price swings, prefer intuitive drop/gain metrics (e.g. '전고 대비 50% 이상 하락', '고점 대비 반토막', '3배 급등') over raw price range spans.
Title focus: Prioritize '실적 역설형' (e.g. 영업익 3조 찍은 GS 주가, 지금이 바닥일까? / 영업익 1,000억 찍고도 OO 주가 반토막 난 진짜 이유) and '밸류에이션형' (e.g. PER 4배 진입한 OO 주가, 지금이 바닥일까?). Leave playful memes/metaphors for user manual customization.

