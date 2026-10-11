import sharp from 'sharp';
import {pricePosition,type FactDocument,type VerifiedValue} from '../domain/stock.js';
import {fontFamily,assertKoreanFont} from './fonts.js';
import {xml,text,multiline} from './svgSanitize.js';
export const numberText=(n:number)=>n.toLocaleString('en-US',{useGrouping:true,maximumFractionDigits:20});
export const money=(n:number,currency:string)=>`${numberText(n)} ${currency}`;
const frame=(title:string,identity:FactDocument['identity'],body:string,footer:string)=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200"><rect width="1200" height="1200" fill="#f4f7fc"/><g font-family="${xml(fontFamily())}"><rect x="60" y="60" width="1080" height="1080" rx="36" fill="#ffffff"/>${text(100,144,title,48,'#192b47',700)}${multiline(100,212,identity.issuerName,27,2,36)}${text(100,302,`${identity.ticker} · ${identity.market} · ${identity.currency}`,26,'#5b6c84')}${body}<path d="M100 1000H1100" stroke="#d6e2f5" stroke-width="2"/>${footer}</g></svg>`;
const footer=(v:VerifiedValue<unknown>)=>multiline(100,1040,`출처: ${v.sourceName}`,43,2,23,'#5b6c84')+text(100,1120,`기준: ${v.asOf} · ${v.timezone}`,23,'#5b6c84');
export function marketCapSvg(f:FactDocument):string {
 const c=f.marketCap.value;let body=text(100,420,'시가총액',34,'#5b6c84')+multiline(100,505,money(c.amount,c.currency),35,2,44,'#286cff')+text(100,645,`상장시장: ${f.identity.exchange}`,34)+text(100,714,'전체 시가총액 기준 · 기업가치(EV)와 구별해요',28,'#5b6c84');
 if(c.rank){body+=text(100,810,`시총 순위: ${numberText(c.rank.value)}위`,32)+multiline(100,865,`모집단: ${c.rank.population}`,42,2,23);}return frame('기업 규모를 살펴봐요',f.identity,body,footer(f.marketCap));
}
export function quoteLabel(f:FactDocument):string {const q=f.quote.value;return q.kind==='close'?'최종 거래일 종가':q.kind==='delayed'?`${q.delayMinutes}분 지연 장중가`:'장중가';}
export function priceRangeSvg(f:FactDocument):string {
 const r=f.range52w.value,q=f.quote.value,position=pricePosition(q,r),marker=position===null?text(140,660,'저가와 고가가 같아 위치 계산 생략',26):`<circle cx="${140+920*position}" cy="510" r="28" fill="#286cff"/>`;
 const body=text(100,402,'52주 저가와 고가 사이의 가격 범위예요',30,'#5b6c84')+`<rect x="140" y="498" width="920" height="24" rx="12" fill="#d6e2f5"/>${marker}`+text(140,582,'52주 저가',26)+text(140,628,money(r.low,r.currency),30)+text(770,582,'52주 고가',26)+text(770,628,money(r.high,r.currency),30)+text(140,760,`${quoteLabel(f)}: ${money(q.amount,q.currency)}`,36,'#286cff',700)+text(140,824,`기간: ${r.periodFrom} ~ ${r.periodTo}`,26)+text(140,875,`가격 기준: ${r.priceBasis} · ${r.definition==='close'?'종가 범위':'장중 범위'}`,26)+text(140,933,'이 범위만으로 미래 주가를 예측할 수는 없어요',26,'#5b6c84');
 return frame('최근 1년 가격을 읽어봐요',f.identity,body,footer(f.range52w));
}
export function businessSvg(f:FactDocument):string {
 const b=f.business.value;let body='';for(const [i,s]of b.segments.entries()){
  const x=100+(i%2)*520,y=355+Math.floor(i/2)*315;
  body+=`<rect x="${x}" y="${y}" width="490" height="290" rx="20" fill="#f4f7fc"/>`+multiline(x+24,y+54,s.name,18,1,32)+multiline(x+24,y+100,s.description,23,4,26,'#5b6c84');
  if(s.revenueShare!==undefined){if(!b.revenueBasis)throw Error('needs_user:revenue_basis_required');body+=text(x+24,y+255,`매출 비중 ${numberText(s.revenueShare)}%`,28,'#286cff');}
 }
 if(b.revenueBasis)body+=text(100,973,`${b.revenueBasis.fiscalYear}년 · ${b.revenueBasis.scope}`,24,'#5b6c84');
 return frame('주요 사업을 알아봐요',f.identity,body,footer(f.business));
}
export async function renderCard(svg:string):Promise<Buffer>{await assertKoreanFont();const png=await sharp(Buffer.from(svg)).png().toBuffer(),m=await sharp(png).metadata();if(m.format!=='png'||m.width!==1200||m.height!==1200)throw Error('card_dimensions_invalid');return png;}
