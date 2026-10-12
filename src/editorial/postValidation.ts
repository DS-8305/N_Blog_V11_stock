import {supportedClaimTexts} from './factPresentation.js';
import {rolesFor} from '../domain/imageLayout.js';
import {articleText,sectionHeadings,type PostDocument} from '../domain/post.js';
import type {JobRequest} from '../domain/job.js';
import {requiredRoles,type AssetManifest} from '../domain/asset.js';
import {validateFacts,factValues,type FactDocument} from '../domain/stock.js';
import {issue,type ValidationReport} from '../domain/validation.js';
import {sourcesText} from './createPost.js';
import {fingerprint} from './fingerprint.js';
import {captionFor} from '../render/captions.js';
export function validatePost(request:JobRequest,facts:FactDocument,assets:AssetManifest,post:PostDocument):ValidationReport {
 const errors=validateFacts(request,facts),add=(code:string,path='')=>errors.push(issue(code,path)),validIds=new Set(factValues(facts).map(v=>v.factId)),supported=supportedClaimTexts(facts);
 if(post.jobId!==request.jobId||assets.jobId!==request.jobId)add('post_job_mismatch');
 if(post.titleCandidates.length!==7||new Set(post.titleCandidates).size!==7||!post.titleCandidates.includes(post.selectedTitle))add('seven_titles_required');
 if(post.tags.length!==5||new Set(post.tags).size!==5||post.tags.some(t=>!t||/[\s#]/.test(t)))add('five_tags_required');
 const headings=post.blocks.flatMap(b=>b.kind==='heading'?[b.text]:[]),images=post.blocks.filter(b=>b.kind==='image');
 if(fingerprint(headings)!==fingerprint(sectionHeadings)||images.length!==5||new Set(images.map(b=>b.assetId)).size!==5)add('five_section_layout_required');
 if(post.blocks.length!==22||post.blocks[0]?.kind!=='paragraph'||post.blocks.at(-1)?.kind!=='source')add('invalid_post_layout');
 for(const [i,role]of rolesFor(request).entries()){
  const offset=1+i*4,heading=post.blocks[offset],image=post.blocks[offset+1],caption=post.blocks[offset+2],paragraph=post.blocks[offset+3],asset=assets.assets.find(a=>a.role===role);
  if(heading?.kind!=='heading'||heading.text!==sectionHeadings[i]||image?.kind!=='image'||caption?.kind!=='caption'||paragraph?.kind!=='paragraph'||!asset||image.assetId!==asset.assetId||caption.assetId!==asset.assetId||caption.text!==asset.caption||fingerprint(caption.factIds)!==fingerprint(asset.factIds))add('section_asset_order_mismatch',role);
  if(asset&&caption?.kind==='caption'&&caption.text!==captionFor(role,facts,asset.capturedAt,asset.capture))add('unsupported_caption',role);
 }
 const length=articleText(post).length,{min,max}=request.conditions.articleLength;if(length<min||length>max)add('article_length_out_of_range',String(length));
 const risky=/목표가|원금\s*보장|수익\s*보장|매수\s*(?:추천|하세요)|매도\s*(?:추천|하세요)|무조건\s*(?:상승|수익)|확실한\s*수익|급등\s*확정|대박|(?:지금|반드시|꼭)\s*(?:반드시\s*)?(?:사야|매수해야|팔아야)|사야\s*하는\s*종목/;
 if(risky.test([post.selectedTitle,...post.titleCandidates,articleText(post)].join('\n')))add('investment_promotion_forbidden');
 for(const id of post.titleFactIds)if(!validIds.has(id))add('unknown_fact_id','title');
 for(const title of post.titleCandidates)if(/\d/.test(title.replaceAll(facts.identity.ticker,'').replaceAll(facts.identity.issuerName,'')))add('unsupported_title_number');
 const numeric=/\d[\d,.]*(?:%|위)?/g;
 for(const [i,b]of post.blocks.entries()){
  if('factIds'in b)for(const id of b.factIds)if(!validIds.has(id))add('unknown_fact_id',String(i));
  if(b.kind==='paragraph'||b.kind==='heading'){
   let uncovered=b.text.replace(new RegExp(`종목\\s*코드\\s+${facts.identity.ticker}(?![A-Za-z0-9])`,'g'),'');
   for(const c of b.claims){if(!b.factIds.includes(c.factId)||!supported[c.factId]?.includes(c.text)||!b.text.includes(c.text))add('unsupported_fact_claim',String(i));uncovered=uncovered.replaceAll(c.text,'');}
   if(b.kind==='paragraph'&&(numeric.test(uncovered)||/[영일이삼사오육칠팔구십백천만억조]+(?:\s*[십백천만억조])*\s*원/.test(uncovered)))add('unmapped_numeric_claim',String(i));numeric.lastIndex=0;
  }
 }
 const claimed=new Set(post.blocks.flatMap(b=>'claims'in b?b.claims.map(c=>c.factId):[]));for(const id of validIds)if(!claimed.has(id))add('required_fact_claim_missing',id);
 if(post.blocks.at(-1)?.kind!=='source'||(post.blocks.at(-1) as {text?:string})?.text!==sourcesText(facts))add('public_source_label_required');
 return {errors,warnings:[],fingerprint:fingerprint({request,facts,assets,post})};
}
