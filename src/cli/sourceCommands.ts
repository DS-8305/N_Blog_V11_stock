import {join} from 'node:path';
import {readFile} from 'node:fs/promises';
import {readRequest,assertJobMutable} from '../state/jobStore.js';
import {atomicWriteJson,readJson} from '../state/jsonStore.js';
import {inspectSource,loadReviewedProvider} from '../providers/reviewedFile.js';
import {sha256} from '../editorial/fingerprint.js';
import {jobFile} from '../state/paths.js';
import {acquireJobLock} from '../browser/runLock.js';
export async function initializeSourceHints(jobPath:string):Promise<void>{
 const r=await readRequest(jobPath);
 const value=(factId:string)=>({factId,value:null,sourceUrl:null,sourceName:null,retrievedAt:null,asOf:null,timezone:r.market.startsWith('KRX:')?'Asia/Seoul':'America/New_York',status:'unverified',method:null,evidenceIds:[]});
 await atomicWriteJson(join(jobPath,'provider-data.template.json'),{schemaVersion:1,jobId:r.jobId,asOfDate:r.asOfDate,identity:{assetType:'stock',ticker:r.ticker,market:r.market,issuerName:r.issuerName??null,mic:null,exchange:null,securityType:null,currency:null,status:null,verified:false,sourceUrl:null,evidenceIds:[]},overview:value('overview'),quote:value('quote'),marketCap:value('market_cap'),range52w:value('range_52w'),business:value('business'),outlook:value('outlook')});
 await atomicWriteJson(join(jobPath,'source-hints.json'),{schemaVersion:1,provider:{kind:'reviewed_file',relativePath:'provider-data.json',sha256:null,permission:{status:'pending',basis:null}},officialSite:{url:null,hostname:null,selector:null,requiredLabels:[],issuerName:r.issuerName??null,verificationUrl:null,licenseNote:null},evidence:[],review:{status:'pending',reviewedBy:'',reviewedAt:'',basisFingerprint:''}});
}
export async function sourceInspect(jobPath:string){
 const raw=await readJson(join(jobPath,'source-hints.json')) as {provider?:{relativePath?:string};evidence?:{relativePath?:string}[];concept?:{relativePath?:string}};
 const paths=[raw.provider?.relativePath,...(raw.evidence??[]).map(e=>e.relativePath),raw.concept?.relativePath].filter((p):p is string=>typeof p==='string');
 const files:Record<string,string>={};for(const path of paths)try{files[path]=sha256(await readFile(await jobFile(jobPath,path)));}catch(e){files[path]='unavailable: '+(e as Error).message;}
 try{const result=await inspectSource(jobPath);let code:string|undefined;try{await loadReviewedProvider(jobPath,false);}catch(e){code=(e as Error).message;}const report={status:!code&&result.approved?'verified':'needs_user',basisFingerprint:result.basisFingerprint,approved:result.approved,files,...(code?{code}:{}),next:'Review source values, permission, date and evidence, then use source:approve with this fingerprint.'};await atomicWriteJson(join(jobPath,'source-inspection.json'),report);return report;}
 catch(e){const report={status:'needs_user',code:(e as Error).message,files,next:'Complete source-hints.json and provider-data.json using docs/provider-contract.md. No prices have been collected.'};await atomicWriteJson(join(jobPath,'source-inspection.json'),report);return report;}
}
export async function sourceApprove(jobPath:string,expected:string,reviewedBy:string):Promise<void>{
 const release=await acquireJobLock(jobPath);try{
  await assertJobMutable(jobPath);if(!reviewedBy.trim())throw Error('reviewer_required');const loaded=await loadReviewedProvider(jobPath,false);
  if(expected!==loaded.basisFingerprint)throw Error('needs_user:source_review_stale');loaded.hints.review={status:'approved',basisFingerprint:expected,reviewedBy,reviewedAt:new Date().toISOString()};await atomicWriteJson(join(jobPath,'source-hints.json'),loaded.hints);
 }finally{await release();}
}
