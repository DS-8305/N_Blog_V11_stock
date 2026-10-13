import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface StockCandidate {
  market: 'KOSPI' | 'KOSDAQ' | 'NASDAQ' | 'S&P 500';
  ticker: string;
  name: string;
  sector?: string;
  price?: string;
  marketCap?: string;
  sourceUrl?: string;
}

export function parseCandidates(csvPath: string): StockCandidate[] {
  const content = readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  const candidates: StockCandidate[] = [];

  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.includes('코스피 시가총액 상위 300종목')) {
      currentSection = 'KOSPI';
      continue;
    } else if (line.includes('코스닥 시가총액 상위 10종목')) {
      currentSection = 'KOSDAQ';
      continue;
    } else if (line.includes('나스닥100 지수 편입 티커 101개')) {
      currentSection = 'NASDAQ';
      continue;
    } else if (line.includes('S&P 500 지수 편입 티커 503개')) {
      currentSection = 'SP500';
      continue;
    }

    // Skip header lines or descriptive metadata
    if (line.startsWith('순위,') || line.startsWith('번호,') || line.startsWith('조회일') || line.startsWith('4개') || line.startsWith('Codex') || line.startsWith('시트,') || line.startsWith('해석')) {
      continue;
    }

    // Split CSV (handling simple quoted strings)
    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(c => c.trim().replace(/^"|"$/g, ''));

    if (currentSection === 'KOSPI' && cols.length >= 6) {
      const rank = cols[0];
      const ticker = cols[1];
      const name = cols[2];
      const stockType = cols[3];
      const marketCap = cols[4];
      const price = cols[5];
      const url = cols[7];
      if (ticker && /^[0-9A-Z]{6}$/.test(ticker)) {
        candidates.push({
          market: 'KOSPI',
          ticker,
          name: `${name} (${stockType})`,
          price: `${price}원`,
          marketCap: `${marketCap}억원`,
          sourceUrl: url
        });
      }
    } else if (currentSection === 'KOSDAQ' && cols.length >= 5) {
      const ticker = cols[1];
      const name = cols[2];
      const marketCap = cols[3];
      const price = cols[4];
      const url = cols[6];
      if (ticker && /^[0-9A-Z]{6}$/.test(ticker)) {
        candidates.push({
          market: 'KOSDAQ',
          ticker,
          name,
          price: `${price}원`,
          marketCap: `${marketCap}억원`,
          sourceUrl: url
        });
      }
    } else if (currentSection === 'NASDAQ' && cols.length >= 4) {
      const ticker = cols[1];
      const name = cols[2];
      const sector = cols[3];
      const url = cols[5];
      if (ticker && /^[A-Z.]+$/.test(ticker)) {
        candidates.push({
          market: 'NASDAQ',
          ticker,
          name,
          sector,
          sourceUrl: url
        });
      }
    } else if (currentSection === 'SP500' && cols.length >= 4) {
      const ticker = cols[1];
      const name = cols[2];
      const sector = cols[3];
      const url = cols[5];
      if (ticker && /^[A-Z.]+$/.test(ticker)) {
        candidates.push({
          market: 'S&P 500',
          ticker,
          name,
          sector,
          sourceUrl: url
        });
      }
    }
  }

  // De-duplicate US tickers that exist in both NASDAQ and S&P500
  const seen = new Set<string>();
  const deduped: StockCandidate[] = [];
  for (const c of candidates) {
    const key = `${c.market === 'KOSPI' || c.market === 'KOSDAQ' ? 'KR' : 'US'}:${c.ticker}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(c);
    }
  }

  return deduped;
}

export function getCompletedTickers(workspacesDir: string): Set<string> {
  const completed = new Set<string>();
  if (!existsSync(workspacesDir)) return completed;

  const entries = readdirSync(workspacesDir);
  for (const entry of entries) {
    // Format: stock-YYYYMMDD-<TICKER>-...
    const match = entry.match(/^stock-\d{8}-([A-Za-z0-9]+)/);
    if (match) {
      completed.add(match[1].toUpperCase());
    }
  }
  return completed;
}

export function pickRandomCandidates(candidates: StockCandidate[], completed: Set<string>, count = 1): StockCandidate[] {
  const available = candidates.filter(c => !completed.has(c.ticker.toUpperCase()));
  if (available.length === 0) return [];

  // Fisher-Yates shuffle
  const shuffled = [...available];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

function runCli() {
  const csvPath = join(process.cwd(), 'data', 'stock-candidates-20261013.csv');
  const workspacesDir = join(process.cwd(), 'workspaces');

  const candidates = parseCandidates(csvPath);
  const completed = getCompletedTickers(workspacesDir);

  const countArg = parseInt(process.argv[2] ?? '1', 10);
  const picked = pickRandomCandidates(candidates, completed, countArg);

  console.log(`=== V11/V12 통합 종목 유니버스 (총 ${candidates.length}개 / 완료 ${completed.size}개 / 잔여 ${candidates.length - completed.size}개) ===`);
  console.log(`완료된 종목: ${Array.from(completed).join(', ')}\n`);
  console.log(`--- [랜덤 추천 종목 ${picked.length}선] ---`);

  picked.forEach((p, idx) => {
    console.log(`\n[추천 ${idx + 1}]`);
    console.log(`* 시장: [${p.market}]`);
    console.log(`* 티커: ${p.ticker}`);
    console.log(`* 종목명: ${p.name}`);
    if (p.sector) console.log(`* 섹터/산업군: ${p.sector}`);
    if (p.price) console.log(`* 기준 주가: ${p.price}`);
    if (p.marketCap) console.log(`* 기준 시총: ${p.marketCap}`);
  });
}

runCli();
