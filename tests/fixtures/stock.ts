// Synthetic financial data. Never use this fixture as live collection evidence.
export const request = {
  schemaVersion:1 as const, jobId:'stock-fixture', ticker:'005930', market:'KRX:KOSPI' as const,
  asOfDate:'2026-10-09', allowHistorical:true,
  conditions:{articleLength:{min:800,max:1000},imageCaptionPlacement:'native' as const},
};
const verified = <T>(factId:string, value:T) => ({factId,value,sourceUrl:'https://example.com/official-report',sourceName:'가상 공식 자료',retrievedAt:'2026-10-10T01:00:00Z',asOf:'2026-10-09T06:30:00Z',timezone:'Asia/Seoul',status:'verified' as const,method:'official_direct' as const,evidenceIds:['report']});
export function fixtureFacts() {
  return {
    schemaVersion:1 as const,jobId:request.jobId,asOfDate:request.asOfDate,
    identity:{assetType:'stock' as const,ticker:'005930',market:'KRX:KOSPI' as const,issuerName:'가상전자',mic:'XKRX',exchange:'KOSPI',securityType:'common_stock' as const,currency:'KRW' as const,status:'active' as const,sourceUrl:'https://example.com/official-report',evidenceIds:['report'],verified:true as const},
    overview:verified('overview',{summary:'가상전자는 반도체와 전자기기를 만드는 기업이에요.',industry:'반도체'}),
    quote:verified('quote',{amount:75000,currency:'KRW',mic:'XKRX',priceBasis:'unadjusted',kind:'close' as const,delayMinutes:0}),
    marketCap:verified('market_cap',{amount:450000000000000,currency:'KRW',kind:'total' as const}),
    range52w:verified('range_52w',{low:50000,high:100000,currency:'KRW',mic:'XKRX',priceBasis:'unadjusted',definition:'intraday' as const,periodFrom:'2025-10-10',periodTo:'2026-10-09'}),
    business:verified('business',{segments:[{name:'반도체',description:'메모리와 시스템 반도체를 공급해요.'},{name:'전자기기',description:'모바일 기기와 가전제품을 판매해요.'}]}),
    outlook:verified('outlook',{positive:['반도체 제품 수요 변화를 살펴봐요.'],caution:['시장 경쟁과 설비 투자 부담을 함께 확인해요.']}),
  };
}
