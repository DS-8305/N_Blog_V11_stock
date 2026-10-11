import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {array,record,string,strings,enumeration,version,sourceUrl,timestamp,hash,safeId} from '../domain/validation.js';
import {factValues,parseFacts,validateFacts,type FactDocument,type SecurityIdentity} from '../domain/stock.js';
import {readRequest} from '../state/jobStore.js';
import {readJson} from '../state/jsonStore.js';
import {jobFile} from '../state/paths.js';
import {fingerprint,sha256} from '../editorial/fingerprint.js';
import type {SourceHints,StockProvider} from './types.js';
export function parseHints(v:unknown):SourceHints {
 const d=record(v);version(d);const p=record(d.provider),permission=record(p.permission),o=record(d.officialSite),r=record(d.review);
 if(p.kind!=='reviewed_file'||permission.status!=='approved')throw Error('needs_user:data_provider_required');
 const url=sourceUrl(o.url),hostname=string(o.hostname,'official_hostname');if(new URL(url).hostname!==hostname||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(hostname))throw Error('official_domain_mismatch');
 const requiredLabels=strings(o.requiredLabels,'required_labels');if(!requiredLabels.length)throw Error('official_identity_labels_required');
 const evidence=array(d.evidence,'evidence').map(v=>{const e=record(v);return {evidenceId:safeId(e.evidenceId),relativePath:string(e.relativePath,'evidence_path'),sourceUrl:sourceUrl(e.sourceUrl),sha256:hash(e.sha256),retrievedAt:timestamp(e.retrievedAt),licenseNote:string(e.licenseNote,'evidence_permission'),factIds:strings(e.factIds,'evidence_fact_ids')};});
 if(!evidence.length||new Set(evidence.map(e=>e.evidenceId)).size!==evidence.length)throw Error('invalid_evidence_set');
 let concept:SourceHints['concept'];if(d.concept!==undefined){const c=record(d.concept);if(c.kind!=='reviewed_import'||c.reviewStatus!=='approved')throw Error('needs_user:concept_image_required');concept={kind:'reviewed_import',relativePath:string(c.relativePath,'concept_path'),sha256:hash(c.sha256),model:string(c.model,'concept_model'),prompt:string(c.prompt,'concept_prompt'),generatedAt:timestamp(c.generatedAt),licenseNote:string(c.licenseNote,'concept_license'),reviewStatus:'approved'};}
 return {schemaVersion:1,provider:{kind:'reviewed_file',relativePath:string(p.relativePath,'provider_path'),sha256:hash(p.sha256),permission:{status:'approved',basis:string(permission.basis,'permission_basis')}},officialSite:{url,hostname,selector:string(o.selector,'official_selector'),requiredLabels,issuerName:string(o.issuerName,'official_issuer'),verificationUrl:sourceUrl(o.verificationUrl),licenseNote:string(o.licenseNote,'official_capture_license')},evidence,review:{status:enumeration(r.status,['pending','approved'],'review_status'),reviewedBy:string(r.reviewedBy,'reviewer',true),reviewedAt:string(r.reviewedAt,'review_date',true),basisFingerprint:string(r.basisFingerprint,'review_fingerprint',true)},...(concept?{concept}:{})};
}
export function sourceBasis(h:SourceHints):string {const {review:_,...basis}=h;return fingerprint(basis);}
export async function inspectSource(jobPath:string):Promise<{hints:SourceHints;basisFingerprint:string;approved:boolean}> {
 const hints=parseHints(await readJson(join(jobPath,'source-hints.json'))),basisFingerprint=sourceBasis(hints);
 return {hints,basisFingerprint,approved:hints.review.status==='approved'&&hints.review.basisFingerprint===basisFingerprint&&!!hints.review.reviewedBy&&!!hints.review.reviewedAt};
}
export class ReviewedFileProvider implements StockProvider {
 constructor(private facts:FactDocument){}
 async resolve(symbol:string,market:string){if(symbol!==this.facts.identity.ticker||market!==this.facts.identity.market)throw Error('needs_user:security_identity_mismatch');return this.facts.identity;}
 private assertIdentity(i:SecurityIdentity){if(fingerprint(i)!==fingerprint(this.facts.identity))throw Error('needs_user:security_identity_mismatch');}
 async getQuote(i:SecurityIdentity){this.assertIdentity(i);return this.facts.quote;}
 async getMarketCap(i:SecurityIdentity){this.assertIdentity(i);return this.facts.marketCap;}
 async get52WeekRange(i:SecurityIdentity){this.assertIdentity(i);return this.facts.range52w;}
 async getBusinessSegments(i:SecurityIdentity){this.assertIdentity(i);return this.facts.business;}
 async getDocument(){return this.facts;}
}
export async function loadReviewedProvider(jobPath:string,requireReview=true):Promise<{provider:StockProvider;hints:SourceHints;basisFingerprint:string;providerHash:string}> {
 const request=await readRequest(jobPath),inspection=await inspectSource(jobPath),{hints,basisFingerprint}=inspection;
 if(requireReview&&!inspection.approved)throw Error('needs_user:source_review_required');
 if(requireReview){timestamp(hints.review.reviewedAt);if(Date.parse(hints.review.reviewedAt)>Date.now())throw Error('needs_user:future_source_review');}
 const bytes=await readFile(await jobFile(jobPath,hints.provider.relativePath)),providerHash=sha256(bytes);if(providerHash!==hints.provider.sha256)throw Error('needs_user:provider_hash_changed');
 const facts=parseFacts(JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''))),errors=validateFacts(request,facts);
 if(errors.length)throw Error('needs_user:'+errors.map(e=>e.code).join(','));
 if(hints.officialSite.issuerName!==facts.identity.issuerName||!hints.officialSite.requiredLabels.some(x=>x.includes(facts.identity.issuerName)))throw Error('needs_user:official_identity_mismatch');
 for(const e of hints.evidence){if(sha256(await readFile(await jobFile(jobPath,e.relativePath)))!==e.sha256)throw Error('needs_user:evidence_hash_changed');}
 const bindings=[{factId:'identity',evidenceIds:facts.identity.evidenceIds,sourceUrl:facts.identity.sourceUrl},...factValues(facts),...(facts.marketCap.value.rank?[{factId:facts.marketCap.factId,...facts.marketCap.value.rank}]:[]),...(facts.marketCap.value.derivation?[{factId:facts.marketCap.factId,...facts.marketCap.value.derivation}]:[]),...(facts.business.value.revenueBasis?[{factId:facts.business.factId,...facts.business.value.revenueBasis}]:[])];
 for(const v of bindings)for(const id of v.evidenceIds){const evidence=hints.evidence.find(e=>e.evidenceId===id);if(!evidence||evidence.sourceUrl!==v.sourceUrl||!evidence.factIds.includes(v.factId))throw Error('needs_user:fact_evidence_mismatch');if('retrievedAt'in v&&evidence.retrievedAt!==v.retrievedAt)throw Error('needs_user:evidence_date_mismatch');}
 if(hints.concept&&sha256(await readFile(await jobFile(jobPath,hints.concept.relativePath)))!==hints.concept.sha256)throw Error('needs_user:concept_hash_changed');
 return {provider:new ReviewedFileProvider(facts),hints,basisFingerprint,providerHash};
}
