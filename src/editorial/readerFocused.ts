import type {JobRequest} from '../domain/job.js';
import type {FactDocument} from '../domain/stock.js';
import type {AssetManifest} from '../domain/asset.js';
import {sectionHeadings,type PostDocument,type PostBlock} from '../domain/post.js';
import {rolesFor} from '../domain/imageLayout.js';
import {supportedClaimTexts,readerMoney} from './factPresentation.js';
import {buildTitleCandidates,selectTitle,type TitleCandidate} from './titles.js';
import {sourcesText} from './createPost.js';

export function readerClaims(f:FactDocument):Record<string,string[]>{
 const texts=supportedClaimTexts(f);
 texts[f.business.factId]!.push(`${f.business.value.segments.length}개 핵심 사업`);
 if(f.marketResearch){const r=f.marketResearch.value;
  texts[f.marketResearch.factId]=[`최근 1년 차트는 ${r.chart.trend==='up'?'상승':r.chart.trend==='down'?'하락':'횡보'} 흐름입니다.`,r.chart.summary,r.chart.volumeSummary,...(r.return1m?[`1개월 수익률 ${r.return1m.percent>0?'+':''}${r.return1m.percent}%`]:[])];
 }
 return texts;
}
export function titleNumberClaims(f:FactDocument):{text:string;factId:string}[]{return [
 {text:`${f.business.value.segments.length}개 핵심 사업`,factId:f.business.factId},
 {text:`시총 ${readerMoney(f.marketCap.value.amount,f.marketCap.value.currency)}`,factId:f.marketCap.factId}
 ];}
export function buildReaderTitles(f:FactDocument):TitleCandidate[]{const name=f.identity.issuerName,business=f.business.value.segments[0]!.name,count=titleNumberClaims(f)[0]!.text,cap=titleNumberClaims(f)[1]!.text;
 const candidates=buildTitleCandidates(f);
 candidates[1]={text:`${name}, ${business}만 알았다면 놓칠 ${count}`,factIds:[f.business.factId],angle:'business_question',priority:100};
 candidates[3]={text:`${name} ${cap}, 규모보다 먼저 볼 사업은?`,factIds:[f.marketCap.factId,f.business.factId],angle:'scale',priority:85};return candidates;
}
export function createReaderPost(request:JobRequest,f:FactDocument,assets:AssetManifest):PostDocument{
 if(!f.marketResearch)throw Error('needs_user:market_research_required');
 if(!f.outlook.value.growthImpact)throw Error('needs_user:growth_impact_required');
 const research=f.marketResearch,texts=readerClaims(f),name=f.identity.issuerName,count=titleNumberClaims(f)[0]!.text;
 const overview=f.overview.value.summary,business=supportedClaimTexts(f)[f.business.factId]!.join(' '),cap=texts[f.marketCap.factId]!.filter(t=>t.startsWith('시가총액')).at(-1)!,quote=texts[f.quote.factId]!.at(-1)!,range=texts[f.range52w.factId]!.at(-1)!;
 const intro=`${overview}\n주요 사업은 ${f.business.value.segments.map(s=>s.name).join('·')}입니다.\n${f.overview.value.industry} 분야의 ${count}을 영위하는 회사입니다.`;
 const paragraphs=[
  `${overview} 종목 코드 ${f.identity.ticker}, 상장시장 ${f.identity.exchange}입니다. 주요 제품과 서비스를 사업부문별로 살펴보면 회사가 어떤 고객에게 무엇을 제공하는지 이해하기 쉽습니다.`,
  `${quote}이며, ${range}였습니다. ${cap}입니다.${research.value.return1m?` ${texts[research.factId]!.at(-1)}로 나타났습니다.`:''} 모두 같은 거래일의 자료입니다.`,
  `${texts[research.factId]!.slice(0,3).join(' ')} 최근의 가격 움직임과 거래량을 함께 살펴봤습니다.`,
  business,
  `사업 전망에 대한 의견입니다. ${f.outlook.value.caution.join(' ')} ${f.outlook.value.positive.join(' ')} ${f.outlook.value.growthImpact}`
 ];
 const ids=[[f.overview.factId],[f.quote.factId,f.range52w.factId,f.marketCap.factId,research.factId],[research.factId],[f.business.factId],[f.outlook.factId,f.business.factId]],blocks:PostBlock[]=[{kind:'paragraph',text:intro,factIds:[f.overview.factId,f.business.factId],claims:[{text:overview,factId:f.overview.factId},{text:count,factId:f.business.factId}]}];
 for(const [i,role]of rolesFor(request).entries()){const a=assets.assets.find(a=>a.role===role);if(!a)throw Error('needs_user:five_images_required');const factIds=ids[i]!,claims=factIds.flatMap(factId=>texts[factId]!.filter(text=>paragraphs[i]!.includes(text)).map(text=>({text,factId})));blocks.push({kind:'heading',text:sectionHeadings[i]!,factIds:[],claims:[]},{kind:'image',assetId:a.assetId},{kind:'caption',assetId:a.assetId,text:a.caption,factIds:a.factIds},{kind:'paragraph',text:paragraphs[i]!,factIds,claims});}
 blocks.push({kind:'source',text:sourcesText(f)});
 const candidates=buildReaderTitles(f),selected=selectTitle(candidates),safeTag=name.replace(/[^\p{L}\p{N}]/gu,''),businessTags=f.business.value.segments.map(s=>s.name.replace(/[^\p{L}\p{N}]/gu,'')).filter(Boolean);
 const tags=[...new Set([safeTag,...businessTags,'기업소개','주식공부','시가총액','사업분석','주가차트','거래량','기업실적','성장전망','주식분석','투자공부'])].slice(0,10);
 return {schemaVersion:1,jobId:request.jobId,titleCandidates:candidates.map(c=>c.text),selectedTitle:selected.text,titleFactIds:selected.factIds,blocks,tags};
}
