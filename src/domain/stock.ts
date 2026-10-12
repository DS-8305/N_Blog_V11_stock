import {array,record,string,strings,version,sourceUrl,timestamp,timezone,isoDate,safeId,enumeration,positive,integer,issue,localDate,type ValidationIssue} from './validation.js';
import type { JobRequest } from './job.js';

export const markets=['KRX:KOSPI','KRX:KOSDAQ','NASDAQ','NYSE'] as const;
export type Market=typeof markets[number];
export interface SecurityIdentity {assetType:'stock';ticker:string;market:Market;issuerName:string;mic:string;exchange:string;securityType:'common_stock'|'preferred_stock'|'adr';currency:string;status:'active';verified:true;sourceUrl:string;evidenceIds:string[]}
export interface VerifiedValue<T> {factId:string;value:T;sourceUrl:string;sourceName:string;retrievedAt:string;asOf:string;timezone:string;status:'verified'|'unverified';method:'official_direct'|'licensed_provider'|'derived';evidenceIds:string[]}
export interface Quote {amount:number;currency:string;mic:string;priceBasis:string;kind:'close'|'intraday'|'delayed';delayMinutes:number}
export interface Rank {value:number;population:string;rules:string;asOf:string;sourceUrl:string;evidenceIds:string[]}
export interface MarketCap {amount:number;currency:string;kind:'total';rank?:Rank;derivation?:{shareCount:number;shareBasis:'issued'|'outstanding';priceAsOf:string;sharesAsOf:string;sourceUrl:string;evidenceIds:string[]}}
export interface PriceRange {low:number;high:number;currency:string;mic:string;priceBasis:string;definition:'close'|'intraday';periodFrom:string;periodTo:string}
export interface Segment {name:string;description:string;revenueShare?:number}
export interface Business {segments:Segment[];revenueBasis?:{fiscalYear:string;scope:string;mutuallyExclusive:true;complete:true;sourceUrl:string;evidenceIds:string[]}}
export interface MarketResearch {writingDate:string;tradingDate:string;nonTradingDates:string[];currency:string;mic:string;priceBasis:string;return1m?:{percent:number;periodFrom:string;periodTo:string};chart:{periodFrom:string;periodTo:string;trend:'up'|'down'|'sideways';summary:string;volumeSummary:string}}
export interface FactDocument {schemaVersion:1;jobId:string;asOfDate:string;identity:SecurityIdentity;overview:VerifiedValue<{summary:string;industry:string}>;quote:VerifiedValue<Quote>;marketCap:VerifiedValue<MarketCap>;range52w:VerifiedValue<PriceRange>;business:VerifiedValue<Business>;outlook:VerifiedValue<{positive:string[];caution:string[];growthImpact?:string}>;marketResearch?:VerifiedValue<MarketResearch>}

function parseResearch(v:unknown):MarketResearch {
 const d=record(v),c=record(d.chart);let return1m:MarketResearch['return1m'];
 if(d.return1m!==undefined){const r=record(d.return1m);if(typeof r.percent!=='number'||!Number.isFinite(r.percent)||r.percent< -100)throw Error('invalid_month_return');return1m={percent:r.percent,periodFrom:isoDate(r.periodFrom),periodTo:isoDate(r.periodTo)};}
 return {writingDate:isoDate(d.writingDate),tradingDate:isoDate(d.tradingDate),nonTradingDates:strings(d.nonTradingDates,'non_trading_dates').map(isoDate),currency:string(d.currency,'currency'),mic:string(d.mic,'mic'),priceBasis:string(d.priceBasis,'price_basis'),...(return1m?{return1m}:{}),chart:{periodFrom:isoDate(c.periodFrom),periodTo:isoDate(c.periodTo),trend:enumeration(c.trend,['up','down','sideways'],'chart_trend'),summary:string(c.summary,'chart_summary'),volumeSummary:string(c.volumeSummary,'volume_summary')}};
}

export function parseTicker(v:unknown,market:Market):string {const t=string(v,'ticker');if(market.startsWith('KRX:')?!/^\d{6}$/.test(t):!/^[A-Z][A-Z0-9.-]{0,14}$/.test(t))throw Error('invalid_ticker');return t;}
export function parseIdentity(v:unknown):SecurityIdentity {
 const d=record(v,'identity'),market=enumeration(d.market,markets,'market');
 if(d.assetType!=='stock'||d.status!=='active'||d.verified!==true)throw Error('unverified_security_identity');
 const expected=market.startsWith('KRX:')?{mic:'XKRX',exchange:market.split(':')[1],currency:'KRW'}:{mic:market==='NASDAQ'?'XNAS':'XNYS',exchange:market,currency:'USD'};
 if(d.mic!==expected.mic||d.exchange!==expected.exchange||d.currency!==expected.currency)throw Error('identity_exchange_mismatch');
 const evidenceIds=strings(d.evidenceIds,'identity_evidence');if(!evidenceIds.length)throw Error('identity_evidence_required');
 return {assetType:'stock',ticker:parseTicker(d.ticker,market),market,issuerName:string(d.issuerName,'issuer_name'),...expected,exchange:expected.exchange!,status:'active',securityType:enumeration(d.securityType,['common_stock','preferred_stock','adr'],'security_type'),verified:true,sourceUrl:sourceUrl(d.sourceUrl),evidenceIds};
}
function verified<T>(v:unknown,parse:(x:unknown)=>T):VerifiedValue<T> {
 const d=record(v),evidenceIds=strings(d.evidenceIds,'evidence_ids');if(!evidenceIds.length)throw Error('evidence_required');
 return {factId:safeId(d.factId),value:parse(d.value),sourceUrl:sourceUrl(d.sourceUrl),sourceName:string(d.sourceName,'source_name'),retrievedAt:timestamp(d.retrievedAt),asOf:timestamp(d.asOf),timezone:timezone(d.timezone),status:enumeration(d.status,['verified','unverified'],'verification'),method:enumeration(d.method,['official_direct','licensed_provider','derived'],'verification_method'),evidenceIds};
}
export function parseQuote(v:unknown):Quote {const d=record(v);return {amount:positive(d.amount,'quote'),currency:string(d.currency,'currency'),mic:string(d.mic,'mic'),priceBasis:string(d.priceBasis,'price_basis'),kind:enumeration(d.kind,['close','intraday','delayed'],'quote_kind'),delayMinutes:integer(d.delayMinutes,'delay_minutes')};}
function parseCap(v:unknown):MarketCap {
 const d=record(v);if(d.kind!=='total')throw Error('total_market_cap_required');
 let rank:Rank|undefined,derivation:MarketCap['derivation'];
 if(d.rank!==undefined){const r=record(d.rank),evidenceIds=strings(r.evidenceIds,'rank_evidence');if(!evidenceIds.length)throw Error('rank_evidence_required');rank={value:integer(r.value,'rank',1),population:string(r.population,'rank_population'),rules:string(r.rules,'rank_rules'),asOf:timestamp(r.asOf),sourceUrl:sourceUrl(r.sourceUrl),evidenceIds};}
 if(d.derivation!==undefined){const r=record(d.derivation);derivation={shareCount:positive(r.shareCount,'share_count'),shareBasis:enumeration(r.shareBasis,['issued','outstanding'],'share_basis'),priceAsOf:timestamp(r.priceAsOf),sharesAsOf:timestamp(r.sharesAsOf),sourceUrl:sourceUrl(r.sourceUrl),evidenceIds:strings(r.evidenceIds,'shares_evidence')};if(!derivation.evidenceIds.length)throw Error('shares_evidence_required');}
 return {amount:positive(d.amount,'market_cap'),currency:string(d.currency,'currency'),kind:'total',...(rank?{rank}:{}),...(derivation?{derivation}:{})};
}
export function parseRange(v:unknown):PriceRange {const d=record(v);return {low:positive(d.low,'range_low'),high:positive(d.high,'range_high'),currency:string(d.currency,'currency'),mic:string(d.mic,'mic'),priceBasis:string(d.priceBasis,'price_basis'),definition:enumeration(d.definition,['close','intraday'],'range_definition'),periodFrom:isoDate(d.periodFrom),periodTo:isoDate(d.periodTo)};}
function parseBusiness(v:unknown):Business {
 const d=record(v),segments=array(d.segments,'segments').map(v=>{const s=record(v);let revenueShare:number|undefined;if(s.revenueShare!==undefined){if(typeof s.revenueShare!=='number'||!Number.isFinite(s.revenueShare)||s.revenueShare<0||s.revenueShare>100)throw Error('invalid_revenue_share');revenueShare=s.revenueShare;}return {name:string(s.name,'segment_name'),description:string(s.description,'segment_description'),...(revenueShare!==undefined?{revenueShare}:{})};});
 if(segments.length<2||segments.length>4||new Set(segments.map(s=>s.name)).size!==segments.length)throw Error('business_segments_2_to_4_required');
 let revenueBasis:Business['revenueBasis'];if(d.revenueBasis!==undefined){const r=record(d.revenueBasis);if(r.mutuallyExclusive!==true||r.complete!==true)throw Error('invalid_revenue_scope');revenueBasis={fiscalYear:string(r.fiscalYear,'fiscal_year'),scope:string(r.scope,'revenue_scope'),mutuallyExclusive:true,complete:true,sourceUrl:sourceUrl(r.sourceUrl),evidenceIds:strings(r.evidenceIds,'revenue_evidence')};if(!/^\d{4}$/.test(revenueBasis.fiscalYear)||!revenueBasis.evidenceIds.length)throw Error('invalid_revenue_basis');}
 return {segments,...(revenueBasis?{revenueBasis}:{})};
}
export function parseFacts(v:unknown):FactDocument {
 const d=record(v);version(d);
 const result:FactDocument={schemaVersion:1,jobId:safeId(d.jobId),asOfDate:isoDate(d.asOfDate),identity:parseIdentity(d.identity),overview:verified(d.overview,v=>{const o=record(v);return {summary:string(o.summary,'overview'),industry:string(o.industry,'industry')};}),quote:verified(d.quote,parseQuote),marketCap:verified(d.marketCap,parseCap),range52w:verified(d.range52w,parseRange),business:verified(d.business,parseBusiness),outlook:verified(d.outlook,v=>{const o=record(v),positive=strings(o.positive,'positive'),caution=strings(o.caution,'caution');if(positive.length<1||positive.length>2||caution.length<1||caution.length>2)throw Error('balanced_outlook_required');return {positive,caution};})};
 const outlookRaw=record(record(d.outlook).value);if(outlookRaw.growthImpact!==undefined)result.outlook.value.growthImpact=string(outlookRaw.growthImpact,'growth_impact');
 if(d.marketResearch!==undefined)result.marketResearch=verified(d.marketResearch,parseResearch);
 const ids=factValues(result).map(f=>f.factId);if(new Set(ids).size!==ids.length)throw Error('duplicate_fact_id');return result;
}
export const factValues=(f:FactDocument):VerifiedValue<unknown>[]=>[f.overview,f.quote,f.marketCap,f.range52w,f.business,f.outlook,...(f.marketResearch?[f.marketResearch]:[])];
export function pricePosition(q:Quote,r:PriceRange):number|null {
 if(q.currency!==r.currency||q.mic!==r.mic||q.priceBasis!==r.priceBasis)throw Error('price_basis_mismatch');
 if(r.low>r.high)throw Error('invalid_price_range');if(q.amount<r.low||q.amount>r.high)throw Error('quote_outside_range');
 return r.high===r.low?null:(q.amount-r.low)/(r.high-r.low);
}
export function validateFacts(request:JobRequest,f:FactDocument,now=new Date()):ValidationIssue[] {
 const errors:ValidationIssue[]=[],add=(c:string,p='')=>errors.push(issue(c,p));
 if(f.jobId!==request.jobId||f.asOfDate!==request.asOfDate)add('job_identity_mismatch');
 if(f.identity.ticker!==request.ticker||f.identity.market!==request.market||(request.issuerName&&f.identity.issuerName!==request.issuerName))add('security_identity_mismatch');
 const maxMarketAge=7,maxBusinessAge=550;
 for(const [key,v]of Object.entries(f).filter(([,v])=>v&&typeof v==='object'&&'factId'in v) as [string,VerifiedValue<unknown>][]){
  if(v.status!=='verified')add('unverified_fact',key);
  const factDate=localDate(v.asOf,v.timezone),age=(Date.parse(request.asOfDate)-Date.parse(factDate))/86400000;
  if(age<0||Date.parse(v.retrievedAt)>now.getTime()||Date.parse(v.asOf)>Date.parse(v.retrievedAt))add('future_fact',key);
  if(['quote','marketCap','range52w','marketResearch'].includes(key)&&age>maxMarketAge)add('market_data_stale',key);
  if(!['quote','marketCap','range52w','marketResearch'].includes(key)&&age>maxBusinessAge)add('company_data_stale',key);
 }
 if(!request.allowHistorical&&request.asOfDate!==localDate(now,'Asia/Seoul'))add('historical_request_requires_opt_in');
 if(request.asOfDate>localDate(now,'Asia/Seoul'))add('future_request');
 const q=f.quote.value,c=f.marketCap.value,r=f.range52w.value;
 if(request.conditions.editorialStyle==='reader_focused_v2'&&!f.marketResearch)add('market_research_required');
 if(request.conditions.editorialStyle==='reader_focused_v2'&&!f.outlook.value.growthImpact)add('growth_impact_required');
 if(f.marketResearch){
  const research=f.marketResearch.value,day=localDate(f.quote.asOf,f.quote.timezone),gap=(Date.parse(research.writingDate)-Date.parse(research.tradingDate))/86400000;
  if(research.writingDate!==request.asOfDate||research.tradingDate!==day||localDate(f.marketResearch.asOf,f.marketResearch.timezone)!==day)add('research_date_mismatch');
  if(research.currency!==q.currency||research.mic!==q.mic||research.priceBasis!==q.priceBasis)add('research_price_basis_mismatch');
  // A previous weekday is not assumed to have traded. Each intervening date
  // must be covered by the operator-reviewed exchange-calendar evidence.
  const gapDates:string[]=[];if(gap>=0&&gap<=7)for(let i=1;i<=gap;i++)gapDates.push(new Date(Date.parse(research.tradingDate)+i*86400000).toISOString().slice(0,10));
  if(gap<0||gap>7||research.nonTradingDates.length!==gapDates.length||new Set(research.nonTradingDates).size!==gapDates.length||gapDates.some(d=>!research.nonTradingDates.includes(d)))add('latest_trading_session_unconfirmed');
  const chartDays=(Date.parse(research.chart.periodTo)-Date.parse(research.chart.periodFrom))/86400000;
  if(research.chart.periodTo!==day||chartDays<350||chartDays>380)add('research_chart_period_mismatch');
  if(research.return1m){const days=(Date.parse(research.return1m.periodTo)-Date.parse(research.return1m.periodFrom))/86400000;if(research.return1m.periodTo!==day||days<27||days>35)add('research_month_period_mismatch');}
  if(f.marketResearch.method==='derived')add('unsupported_derived_fact','marketResearch');
 }
 if(q.currency!==f.identity.currency||c.currency!==f.identity.currency||q.mic!==f.identity.mic)add('identity_currency_mismatch');
 try{pricePosition(q,r);}catch(e){add((e as Error).message,'range52w');}
 if(r.periodFrom>=r.periodTo||r.periodTo!==localDate(f.range52w.asOf,f.range52w.timezone)||Math.abs((Date.parse(r.periodTo)-Date.parse(r.periodFrom))/86400000-364)>7)add('invalid_range_period');
 if(localDate(f.quote.asOf,f.quote.timezone)!==r.periodTo||localDate(f.marketCap.asOf,f.marketCap.timezone)!==r.periodTo)add('market_date_mismatch');
 if(q.kind==='delayed'&&q.delayMinutes===0||q.kind!=='delayed'&&q.delayMinutes!==0)add('quote_delay_mismatch');
 if(c.rank&&(localDate(c.rank.asOf,f.marketCap.timezone)!==localDate(f.marketCap.asOf,f.marketCap.timezone)||Date.parse(c.rank.asOf)>Date.parse(f.marketCap.retrievedAt)||Date.parse(c.rank.asOf)>now.getTime()))add('rank_date_mismatch');
 if(f.marketCap.method==='derived'){
  const d=c.derivation;if(!d||d.priceAsOf!==f.quote.asOf||d.sharesAsOf!==f.quote.asOf||f.marketCap.asOf!==f.quote.asOf||Math.abs(c.amount-q.amount*d.shareCount)>Math.max(1,c.amount*1e-12))add('invalid_derived_cap');
 }else if(c.derivation)add('unexpected_cap_derivation');
 if([f.quote,f.range52w,f.overview,f.business,f.outlook].some(v=>v.method==='derived'))add('unsupported_derived_fact');
 const b=f.business.value,shares=b.segments.filter(s=>s.revenueShare!==undefined);
 if(shares.length){if(!b.revenueBasis)add('revenue_basis_required');else if(shares.length!==b.segments.length||Math.abs(shares.reduce((n,s)=>n+s.revenueShare!,0)-100)>0.01||Number(b.revenueBasis.fiscalYear)>Number(f.business.asOf.slice(0,4)))add('revenue_share_mismatch');}
 return errors;
}
