import {join} from 'node:path';
import {loadProvider} from '../providers/registry.js';
import {fingerprint} from '../editorial/fingerprint.js';
import {parseFacts,type FactDocument} from '../domain/stock.js';
import {parseAssetManifest} from '../domain/asset.js';
import {atomicWriteJson,readJson} from '../state/jsonStore.js';
import {readRequest,readJobState,writeJobState,assertJobMutable} from '../state/jobStore.js';
import {acquireJobLock} from '../browser/runLock.js';
import {openCollectionSession,type SessionOptions} from '../browser/session.js';
import {captureOfficialSite} from '../capture/officialSite.js';
export type WorkflowResult={status:'collected'|'rendered'|'validated';jobId:string}|{status:'needs_user'|'failed';code:string;message:string};
export async function collectionCheck(jobPath:string):Promise<{facts:FactDocument;sourceFingerprint:string}> {
 const request=await readRequest(jobPath),loaded=await loadProvider(jobPath),facts=parseFacts(await readJson(join(jobPath,'facts.json'))),receipt=await readJson(join(jobPath,'receipts','source-review.json')) as Record<string,unknown>;
 if(receipt.jobId!==request.jobId||receipt.requestFingerprint!==fingerprint(request)||receipt.sourceFingerprint!==loaded.basisFingerprint||receipt.providerHash!==loaded.providerHash||receipt.factsFingerprint!==fingerprint(facts)||fingerprint(await loaded.provider.getDocument())!==fingerprint(facts))throw Error('needs_user:collection_checkpoint_changed');
 return {facts,sourceFingerprint:loaded.basisFingerprint};
}
export async function collectJob(jobPath:string,options?:Omit<SessionOptions,'jobId'>,dependencies:{open?:typeof openCollectionSession;capture?:typeof captureOfficialSite}={}):Promise<WorkflowResult>{
 let release:undefined|(()=>Promise<void>),mutable=false;try{
  release=await acquireJobLock(jobPath);await assertJobMutable(jobPath);mutable=true;
  const request=await readRequest(jobPath),loaded=await loadProvider(jobPath),identity=await loaded.provider.resolve(request.ticker,request.market),facts=await loaded.provider.getDocument();
  await loaded.provider.getQuote(identity);await loaded.provider.getMarketCap(identity);await loaded.provider.get52WeekRange(identity);await loaded.provider.getBusinessSegments(identity);
  await atomicWriteJson(join(jobPath,'facts.json'),facts);
  const receipt={schemaVersion:1,jobId:request.jobId,requestFingerprint:fingerprint(request),sourceFingerprint:loaded.basisFingerprint,providerHash:loaded.providerHash,factsFingerprint:fingerprint(facts),checkedAt:new Date().toISOString(),review:loaded.hints.review};
  await atomicWriteJson(join(jobPath,'receipts','source-review.json'),receipt);
  await atomicWriteJson(join(jobPath,'collection-checkpoint-facts.json'),receipt);
  if(!options)throw Error('needs_user:official_capture_requires_cdp');
  const session=await (dependencies.open??openCollectionSession)({...options,jobId:request.jobId});
  try{
   const asset=await(dependencies.capture??captureOfficialSite)(jobPath,facts,loaded.hints,loaded.basisFingerprint,session);
   await collectionCheck(jobPath);
   await atomicWriteJson(join(jobPath,'assets.partial.json'),parseAssetManifest({schemaVersion:1,jobId:request.jobId,asOfDate:request.asOfDate,identity,assets:[asset]}));
  }finally{await session.release();}
  const state=await readJobState(jobPath);await writeJobState(jobPath,{...state,phase:'collected',error:null});return {status:'collected',jobId:request.jobId};
 }catch(e){const code=(e as Error).message,status=/needs_user|ENOENT|session_locked|cdp|connectOverCDP|ECONNREFUSED/.test(code)?'needs_user':'failed';if(release&&mutable){const state=await readJobState(jobPath);await writeJobState(jobPath,{...state,phase:status,error:{code,message:code,resumePhase:state.phase}});}return {status,code,message:code};}
 finally{await release?.();}
}
