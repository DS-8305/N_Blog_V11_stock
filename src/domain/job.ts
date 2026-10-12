import {enumeration,integer,isoDate,record,safeId,string,version,localDate} from './validation.js';
import type {ImageLayout} from './imageLayout.js';
import {markets,parseTicker,type Market} from './stock.js';
import {parseDraftReceipt} from './receipt.js';
export interface JobRequest {schemaVersion:1;jobId:string;ticker:string;market:Market;issuerName?:string;asOfDate:string;allowHistorical:boolean;conditions:{imageLayout?:ImageLayout;editorialStyle?:'reader_focused_v2';articleLength:{min:number;max:number};imageCaptionPlacement:'native'|'body'}}
export const phases=['selected','collecting','collected','rendered','validated','inserting','draft_saved','needs_user','failed','draft_unconfirmed'] as const;
export type JobPhase=typeof phases[number];
export interface JobState {schemaVersion:1;jobId:string;phase:JobPhase;lastAcknowledgedEvent:number;saveAttempt:{status:'not_attempted'|'attempted_unconfirmed'|'confirmed';startedAt?:string;receipt?:unknown;fingerprint?:string};error:{code:string;message:string;resumePhase:JobPhase}|null}
export function parseJobRequest(v:unknown):JobRequest {const d=record(v);version(d);const market=enumeration(d.market,markets,'market'),c=record(d.conditions),r=record(c.articleLength);if(typeof d.allowHistorical!=='boolean')throw Error('invalid_historical_preference');const min=integer(r.min,'length_min',1),max=integer(r.max,'length_max',min);if(max>10000)throw Error('article_too_long');return {schemaVersion:1,jobId:safeId(d.jobId),ticker:parseTicker(d.ticker,market),market,...(d.issuerName!==undefined?{issuerName:string(d.issuerName,'issuer_name')}:{}),asOfDate:isoDate(d.asOfDate),allowHistorical:d.allowHistorical,conditions:{...(c.imageLayout!==undefined?{imageLayout:enumeration<ImageLayout>(c.imageLayout,['legacy_cards','stock_sources_five_v1'],'image_layout')}:{}),...(c.editorialStyle!==undefined?{editorialStyle:enumeration<'reader_focused_v2'>(c.editorialStyle,['reader_focused_v2'],'editorial_style')}:{}),articleLength:{min,max},imageCaptionPlacement:enumeration(c.imageCaptionPlacement,['native','body'],'caption_placement')}};}
export function parseJobState(v:unknown):JobState {
 const d=record(v);version(d);const s=record(d.saveAttempt),jobId=safeId(d.jobId),phase=enumeration(d.phase,phases,'phase');
 const status=enumeration(s.status,['not_attempted','attempted_unconfirmed','confirmed'],'save_status');
 if(status!=='not_attempted'&&(!/^[a-f0-9]{64}$/.test(String(s.fingerprint))||typeof s.startedAt!=='string'))throw Error('save_binding_required');
 if(status==='confirmed'){const receipt=parseDraftReceipt(s.receipt);if(receipt.jobId!==jobId||receipt.fingerprint!==s.fingerprint)throw Error('receipt_binding_mismatch');}
 if(phase==='draft_saved'&&status!=='confirmed')throw Error('confirmed_receipt_required');
 let error:JobState['error']=null;if(d.error!==null){const e=record(d.error);error={code:string(e.code,'error_code'),message:string(e.message,'error_message'),resumePhase:enumeration(e.resumePhase,phases,'resume_phase')};}
 return {schemaVersion:1,jobId,phase,lastAcknowledgedEvent:integer(d.lastAcknowledgedEvent,'event_index',-1),saveAttempt:s as unknown as JobState['saveAttempt'],error};
}
export const today=()=>localDate(new Date(),'Asia/Seoul');
