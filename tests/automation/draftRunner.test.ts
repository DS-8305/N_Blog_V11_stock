import { expect,it } from 'vitest';import { rm,writeFile } from 'node:fs/promises';import { join } from 'node:path';import { fixtureBundle } from '../helpers/bundle.js';import { runDraft } from '../../src/automation/draftRunner.js';import { readJobState,writeJobState } from '../../src/state/jobStore.js';
import { compileDraft,validateBundle } from '../../src/editorial/compileDraft.js';
import type { DraftReceipt } from '../../src/domain/receipt.js';
import { loadBundle } from '../../src/editorial/loadBundle.js';
import { readJson } from '../../src/state/jsonStore.js';
it('persists a saved draft with five captions and does not save it again',async()=>{
 const b=await fixtureBundle();try{


  for(const [name,value]of Object.entries({request:b.request,facts:b.facts,assets:b.assets,post:b.post}))await writeFile(join(b.jobPath,name+'.json'),JSON.stringify(value));
  let saves=0,opens=0;
  const deps={open:async()=>{opens++;return {editorPage:{},release:async()=>{}} as any;},verify:async()=> 'authenticated' as const,targetId:async()=> 'owned-test',prepare:async()=>{},count:async()=>0,
   write:async(_s:any,d:any)=>d.assets.map((a:any,index:number)=>({assetId:a.assetId,blockKey:'block'+index,index,confirmedAt:'2026-10-03T02:00:00Z'})),
   snapshot:async(_p:any,d:any)=>({title:d.title,bodyText:d.expected.bodyText,images:d.assets.map((a:any,i:number)=>({key:'block'+i,src:'https://example.com/image'+i+'.png',loaded:true,width:a.width,height:a.height}))}),
   save:async()=>{saves++;},confirm:async(_s:any,d:any)=>({jobId:d.jobId,fingerprint:d.fingerprint,title:d.title,bodyText:d.expected.bodyText,confirmedAt:'2026-10-03T02:00:00Z',imageAssetIds:d.expected.imageAssetIds,captions:d.expected.captions,sources:d.expected.sources,identity:{listText:d.title,reopenedUrl:'https://blog.naver.com/write'}})};
  expect((await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},deps)).status).toBe('draft_saved');
  expect((await readJobState(b.jobPath)).saveAttempt.status).toBe('confirmed');
  expect(await readJson(join(b.jobPath,'receipts','draft-save.json'))).toMatchObject({jobId:b.request.jobId,imageAssetIds:['overview_hero','market_cap_card','price_52w_card','core_business_card','outlook_visual']});
  expect((await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},deps)).status).toBe('draft_saved');
  expect([saves,opens]).toEqual([1,1]);
 }finally{await rm(b.root,{recursive:true,force:true});}
});
async function setup(){const b=await fixtureBundle();for(const [name,value]of Object.entries({facts:b.facts,assets:b.assets,post:b.post}))await writeFile(join(b.jobPath,name+'.json'),JSON.stringify(value));return b;}
it.each(['body','images','captions','sources'] as const)('rejects a corrupted confirmed %s receipt without reopening or saving',async field=>{
 const b=await setup();try{
  const bundle=await loadBundle(b.jobPath),draft=compileDraft(b.jobPath,bundle,await validateBundle(b.jobPath,bundle));
  const receipt:DraftReceipt={jobId:draft.jobId,fingerprint:draft.fingerprint,title:draft.title,bodyText:draft.expected.bodyText,confirmedAt:'2026-10-10T05:00:00Z',imageAssetIds:draft.expected.imageAssetIds,captions:draft.expected.captions,sources:draft.expected.sources,identity:{listText:draft.title,reopenedUrl:'https://blog.naver.com/write'}};
  if(field==='body')receipt.bodyText='Truncated saved body';
  if(field==='images'){receipt.imageAssetIds=receipt.imageAssetIds.slice(0,1);receipt.captions=[];}
  if(field==='captions')receipt.captions=[];
  if(field==='sources')receipt.sources=['Wrong source'];
  const state=await readJobState(b.jobPath);state.phase='draft_saved';state.saveAttempt={status:'confirmed',startedAt:'2026-10-10T04:00:00Z',fingerprint:draft.fingerprint,receipt};await writeJobState(b.jobPath,state);
  let opens=0,saves=0;
  const result=await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},{open:async()=>{opens++;throw Error('unexpected_open');},save:async()=>{saves++;}});
  expect(result).toMatchObject({status:'needs_user',code:'confirmed_receipt_changed'});expect([opens,saves]).toEqual([0,0]);
 }finally{await rm(b.root,{recursive:true,force:true});}
});
it('save_click_ack_lost stores attempt before exactly one dispatch; restart checks before reinput',async()=>{const b=await setup();try{let saveClicks=0,writes=0,checks=0;const session={editorPage:{},release:async()=>{}} as any;const deps={targetId:async()=> 'owned-test',open:async()=>session,verify:async()=> 'authenticated' as const,prepare:async()=>{},write:async(_s:any,d:any,ack:any)=>{writes++;const receipts=d.assets.map((a:any,index:number)=>({assetId:a.assetId,blockKey:'block'+index,index,confirmedAt:'2026-10-03T02:00:00Z'}));await ack(d.events.length-1,receipts);return receipts;},snapshot:async(_p:any,d:any)=>({title:d.title,bodyText:d.expected.bodyText,images:d.assets.map((a:any,i:number)=>({key:'block'+i,src:'https://example.com/image'+i+'.png',loaded:true,width:a.width,height:a.height}))}),count:async()=>0,save:async()=>{expect((await readJobState(b.jobPath)).saveAttempt.status).toBe('attempted_unconfirmed');saveClicks++;throw new Error('click_ack_lost');},confirm:async()=>{checks++;return null;}};
 const result=await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},deps);expect(result.status).toBe('draft_unconfirmed');expect(saveClicks).toBe(1);expect((await readJobState(b.jobPath)).phase).toBe('draft_unconfirmed');
 await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},deps);expect(writes).toBe(1);expect(saveClicks).toBe(1);expect(checks).toBeGreaterThan(0);
 }finally{await rm(b.root,{recursive:true,force:true});}});
it('partial_input requires owned tab; fingerprint_changed never reconnects or saves',async()=>{const b=await setup();try{const state=await readJobState(b.jobPath);state.phase='draft_unconfirmed';state.saveAttempt={status:'attempted_unconfirmed',fingerprint:'a'.repeat(64),startedAt:'2026-10-03T02:00:00Z'};await writeJobState(b.jobPath,state);let opened=false;const result=await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},{open:async()=>{opened=true;throw Error('unexpected');}});expect(result.status).toBe('draft_unconfirmed');expect(opened).toBe(false);}finally{await rm(b.root,{recursive:true,force:true});}});
it('authentication lost after input blocks the save dispatch',async()=>{const b=await setup();try{let probes=0,saves=0;const result=await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},{open:async()=>({editorPage:{},release:async()=>{}} as any),verify:async()=>++probes===1?'authenticated':'missing',targetId:async()=> 'owned-test',prepare:async()=>{},count:async()=>0,write:async(_s,d)=>d.assets.map((a,index)=>({assetId:a.assetId,blockKey:'block'+index,index,confirmedAt:'2026-10-03T02:00:00Z'})),snapshot:async(_p,d)=>({title:d.title,bodyText:d.expected.bodyText,images:d.assets.map((a,i)=>({key:'block'+i,src:'https://example.com/image'+i+'.png',loaded:true,width:a.width,height:a.height}))}),save:async()=>{saves++;},confirm:async()=>null});expect(result.status).toBe('needs_user');expect(saves).toBe(0);expect((await readJobState(b.jobPath)).saveAttempt.status).toBe('not_attempted');}finally{await rm(b.root,{recursive:true,force:true});}});
