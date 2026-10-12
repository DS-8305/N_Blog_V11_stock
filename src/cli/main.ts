import {readRequest} from '../state/jobStore.js';
import {imageLayoutFor} from '../domain/imageLayout.js';
import {initializeCaptureHints,captureInspect} from './captureCommands.js';
import {approveCaptureConfig} from '../capture/sourceConfig.js';
import {captureSources,checkCapturedSources} from '../capture/sourceCapture.js';
import {preparePost} from '../editorial/preparePost.js';
import {inspectPost} from './postCommands.js';
import {approvePost} from '../editorial/postReview.js';
import {resolve,join,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';
import {randomUUID} from 'node:crypto';
import {argumentsFor,required,rejectUnknown} from './arguments.js';
import {parseJobRequest,today} from '../domain/job.js';
import {createJob,readJobState,writeJobState} from '../state/jobStore.js';
import {initializeSourceHints,sourceInspect,sourceApprove} from './sourceCommands.js';
import {collectJob,collectionCheck} from '../collectors/collectJob.js';
import {renderJob,approveImages} from '../render/renderJob.js';
import {loadBundle} from '../editorial/loadBundle.js';
import {compileDraft,validateBundle} from '../editorial/compileDraft.js';
import {atomicWriteJson} from '../state/jsonStore.js';
import {runDraft} from '../automation/draftRunner.js';
import {normalizeEndpoint} from '../browser/runLock.js';
const DEFAULT_CDP_ENDPOINT='http://127.0.0.1:9223';
export const HELP=`V11 stock blog workflow — temporary drafts only
job:init --ticker <symbol> --market <KRX:KOSPI|KRX:KOSDAQ|NASDAQ|NYSE> [--issuer-name <name>] [--as-of-date YYYY-MM-DD --allow-historical] [--workspace-root <path>] [--image-layout stock_sources_five_v1|legacy_cards]
capture:inspect --job <path>
capture:approve --job <path> --fingerprint <capture fingerprint> --reviewer <name>
capture:run --job <path> [--cdp <loopback endpoint>] --profile <dedicated Chrome profile path>
capture:check --job <path>
post:prepare --job <path>
post:review-basis --job <path>
post:approve --job <path> --fingerprint <post fingerprint> --reviewer <name>
source:inspect --job <absolute path>
source:approve --job <path> --fingerprint <source fingerprint> --reviewer <name>
collect:run --job <path> [--cdp <loopback endpoint>] --profile <dedicated Chrome profile path>
collect:check --job <path>
render:run --job <path>
assets:approve --job <path> --fingerprint <image review fingerprint> --reviewer <name>
draft:check --job <path>
draft:run --job <path> [--cdp <loopback endpoint>] --profile <path>
draft:resume --job <path> [--cdp <loopback endpoint>] --profile <path>
job:status --job <path>
Default CDP endpoint: ${DEFAULT_CDP_ENDPOINT}; override it with --cdp.
Exit codes: 0 success; 2 validation/failure; 3 needs_user; 4 save unconfirmed.
Default: five source screenshots. Review capture settings, collect financial evidence, prepare post, approve images and manuscript before draft input. Legacy mode also needs a concept PNG. See README.md.`;
const knownOptions:Record<string,string[]>={help:[],'capture:inspect':['job'],'capture:approve':['job','fingerprint','reviewer'],'capture:run':['job','cdp','profile'],'capture:check':['job'],'post:prepare':['job'],'post:review-basis':['job'],'post:approve':['job','fingerprint','reviewer'], 'job:init':['ticker','market','issuer-name','as-of-date','allow-historical','workspace-root','length-min','length-max','caption-placement','image-layout'],'source:inspect':['job'],'source:approve':['job','fingerprint','reviewer'],'collect:run':['job','cdp','profile'],'collect:check':['job'],'render:run':['job'],'assets:approve':['job','fingerprint','reviewer'],'draft:check':['job'],'draft:run':['job','cdp','profile'],'draft:resume':['job','cdp','profile'],'job:status':['job']};
export async function runCli(argv:string[]):Promise<{exitCode:number;output:unknown}>{
 try{
  const {command,options}=argumentsFor(argv),allowed=knownOptions[command];if(!allowed)throw Error('unknown_command:'+command);rejectUnknown(options,allowed);
  if(command==='help')return {exitCode:0,output:HELP};
  if(command==='job:init'){
   const ticker=required(options,'ticker'),asOfDate=typeof options['as-of-date']==='string'?options['as-of-date']:today(),jobId=`stock-${asOfDate.replaceAll('-','')}-${ticker.replace(/[^a-zA-Z0-9_-]/g,'_')}-${randomUUID().slice(0,8)}`;
   const request=parseJobRequest({schemaVersion:1,jobId,ticker,market:required(options,'market'),...(options['issuer-name']?{issuerName:options['issuer-name']}:{}),asOfDate,allowHistorical:options['allow-historical']===true,conditions:{imageLayout:options['image-layout']??'stock_sources_five_v1',...(options['image-layout']==='legacy_cards'?{}:{editorialStyle:'reader_focused_v2'}),articleLength:{min:Number(options['length-min']??800),max:Number(options['length-max']??1000)},imageCaptionPlacement:options['caption-placement']??'native'}});
   const jobPath=await createJob(typeof options['workspace-root']==='string'?options['workspace-root']:resolve('workspaces'),request);await initializeSourceHints(jobPath);if(imageLayoutFor(request)==='stock_sources_five_v1')await initializeCaptureHints(jobPath);return {exitCode:0,output:{status:'selected',jobId,jobPath,next:imageLayoutFor(request)==='stock_sources_five_v1'?'capture:inspect; configure five reviewed screenshot sources and independent financial evidence':'source:inspect; configure financial evidence and legacy concept PNG'}};
  }
  const job=required(options,'job');if(!isAbsolute(job))throw Error('absolute_job_path_required');const jobPath=resolve(job);
  if(command==='capture:inspect'){const output=await captureInspect(jobPath);return {exitCode:output.status==='ready'?0:3,output};}
  if(command==='capture:approve'){await approveCaptureConfig(jobPath,required(options,'fingerprint'),required(options,'reviewer'));return {exitCode:0,output:{status:'capture_config_reviewed'}};}
  if(command==='capture:run'){const output=await captureSources(jobPath,sessionOptions(options));return {exitCode:output.status==='captured'?0:output.status==='needs_user'?3:2,output};}
  if(command==='capture:check'){const manifest=await checkCapturedSources(jobPath);return {exitCode:0,output:{status:'captured',manifest}};}
  if(command==='post:prepare'){const output=await preparePost(jobPath);return {exitCode:3,output:{...output,status:'needs_user',code:'image_review_required',next:'Review five PNGs, assets:approve, post:review-basis and post:approve'}};}
  if(command==='post:review-basis'){const output=await inspectPost(jobPath);return {exitCode:output.errors.length?3:0,output};}
  if(command==='post:approve'){await approvePost(jobPath,required(options,'fingerprint'),required(options,'reviewer'));return {exitCode:0,output:{status:'post_reviewed',next:'post:review-basis for source mode; draft:check for legacy'}};}
  if(command==='job:status')return {exitCode:0,output:await readJobState(jobPath)};
  if(command==='source:inspect'){const result=await sourceInspect(jobPath);return {exitCode:result.status==='verified'?0:3,output:result};}
  if(command==='source:approve'){await sourceApprove(jobPath,required(options,'fingerprint'),required(options,'reviewer'));return {exitCode:0,output:{status:'source_reviewed'}};}
  if(command==='collect:check'){const {facts}=await collectionCheck(jobPath);return {exitCode:0,output:{status:'verified',jobId:facts.jobId,ticker:facts.identity.ticker,market:facts.identity.market}};}
  if(command==='collect:run'){
   const result=await collectJob(jobPath,imageLayoutFor(await readRequest(jobPath))==='stock_sources_five_v1'?undefined:sessionOptions(options));return {exitCode:result.status==='collected'?0:result.status==='needs_user'?3:2,output:result};
  }
  if(command==='render:run'){const result=await renderJob(jobPath);return {exitCode:3,output:{status:'needs_user',code:'image_review_required',reviewFingerprint:result.reviewFingerprint,assets:result.manifest.assets.map(a=>({role:a.role,path:join(jobPath,a.relativePath)}))}};}
  if(command==='assets:approve'){await approveImages(jobPath,required(options,'fingerprint'),required(options,'reviewer'));return {exitCode:0,output:{status:'images_reviewed',next:'draft:check'}};}
  if(command==='draft:check'){
   const bundle=await loadBundle(jobPath),report=await validateBundle(jobPath,bundle);await atomicWriteJson(join(jobPath,'validation-report.json'),report);
   if(report.errors.length)return {exitCode:report.errors.some(e=>/review/.test(e.code))?3:2,output:{status:'needs_user',report}};
   const draft=compileDraft(jobPath,bundle,report);await atomicWriteJson(join(jobPath,'prepared-draft.json'),draft);
   const state=await readJobState(jobPath);if(state.saveAttempt.status==='not_attempted'&&state.lastAcknowledgedEvent<0)await writeJobState(jobPath,{...state,phase:'validated',error:null});return {exitCode:0,output:{status:'validated',jobId:bundle.request.jobId,fingerprint:report.fingerprint,events:draft.events.length}};
  }
  if(command==='draft:resume'){const state=await readJobState(jobPath);if(state.saveAttempt.status==='not_attempted'&&state.lastAcknowledgedEvent<0)throw Error('needs_user:no_resume_checkpoint');}
  const result=await runDraft(jobPath,sessionOptions(options));if(result.status==='draft_saved')await atomicWriteJson(join(jobPath,'receipts','draft-save.json'),result.receipt);
  return {exitCode:result.status==='draft_saved'?0:result.status==='draft_unconfirmed'?4:result.status==='needs_user'?3:2,output:result};
 }catch(error){const code=error instanceof Error?error.message:String(error);return {exitCode:/needs_user|ENOENT|source|evidence|identity|font|provider/.test(code)?3:2,output:{status:'needs_user',code,message:code}};}
}
function sessionOptions(options:Record<string,string|boolean>){const profilePath=required(options,'profile');if(!isAbsolute(profilePath))throw Error('absolute_profile_path_required');return {cdpEndpoint:normalizeEndpoint(options.cdp===undefined?DEFAULT_CDP_ENDPOINT:required(options,'cdp')),profilePath:resolve(profilePath)};}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const result=await runCli(process.argv.slice(2));process.stdout.write((typeof result.output==='string'?result.output:JSON.stringify(result.output,null,2))+'\n');process.exitCode=result.exitCode;}
