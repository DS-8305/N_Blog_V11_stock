import {join} from 'node:path';
import type {FactDocument} from '../domain/stock.js';import {factValues} from '../domain/stock.js';import {parseCaptureHints,type CaptureManifest} from '../domain/capture.js';import {parseAssetManifest} from '../domain/asset.js';import {factIdsFor,imageLayoutFor} from '../domain/imageLayout.js';import {localDate} from '../domain/validation.js';
import {acquireJobLock} from '../browser/runLock.js';import {readRequest,readJobState,writeJobState,assertJobMutable} from '../state/jobStore.js';import {atomicWriteJson,readJson} from '../state/jsonStore.js';import {collectionCheck} from '../collectors/collectJob.js';import {checkCapturedSources} from '../capture/sourceCapture.js';import {captionFor} from '../render/captions.js';import {createPost} from './createPost.js';import {validateAssets,assetReviewBasis} from './assetValidation.js';
export function assertCaptureFinancialContext(capture:CaptureManifest,facts:FactDocument):void{
 for(const s of capture.screens.filter(s=>s.role==='market_overview'||s.role==='price_history')){
  const fact=s.role==='market_overview'?facts.marketCap:facts.quote,date=s.sourceDateText?.match(/\d{4}[-./]\d{2}[-./]\d{2}/)?.[0]?.replace(/[./]/g,'-'),scope=facts.identity.mic==='XKRX'?'KRX':facts.identity.exchange,mapping=s.financialMapping;
  const unit=s.unitText?.replace(/\s+/g,''),currency=unit&&/^(?:원|천원|만원|백만원|억원|조원|KRW)$/.test(unit)?'KRW':unit&&/^(?:USD|\$|달러|천달러|백만달러)$/.test(unit)?'USD':undefined;
  const rawScope=s.marketScope?.replace(/\s+/g,'').toUpperCase(),visibleScope=rawScope&&/KRX.*NXT|NXT.*KRX/.test(rawScope)?'KRX+NXT':rawScope==='KRX'||rawScope==='XKRX'?'KRX':rawScope==='NASDAQ'||rawScope==='NYSE'?rawScope:undefined;
  if(date!==localDate(fact.asOf,fact.timezone)||visibleScope!==scope||currency!==facts.identity.currency||(mapping&&(mapping.currency!==currency||mapping.marketScope!==visibleScope)))throw Error('needs_user:capture_financial_context_mismatch');
  if(s.role==='price_history'){
   const basis=mapping?.priceBasis;
   if(basis?basis.definition!==facts.quote.value.priceBasis||!facts.quote.evidenceIds.includes(basis.evidenceId):s.priceBasis!==facts.quote.value.priceBasis)throw Error('needs_user:capture_price_basis_or_period_mismatch');
   const period=mapping?.period,rawPeriod=s.selectedPeriod?.replace(/\s+/g,'');
   if(period?.kind==='one_year'){if(!rawPeriod||!/^(?:1년|1[Yy]|1year)$/i.test(rawPeriod))throw Error('needs_user:capture_price_basis_or_period_mismatch');}
   else if(period?.kind==='explicit'){const visibleDates=rawPeriod?.match(/\d{4}[-./]\d{2}[-./]\d{2}/g)?.map(d=>d.replace(/[./]/g,'-'));if(visibleDates?.[0]!==period.from||visibleDates?.[1]!==period.to||period.from>period.to||period.to>date!)throw Error('needs_user:capture_price_basis_or_period_mismatch');}
   else if(rawPeriod!==`${facts.range52w.value.periodFrom}~${facts.range52w.value.periodTo}`)throw Error('needs_user:capture_price_basis_or_period_mismatch');
  }
 }
}
export async function preparePost(jobPath:string):Promise<{jobId:string;reviewFingerprint:string}>{const release=await acquireJobLock(jobPath);try{
 await assertJobMutable(jobPath);const request=await readRequest(jobPath);if(imageLayoutFor(request)!=='stock_sources_five_v1')throw Error('needs_user:source_capture_layout_required');
 let financial:Awaited<ReturnType<typeof collectionCheck>>;try{financial=await collectionCheck(jobPath);}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')throw Error('needs_user:financial_source_required');throw e;}const {facts,sourceFingerprint}=financial,capture=await checkCapturedSources(jobPath);assertCaptureFinancialContext(capture,facts);
 const hints=parseCaptureHints(await readJson(join(jobPath,'capture-hints.json')));const manifest=parseAssetManifest({schemaVersion:1,jobId:request.jobId,identity:facts.identity,asOfDate:facts.asOfDate,captureBasisFingerprint:capture.basisFingerprint,assets:capture.screens.map((s,i)=>{const factIds=factIdsFor(s.role,facts),v=factValues(facts).find(v=>v.factId===factIds.at(-1))??facts.outlook;return {assetId:s.role,role:s.role,assetKind:'source_screenshot',relativePath:s.relativePath,sourceUrl:s.frameUrl??s.parentUrl,capturedAt:s.capturedAt,asOf:v.asOf,factIds,caption:captionFor(s.role,facts,s.capturedAt,s),sha256:s.sha256,width:s.width,height:s.height,reviewStatus:'pending',licenseNote:hints.sources[i]!.licenseNote,displayContext:{ticker:facts.identity.ticker,market:facts.identity.market,currency:facts.identity.currency,asOfDate:facts.asOfDate},capture:s};})});
 // Permission and license remain attached to each reviewed source configuration.
 const report=await validateAssets(jobPath,facts,manifest,false);if(report.errors.length)throw Error('needs_user:'+report.errors.map(e=>e.code).join(','));const post=createPost(request,facts,manifest);
 await atomicWriteJson(join(jobPath,'assets.json'),manifest);await atomicWriteJson(join(jobPath,'post.json'),post);const state=await readJobState(jobPath);await writeJobState(jobPath,{...state,phase:'rendered',error:null});return {jobId:request.jobId,reviewFingerprint:assetReviewBasis(facts,manifest,sourceFingerprint)};
}finally{await release();}}
