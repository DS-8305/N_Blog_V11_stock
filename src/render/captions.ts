import type {AssetRole} from '../domain/asset.js';
import type {FactDocument} from '../domain/stock.js';
import {localDate} from '../domain/validation.js';
export function captionFor(role:AssetRole,f:FactDocument,capturedAt:string):string{
 if(role==='overview_hero')return `${f.identity.issuerName} 공식 회사 소개 화면 · 촬영 ${localDate(capturedAt,'Asia/Seoul')}`;
 if(role==='outlook_visual')return 'AI 생성 콘셉트 이미지 · 실제 기업 현장의 증거 사진이 아니에요';
 const v=role==='market_cap_card'?f.marketCap:role==='price_52w_card'?f.range52w:f.business,label=role==='market_cap_card'?'시가총액·상장시장':role==='price_52w_card'?'52주 가격 범위·마지막 가격':'공식 자료로 확인한 주요 사업';
 return `${label} · ${v.sourceName} · ${localDate(v.asOf,v.timezone)}`;
}
