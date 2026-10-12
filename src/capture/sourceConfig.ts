import {join} from 'node:path';
import {parseCaptureHints,type CaptureHints} from '../domain/capture.js';
import {imageLayoutFor} from '../domain/imageLayout.js';
import {fingerprint} from '../editorial/fingerprint.js';
import {readRequest,assertJobMutable} from '../state/jobStore.js';
import {readJson,atomicWriteJson} from '../state/jsonStore.js';
import {acquireJobLock} from '../browser/runLock.js';
export const captureHintsBasis=(hints:CaptureHints):string=>{const {review:_,...basis}=hints;return fingerprint(basis);};
export async function inspectCaptureConfig(jobPath:string):Promise<{status:'ready'|'needs_user';basisFingerprint?:string;issues:string[]}>{
 try{const request=await readRequest(jobPath),h=parseCaptureHints(await readJson(join(jobPath,'capture-hints.json'))),basisFingerprint=captureHintsBasis(h),issues:string[]=[];
  if(imageLayoutFor(request)!=='stock_sources_five_v1')issues.push('source_capture_layout_required');
  if(h.jobId!==request.jobId||h.identity.ticker!==request.ticker||h.identity.market!==request.market||(request.issuerName&&h.identity.issuerName!==request.issuerName))issues.push('capture_identity_mismatch');
  const regions=h.sources.map(s=>fingerprint({url:s.url,frame:s.frame??null,selector:s.selector,selection:s.selection??null}));if(new Set(regions).size!==5)issues.push('duplicate_capture_region');
  if(h.review.status!=='approved'||!h.review.reviewedBy||!h.review.reviewedAt)issues.push('capture_review_required');else if(h.review.basisFingerprint!==basisFingerprint||Date.parse(h.review.reviewedAt)>Date.now())issues.push('capture_review_stale');
  return {status:issues.length?'needs_user':'ready',basisFingerprint,issues};
 }catch(e){return {status:'needs_user',issues:[(e as Error).message]};}
}
export async function approveCaptureConfig(jobPath:string,expectedFingerprint:string,reviewedBy:string):Promise<void>{const release=await acquireJobLock(jobPath);try{await assertJobMutable(jobPath);if(!reviewedBy.trim())throw Error('reviewer_required');const report=await inspectCaptureConfig(jobPath),blocking=report.issues.filter(i=>!['capture_review_required','capture_review_stale'].includes(i));if(blocking.length||report.basisFingerprint!==expectedFingerprint)throw Error('needs_user:capture_config_invalid:'+blocking.join(','));const h=parseCaptureHints(await readJson(join(jobPath,'capture-hints.json')));h.review={status:'approved',reviewedBy,reviewedAt:new Date().toISOString(),basisFingerprint:expectedFingerprint};await atomicWriteJson(join(jobPath,'capture-hints.json'),h);}finally{await release();}}
