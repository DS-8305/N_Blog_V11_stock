import {createSourcePost} from './sourcePost.js';
import {FIVE_TITLES_SINCE} from './titleDiversity.js';
import {createReaderPost} from './readerFocused.js';
import {supportedClaimTexts} from './factPresentation.js';
import {rolesFor,imageLayoutFor} from '../domain/imageLayout.js';
import type {JobRequest} from '../domain/job.js';
import type {FactDocument} from '../domain/stock.js';
import {sectionHeadings,articleText,type PostDocument,type PostBlock} from '../domain/post.js';
import {requiredRoles,type AssetManifest} from '../domain/asset.js';
import {money,numberText,quoteLabel} from '../render/cards.js';
export function claimTexts(f:FactDocument):Record<string,string[]> {
 const texts=supportedClaimTexts(f);return {...texts,[f.marketCap.factId]:[texts[f.marketCap.factId]![0]!,...(f.marketCap.value.rank?[texts[f.marketCap.factId]!.at(-1)!]:[])],[f.quote.factId]:[texts[f.quote.factId]![0]!],[f.range52w.factId]:[texts[f.range52w.factId]![0]!]};
}
export function sourcesText(f:FactDocument):string {const names=[...new Set([f.overview,f.marketCap,f.quote,f.range52w,f.business,f.outlook,...(f.marketResearch?[f.marketResearch]:[])].map(v=>v.sourceName))];return `자료 출처: ${names.join(' · ')} | 시세 기준 ${f.range52w.value.periodTo}`;}
export function createPost(request:JobRequest,f:FactDocument,assets:AssetManifest):PostDocument {
 if(imageLayoutFor(request)==='stock_sources_five_v1')return request.conditions.editorialStyle==='reader_focused_v2'?createReaderPost(request,f,assets):createSourcePost(request,f,assets);
 const name=f.identity.issuerName,texts=claimTexts(f),range=texts[f.range52w.factId]![0]!,quote=texts[f.quote.factId]![0]!,cap=texts[f.marketCap.factId]![0]!;
 const paragraphs=[
  `${f.overview.value.summary} 종목 코드 ${f.identity.ticker}, 상장시장 ${f.identity.exchange}를 함께 확인해요. 같은 이름이라도 주식 종류와 거래소가 다를 수 있어요.`,
  `${cap}으로 확인됐어요. 시가총액은 주식시장에 반영된 기업 규모를 읽는 지표예요. 매출이나 현금 보유액을 뜻하지는 않아요. 사업과 시장 상황도 함께 살펴봐요.${f.marketCap.value.rank?` ${texts[f.marketCap.factId]![1]} 기준이에요.`:''}`,
  `${range}예요. ${quote}로 확인됐어요. 가격 범위는 지난 기간의 움직임을 보여줘요. 저가나 고가에 가깝다는 사실만으로 저평가나 상승 가능성을 결론낼 수는 없어요.`,
  `${texts[f.business.factId]!.join(' ')} 주요 사업은 고객에게 무엇을 제공하는지 중심으로 읽어봐요. 사업 이름이 비슷해도 제품과 고객은 달라요. 공식 자료의 발표 시점도 함께 확인해요.`,
  `공식 자료를 바탕으로 볼 점은 ${f.outlook.value.positive.join(' ')} 유의할 점은 ${f.outlook.value.caution.join(' ')} 이 항목들은 앞으로 점검할 의견이에요. 수요와 경쟁 환경은 달라질 수 있으므로 다음 공시에서 변화가 이어지는지 확인해요.`,
 ];
 const ids=[[f.overview.factId],[f.marketCap.factId],[f.range52w.factId,f.quote.factId],[f.business.factId],[f.outlook.factId]];
 const blocks:PostBlock[]=[{kind:'paragraph',text:`${name} 주식이 궁금하다면 회사가 하는 일부터 차근차근 살펴봐요. 아래 수치는 표시한 기준일의 자료예요.`,factIds:[],claims:[]}];
 for(const [i,role]of rolesFor(request).entries()){
  const asset=assets.assets.find(a=>a.role===role);if(!asset)throw Error('needs_user:five_images_required');
  const factIds=ids[i]!,claims=factIds.flatMap(factId=>texts[factId]!.map(text=>({text,factId})));
  blocks.push({kind:'heading',text:sectionHeadings[i]!,factIds:[],claims:[]},{kind:'image',assetId:asset.assetId},{kind:'caption',assetId:asset.assetId,text:asset.caption,factIds:asset.factIds},{kind:'paragraph',text:paragraphs[i]!,factIds,claims});
 }
 blocks.push({kind:'source',text:sourcesText(f)});
 const titleCandidates=[`${name}, 어떤 회사인지 처음부터 알아봐요`,`${name} 주식 읽기, 사업부터 기업 규모까지`,`${name} 기업 소개, 주요 사업을 살펴봐요`,`${name} 시가총액과 가격 범위를 읽는 법`,`${name} 주식이 궁금할 때 확인할 자료`,`${name} 사업 구조와 앞으로 볼 점`,`${name} 기업 규모와 시장 흐름 살펴보기`].slice(0,request.asOfDate<FIVE_TITLES_SINCE?7:5);
 const safeTag=name.replace(/[^\p{L}\p{N}]/gu,'');
 const post:PostDocument={schemaVersion:1,jobId:request.jobId,titleCandidates,selectedTitle:titleCandidates[0]!,titleFactIds:[],blocks,tags:[safeTag,'기업소개','주식공부','시가총액','사업분석']};
 // Educational context is added only if needed; source claims are never padded or shortened.
 const extra=[' 회사 소개와 시장 가격은 서로 다른 자료이므로 각각의 출처를 확인해요.',' 새 공시가 나오면 사업 설명과 시장 수치의 기준 시점을 다시 비교해요.',' 처음 읽는 용어는 기업 공식 자료에서 뜻과 적용 범위를 확인하면 도움이 돼요.'];
 const final=blocks[blocks.length-2]!;for(const sentence of extra){if(articleText(post).length>=request.conditions.articleLength.min)break;if(final.kind==='paragraph')final.text+=sentence;}
 return post;
}
