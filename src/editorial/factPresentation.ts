import type {FactDocument} from '../domain/stock.js';import {money,numberText,quoteLabel} from '../render/cards.js';
export function readerMoney(amount:number,currency:string):string{
 if(currency!=='KRW'||!Number.isSafeInteger(amount)||amount<0)return money(amount,currency);
 let remainder=BigInt(amount);const parts:string[]=[];for(const [unit,label]of [[1000000000000n,'조'],[100000000n,'억'],[10000n,'만']] as const){const value=remainder/unit;if(value){parts.push(value.toLocaleString('en-US')+label);remainder%=unit;}}
 if(remainder||!parts.length)parts.push(remainder.toLocaleString('en-US')+'원');else return parts.join(' ')+' 원';return parts.join(' ');
}
export function supportedClaimTexts(f:FactDocument):Record<string,string[]>{const r=f.range52w.value,b=f.business.value,result:Record<string,string[]>={
 [f.overview.factId]:[f.overview.value.summary],
 [f.marketCap.factId]:[...new Set([`시가총액 ${money(f.marketCap.value.amount,f.marketCap.value.currency)}`,`시가총액 ${readerMoney(f.marketCap.value.amount,f.marketCap.value.currency)}`])],
 [f.quote.factId]:[...new Set([`${quoteLabel(f)} ${money(f.quote.value.amount,f.quote.value.currency)}`,`${quoteLabel(f)} ${readerMoney(f.quote.value.amount,f.quote.value.currency)}`])],
 [f.range52w.factId]:[...new Set([`52주 저가 ${money(r.low,r.currency)}, 고가 ${money(r.high,r.currency)}`,`52주 저가 ${readerMoney(r.low,r.currency)}, 고가 ${readerMoney(r.high,r.currency)}`])],
 [f.business.factId]:b.segments.map(s=>`${s.name}: ${s.description}${s.revenueShare!==undefined?` (매출 비중 ${numberText(s.revenueShare)}%)`:''}`),[f.outlook.factId]:[...f.outlook.value.positive,...f.outlook.value.caution],
 };if(f.marketCap.value.rank)result[f.marketCap.factId]!.push(`시총 순위 ${numberText(f.marketCap.value.rank.value)}위 (${f.marketCap.value.rank.population})`);return result;}
