import {validatePostReview} from './postReview.js';
import {join} from 'node:path';
import type {ValidationReport,PreparedDraft,EditorEvent} from '../domain/bundle.js';
import type {loadBundle} from './loadBundle.js';
import {validateAssets} from './assetValidation.js';
import {validatePost} from './postValidation.js';
import {fingerprint} from './fingerprint.js';
type Bundle=Awaited<ReturnType<typeof loadBundle>>;
function bundleFingerprint(bundle:Bundle,assetFingerprint?:string):string {const assetsReport=assetFingerprint??fingerprint({facts:bundle.facts,manifest:bundle.assets,actualHashes:Object.fromEntries(bundle.assets.assets.map(a=>[a.assetId,a.sha256])),sourceFingerprint:bundle.sourceFingerprint});return fingerprint({rendererVersion:1,bundle,assetsReport});}
export async function validateBundle(jobPath:string,bundle:Bundle):Promise<ValidationReport>{const assets=await validateAssets(jobPath,bundle.facts,bundle.assets),post=validatePost(bundle.request,bundle.facts,bundle.assets,bundle.post);return {errors:[...assets.errors,...post.errors,...await validatePostReview(jobPath,bundle)],warnings:[...assets.warnings,...post.warnings],fingerprint:bundleFingerprint(bundle,assets.fingerprint)};}
export function compileDraft(jobPath:string,bundle:Bundle,report:ValidationReport):PreparedDraft {
 if(report.errors.length)throw Error('validation_failed');if(report.fingerprint!==bundleFingerprint(bundle))throw Error('stale_validation');
 const events:EditorEvent[]=[{type:'setTitle',text:bundle.post.selectedTitle}],body:string[]=[],captions:string[]=[],sources:string[]=[],imageAssetIds:string[]=[];
 for(const b of bundle.post.blocks){if(b.kind==='image'){const a=bundle.assets.assets.find(a=>a.assetId===b.assetId)!;events.push({type:'insertImage',assetId:a.assetId,relativePath:a.relativePath,absolutePath:join(jobPath,a.relativePath)});imageAssetIds.push(a.assetId);continue;}body.push(b.text);if(b.kind==='caption'&&bundle.request.conditions.imageCaptionPlacement==='native')events.push({type:'setImageCaption',text:b.text,assetId:b.assetId});else events.push({type:b.kind==='heading'?'insertQuote':'typeText',text:b.text,...(b.kind==='heading'?{bold:true}:{})});if(b.kind==='caption')captions.push(b.text);if(b.kind==='source')sources.push(b.text);}
 const tags=bundle.post.tags.map(t=>'#'+t).join(' ');events.push({type:'typeText',text:tags});body.push(tags);
 return {jobId:bundle.request.jobId,jobPath,title:bundle.post.selectedTitle,fingerprint:report.fingerprint,events,assets:bundle.assets.assets,expected:{bodyText:body.join('\n'),imageAssetIds,captions,sources}};
}
