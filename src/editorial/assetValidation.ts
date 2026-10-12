import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';
import {requiredRoles,type AssetManifest,type AssetRole} from '../domain/asset.js';
import {factValues,type FactDocument} from '../domain/stock.js';
import {issue,type ValidationReport} from '../domain/validation.js';
import {jobFile} from '../state/paths.js';
import {readJson} from '../state/jsonStore.js';
import {fingerprint,sha256} from './fingerprint.js';
import {collectionCheck} from '../collectors/collectJob.js';
export function assetReviewBasis(facts:FactDocument,manifest:AssetManifest,sourceFingerprint:string):string{return fingerprint({facts,sourceFingerprint,manifest:{...manifest,assets:manifest.assets.map(({reviewStatus:_,...a})=>a)}});}
export async function validateAssets(jobPath:string,facts:FactDocument,manifest:AssetManifest,requireReview=true):Promise<ValidationReport>{
 const errors:ValidationReport['errors']=[],add=(code:string,path='')=>errors.push(issue(code,path)),actualHashes:Record<string,string>={};
 let sourceFingerprint='';try{sourceFingerprint=(await collectionCheck(jobPath)).sourceFingerprint;}catch(e){add((e as Error).message);}
 if(manifest.jobId!==facts.jobId||manifest.asOfDate!==facts.asOfDate||fingerprint(manifest.identity)!==fingerprint(facts.identity))add('asset_identity_mismatch');
 if(manifest.assets.length!==5||new Set(manifest.assets.map(a=>a.role)).size!==5||requiredRoles.some((role,i)=>manifest.assets[i]?.role!==role))add('five_ordered_asset_roles_required');
 const requiredFacts:Partial<Record<AssetRole,readonly string[]>>={overview_hero:[facts.overview.factId],market_cap_card:[facts.marketCap.factId],price_52w_card:[facts.quote.factId,facts.range52w.factId],core_business_card:[facts.business.factId],outlook_visual:[]} as const;
 for(const a of manifest.assets){
  const path=a.assetId,expectedKind=a.role==='overview_hero'?'official_screenshot':a.role==='outlook_visual'?'ai_concept':'data_card';
  if(a.assetKind!==expectedKind)add('asset_kind_mismatch',path);
  if(a.relativePath!==`assets/${a.role}.png`)add('asset_role_path_mismatch',path);
  if(fingerprint(a.displayContext)!==fingerprint({ticker:facts.identity.ticker,market:facts.identity.market,currency:facts.identity.currency,asOfDate:facts.asOfDate}))add('asset_display_context_mismatch',path);
  if(fingerprint(a.factIds)!==fingerprint(requiredFacts[a.role]))add('asset_fact_binding_mismatch',path);
  if(requireReview&&a.reviewStatus!=='approved')add('image_review_required',path);
  try{const bytes=await readFile(await jobFile(jobPath,a.relativePath));actualHashes[a.assetId]=sha256(bytes);const m=await sharp(bytes).metadata();if(actualHashes[a.assetId]!==a.sha256)add('asset_hash_mismatch',path);if(m.format!=='png'||m.width!==a.width||m.height!==a.height)add('asset_metadata_mismatch',path);if(a.role!=='overview_hero'&&(a.width!==1200||a.height!==1200))add('square_1200_png_required',path);}catch(e){add((e as Error).message,path);}
  if(a.role==='outlook_visual'){if(a.sourceUrl!==null||!a.provenance||!a.caption.includes('AI 생성 콘셉트 이미지')||a.factIds.length)add('concept_provenance_required',path);}
  else{const id=a.role==='price_52w_card'?facts.range52w.factId:a.factIds[0],v=factValues(facts).find(v=>v.factId===id);if(!a.sourceUrl||!v||a.asOf!==v.asOf)add('asset_source_missing',path);if(a.assetKind==='data_card'&&a.sourceUrl!==v?.sourceUrl)add('card_source_mismatch',path);}
 }
 try{const a=manifest.assets.find(a=>a.role==='overview_hero'),r=await readJson(join(jobPath,'receipts','official-capture.json')) as Record<string,unknown>;if(!a||r.jobId!==facts.jobId||r.sourceFingerprint!==sourceFingerprint||r.sha256!==a.sha256||r.sourceUrl!==a.sourceUrl||r.capturedAt!==a.capturedAt)add('official_capture_receipt_mismatch');}catch{add('official_capture_receipt_required');}
 try{const r=await readJson(join(jobPath,'receipts','render.json')) as {sourceFingerprint:string;factsFingerprint:string;hashes:Record<string,string>};if(r.sourceFingerprint!==sourceFingerprint||r.factsFingerprint!==fingerprint(facts)||manifest.assets.filter(a=>a.role!=='overview_hero').some(a=>r.hashes[a.role]!==a.sha256))add('render_receipt_mismatch');}catch{add('render_receipt_required');}
 if(requireReview)try{const r=await readJson(join(jobPath,'receipts','images.json')) as Record<string,unknown>;if(r.basisFingerprint!==assetReviewBasis(facts,manifest,sourceFingerprint)||!r.reviewedBy||!r.reviewedAt)add('image_review_stale');}catch{add('image_review_required');}
 return {errors,warnings:[],fingerprint:fingerprint({facts,manifest,actualHashes,sourceFingerprint})};
}
