import {expect,it} from 'vitest';
import {captureBundle} from '../helpers/captureBundle.js';
import {createPost} from '../../src/editorial/createPost.js';
import {validatePost} from '../../src/editorial/postValidation.js';
import {parseFacts,validateFacts,type FactDocument} from '../../src/domain/stock.js';
import {articleText} from '../../src/domain/post.js';

function research(f:FactDocument):NonNullable<FactDocument['marketResearch']>{return {...f.quote,factId:'market_research',value:{writingDate:f.asOfDate,tradingDate:f.range52w.value.periodTo,nonTradingDates:[],currency:'KRW',mic:'XKRX',priceBasis:'unadjusted',return1m:{percent:12.5,periodFrom:'2026-09-09',periodTo:'2026-10-09'},chart:{periodFrom:'2025-10-09',periodTo:'2026-10-09',trend:'up',summary:'연간 차트는 전반적으로 상승했고 최근에는 고점에서 조정받았습니다.',volumeSummary:'상승 구간에서 거래량이 늘었고 최근 조정 구간에서는 줄었습니다.'}}};}
async function bundle(){const b=await captureBundle();if(!('request'in b))throw Error('prepared_fixture_required');b.request.conditions.editorialStyle='reader_focused_v2';b.facts.marketResearch=research(b.facts);(b.facts.outlook.value as any).growthImpact='반도체 제품 공급 확대가 매출과 이익 성장에 기여할 수 있습니다.';return b;}

it('writes a numbered title, three introduction lines, concrete figures and ten unique tags',async()=>{
 const b=await bundle(),p=createPost(b.request,b.facts,b.assets);
 expect(p.selectedTitle).toContain('2개');expect(p.tags).toHaveLength(10);expect(new Set(p.tags).size).toBe(10);
 const intro=p.blocks[0];if(intro?.kind!=='paragraph')throw Error('intro');expect(intro.text.split('\n')).toHaveLength(3);
 const market=p.blocks[8];if(market?.kind!=='paragraph')throw Error('market');
 for(const text of ['7만 5,000원','5만 원','10만 원','450조 원','12.5%'])expect(market.text).toContain(text);
 const chart=p.blocks[12];if(chart?.kind!=='paragraph')throw Error('chart');expect(chart.text).toContain('전반적으로 상승');expect(chart.text).toContain('거래량이 늘었고');
 const business=p.blocks[16];if(business?.kind!=='paragraph')throw Error('business');expect(business.text).toContain('메모리와 시스템 반도체');expect(business.text).not.toContain('사업별 역할을 구분하면');
 const final=p.blocks[20];if(final?.kind!=='paragraph')throw Error('outlook');expect(final.text).toMatch(/매출과 이익.*기여할 수 있습니다\.$/);
 expect(validatePost(b.request,b.facts,b.assets,p).errors).toEqual([]);expect(articleText(p).length).toBeLessThanOrEqual(1000);
});

it('blocks absent research and unsupported headline numbers instead of guessing chart movement',async()=>{
 const b=await bundle(),p=createPost(b.request,b.facts,b.assets);p.titleCandidates[0]=p.selectedTitle=p.selectedTitle.replace('2개','9개');expect(validatePost(b.request,b.facts,b.assets,p).errors.map(e=>e.code)).toContain('unsupported_title_number');
 delete (b.facts as any).marketResearch;expect(()=>createPost(b.request,b.facts,b.assets)).toThrow('market_research_required');
});

it('keeps reviewed research through parsing and rejects mismatched prices, stale sessions and fabricated holiday gaps',async()=>{
 const b=await bundle();expect((parseFacts(b.facts) as any).marketResearch.value.chart.trend).toBe('up');
 const f=structuredClone(b.facts) as any;f.marketResearch.value.priceBasis='split_adjusted';expect(validateFacts(b.request,f).map(e=>e.code)).toContain('research_price_basis_mismatch');
 f.marketResearch.value.priceBasis='unadjusted';f.marketResearch.value.writingDate='2026-10-12';b.request.asOfDate=f.asOfDate='2026-10-12';expect(validateFacts(b.request,f).map(e=>e.code)).toContain('latest_trading_session_unconfirmed');
});

it('uses the real previous session for a weekend with a preceding weekday holiday',async()=>{
 const b=await bundle(),f=b.facts as any;b.request.asOfDate=f.asOfDate='2026-10-10';
 for(const key of ['quote','marketCap','range52w','marketResearch'])f[key].asOf='2026-10-08T06:30:00Z';
 f.range52w.value.periodFrom='2025-10-09';f.range52w.value.periodTo='2026-10-08';
 Object.assign(f.marketResearch.value,{writingDate:'2026-10-10',tradingDate:'2026-10-08',nonTradingDates:['2026-10-09','2026-10-10']});
 f.marketResearch.value.chart.periodTo=f.marketResearch.value.return1m.periodTo='2026-10-08';
 expect(validateFacts(b.request,f)).toEqual([]);
 f.marketResearch.value.nonTradingDates=[];expect(validateFacts(b.request,f).map(e=>e.code)).toContain('latest_trading_session_unconfirmed');
});

it('requires the reviewed growth mechanism and rejects deletion of chart and volume explanations',async()=>{
 const b=await bundle(),p=createPost(b.request,b.facts,b.assets);
 const final=p.blocks[20];if(final?.kind!=='paragraph')throw Error('outlook');expect(final.text.endsWith((b.facts.outlook.value as any).growthImpact)).toBe(true);
 delete (b.facts.outlook.value as any).growthImpact;expect(()=>createPost(b.request,b.facts,b.assets)).toThrow('growth_impact_required');
 (b.facts.outlook.value as any).growthImpact='반도체 제품 공급 확대가 매출과 이익 성장에 기여할 수 있습니다.';
 for(const text of [b.facts.marketResearch!.value.chart.summary,b.facts.marketResearch!.value.chart.volumeSummary]){
  const changed=structuredClone(p),chart=changed.blocks[12];if(chart?.kind!=='paragraph')throw Error('chart');chart.text=chart.text.replace(text,'');chart.claims=chart.claims.filter(c=>c.text!==text);
  expect(validatePost(b.request,b.facts,b.assets,changed).errors.map(e=>e.code)).toContain('reader_required_section_claim_missing');
 }
 b.facts.marketResearch!.sourceName='검토한 별도 차트·거래일 자료';expect(createPost(b.request,b.facts,b.assets).blocks.at(-1)).toMatchObject({text:expect.stringContaining('검토한 별도 차트·거래일 자료')});
});

it('requires the market-cap amount even if an optional rank claim remains in the figures paragraph',async()=>{
 const b=await bundle();b.facts.marketCap.value.rank={value:5,population:'KOSPI 보통주',rules:'total cap descending',asOf:b.facts.marketCap.asOf,sourceUrl:b.facts.marketCap.sourceUrl,evidenceIds:b.facts.marketCap.evidenceIds};
 const p=createPost(b.request,b.facts,b.assets),market=p.blocks[8];if(market?.kind!=='paragraph')throw Error('market');
 const cap=market.claims.find(c=>c.factId===b.facts.marketCap.factId&&c.text.startsWith('시가총액'))!,rank='시총 순위 5위 (KOSPI 보통주)';
 market.text=market.text.replace(cap.text,rank);market.claims=market.claims.filter(c=>c.factId!==b.facts.marketCap.factId);market.claims.push({factId:b.facts.marketCap.factId,text:rank});
 expect(validatePost(b.request,b.facts,b.assets,p).errors.map(e=>e.code)).toContain('reader_required_section_claim_missing');
});
