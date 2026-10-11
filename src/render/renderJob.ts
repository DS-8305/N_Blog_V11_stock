import {join} from 'node:path';
import {collectionCheck} from '../collectors/collectJob.js';
import {readJobState,readRequest,writeJobState,assertJobMutable} from '../state/jobStore.js';
import {atomicWriteBytes,atomicWriteJson,readJson} from '../state/jsonStore.js';
import {jobFile} from '../state/paths.js';
import {parseAssetManifest,type StockAsset,type AssetManifest} from '../domain/asset.js';
import {loadProvider} from '../providers/registry.js';
import {ReviewedConceptImport,conceptRequest} from './conceptImage.js';
import {businessSvg,marketCapSvg,priceRangeSvg,renderCard} from './cards.js';
import {fingerprint,sha256} from '../editorial/fingerprint.js';
import {acquireJobLock} from '../browser/runLock.js';
import {validateAssets,assetReviewBasis} from '../editorial/assetValidation.js';
import {createPost} from '../editorial/createPost.js';
import {captionFor} from './captions.js';
export async function renderJob(jobPath:string):Promise<{manifest:AssetManifest;reviewFingerprint:string}>{
 const release=await acquireJobLock(jobPath);try{
  await assertJobMutable(jobPath);await jobFile(jobPath,'assets');await jobFile(jobPath,'receipts');const {facts,sourceFingerprint}=await collectionCheck(jobPath),request=await readRequest(jobPath),{hints}=await loadProvider(jobPath);
  const partial=parseAssetManifest(await readJson(join(jobPath,'assets.partial.json'))),overview=partial.assets.find(a=>a.role==='overview_hero');if(!overview)throw Error('needs_user:official_capture_required');
  // Generate concept first: missing generation evidence must not create a fake fifth image.
  const concept=await new ReviewedConceptImport(jobPath,hints.concept).generate(conceptRequest(facts.overview.value.industry,facts.business.value.segments.map(s=>s.name)));
  const generatedAt=new Date().toISOString(),displayContext={ticker:facts.identity.ticker,market:facts.identity.market,currency:facts.identity.currency,asOfDate:facts.asOfDate};
  const assets:StockAsset[]=[overview],hashes:Record<string,string>={};
  const specs=[['market_cap_card',marketCapSvg(facts),facts.marketCap,[facts.marketCap.factId],'시가총액·상장시장'],['price_52w_card',priceRangeSvg(facts),facts.range52w,[facts.quote.factId,facts.range52w.factId],'52주 가격 범위·마지막 가격'],['core_business_card',businessSvg(facts),facts.business,[facts.business.factId],'공식 자료로 확인한 주요 사업']] as const;
  for(const [role,svg,value,factIds,label]of specs){
   const png=await renderCard(svg),relativePath=`assets/${role}.png`;await atomicWriteBytes(join(jobPath,relativePath),png);hashes[role]=sha256(png);
   assets.push({assetId:role,role,assetKind:'data_card',relativePath,sourceUrl:value.sourceUrl,capturedAt:generatedAt,generatedAt,asOf:value.asOf,factIds:[...factIds],caption:captionFor(role,facts,generatedAt),sha256:hashes[role]!,width:1200,height:1200,reviewStatus:'pending',licenseNote:'검증된 출처 값으로 직접 렌더링',displayContext});
  }
  const relativePath='assets/outlook_visual.png';await atomicWriteBytes(join(jobPath,relativePath),concept.png);hashes.outlook_visual=sha256(concept.png);
  assets.push({assetId:'outlook_visual',role:'outlook_visual',assetKind:'ai_concept',relativePath,sourceUrl:null,capturedAt:generatedAt,generatedAt,asOf:facts.outlook.asOf,factIds:[],caption:'AI 생성 콘셉트 이미지 · 실제 기업 현장의 증거 사진이 아니에요',sha256:hashes.outlook_visual,width:1200,height:1200,reviewStatus:'pending',licenseNote:concept.provenance.licenseNote,displayContext,provenance:concept.provenance});
  const manifest=parseAssetManifest({schemaVersion:1,jobId:request.jobId,identity:facts.identity,asOfDate:facts.asOfDate,assets});
  await collectionCheck(jobPath);await atomicWriteJson(join(jobPath,'receipts','render.json'),{schemaVersion:1,jobId:request.jobId,sourceFingerprint,factsFingerprint:fingerprint(facts),generatedAt,hashes});
  const report=await validateAssets(jobPath,facts,manifest,false);if(report.errors.length)throw Error('needs_user:'+report.errors.map(e=>e.code).join(','));
  await atomicWriteJson(join(jobPath,'assets.json'),manifest);await atomicWriteJson(join(jobPath,'post.json'),createPost(request,facts,manifest));
  await atomicWriteJson(join(jobPath,'validation-report.json'),{...report,errors:[{code:'image_review_required',path:'assets',message:'Review five PNGs before approving'}]});
  const state=await readJobState(jobPath);await writeJobState(jobPath,{...state,phase:'rendered',error:null});return {manifest,reviewFingerprint:assetReviewBasis(facts,manifest,sourceFingerprint)};
 }finally{await release();}
}
export async function approveImages(jobPath:string,expectedFingerprint:string,reviewedBy:string):Promise<void>{
 const release=await acquireJobLock(jobPath);try{
  await assertJobMutable(jobPath);if(!reviewedBy.trim())throw Error('reviewer_required');const {facts,sourceFingerprint}=await collectionCheck(jobPath),manifest=parseAssetManifest(await readJson(join(jobPath,'assets.json'))),report=await validateAssets(jobPath,facts,manifest,false),basisFingerprint=assetReviewBasis(facts,manifest,sourceFingerprint);
  if(report.errors.length||basisFingerprint!==expectedFingerprint)throw Error('needs_user:image_review_stale');
  manifest.assets.forEach(a=>a.reviewStatus='approved');await atomicWriteJson(join(jobPath,'assets.json'),manifest);await atomicWriteJson(join(jobPath,'receipts','images.json'),{schemaVersion:1,jobId:facts.jobId,basisFingerprint,reviewedBy,reviewedAt:new Date().toISOString()});
 }finally{await release();}
}
