import {mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import sharp from 'sharp';
import {sourceFixture} from '../fixtures/provider.js';
import {collectJob} from '../../src/collectors/collectJob.js';
import {sourceBasis} from '../../src/providers/reviewedFile.js';
import {atomicWriteJson} from '../../src/state/jsonStore.js';
import {sha256} from '../../src/editorial/fingerprint.js';
import {renderJob,approveImages} from '../../src/render/renderJob.js';
import {loadBundle} from '../../src/editorial/loadBundle.js';
import type {StockAsset} from '../../src/domain/asset.js';
export async function fixtureBundle(){
 const {root,job:jobPath,hints}=await sourceFixture(),bytes=await sharp({create:{width:1200,height:1200,channels:3,background:'#345678'}}).png().toBuffer();
 await mkdir(join(jobPath,'inputs'));await writeFile(join(jobPath,'inputs','concept.png'),bytes);
 hints.concept={kind:'reviewed_import',relativePath:'inputs/concept.png',sha256:sha256(bytes),model:'synthetic-fixture',prompt:'Synthetic industrial concept without real logos or charts',generatedAt:'2026-10-10T02:00:00Z',licenseNote:'Synthetic fixture only',reviewStatus:'approved'};
 hints.review.basisFingerprint=sourceBasis(hints);await atomicWriteJson(join(jobPath,'source-hints.json'),hints);
 const collected=await collectJob(jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:join(root,'profile')},{open:async()=>({release:async()=>{}}) as any,capture:async(path,facts,_hints,sourceFingerprint)=>{
  const png=await sharp({create:{width:800,height:500,channels:3,background:'#abcdef'}}).png().toBuffer(),capturedAt='2026-10-10T03:00:00Z';await writeFile(join(path,'assets','overview_hero.png'),png);
  const asset:StockAsset={assetId:'overview_hero',role:'overview_hero',assetKind:'official_screenshot',relativePath:'assets/overview_hero.png',sourceUrl:hints.officialSite.url,capturedAt,asOf:facts.overview.asOf,factIds:[facts.overview.factId],caption:'가상전자 공식 회사 소개 화면 · 촬영 2026-10-10',sha256:sha256(png),width:800,height:500,reviewStatus:'pending',licenseNote:'Synthetic screenshot fixture only',displayContext:{ticker:facts.identity.ticker,market:facts.identity.market,currency:facts.identity.currency,asOfDate:facts.asOfDate}};
  await atomicWriteJson(join(path,'receipts','official-capture.json'),{schemaVersion:1,jobId:facts.jobId,sourceFingerprint,sourceUrl:asset.sourceUrl,capturedAt,sha256:asset.sha256,width:800,height:500});return asset;
 }});
 if(collected.status!=='collected')throw Error(JSON.stringify(collected));
 const rendered=await renderJob(jobPath);await approveImages(jobPath,rendered.reviewFingerprint,'synthetic fixture reviewer');
 return {root,jobPath,...await loadBundle(jobPath)};
}
