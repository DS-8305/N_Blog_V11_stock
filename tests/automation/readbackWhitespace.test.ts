import {it,expect} from 'vitest';
import {fixtureBundle} from '../helpers/bundle.js';
import {runDraft} from '../../src/automation/draftRunner.js';
it('accepts persisted DOM empty lines consistently with the readback verifier',async()=>{
 const b=await fixtureBundle();const result=await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},{
  open:async()=>({editorPage:{},release:async()=>{}} as any),verify:async()=> 'authenticated',prepare:async()=>{},targetId:async()=> 'owned',count:async()=>0,
  write:async(_s,d)=>d.assets.map((a,index)=>({assetId:a.assetId,index,blockKey:'block'+index,confirmedAt:new Date().toISOString()})),
  snapshot:async(_p,d)=>({title:d.title,bodyText:d.expected.bodyText,images:d.assets.map((a,i)=>({key:'block'+i,src:'https://example.com/'+i+'.png',loaded:true,width:a.width,height:a.height}))}),save:async()=>{},
  confirm:async(_s,d)=>({jobId:d.jobId,fingerprint:d.fingerprint,title:d.title,bodyText:d.expected.bodyText.replaceAll('\n','\n\n')+'\n',confirmedAt:new Date().toISOString(),imageAssetIds:d.expected.imageAssetIds,captions:d.expected.captions,sources:d.expected.sources,identity:{listText:d.title,reopenedUrl:'https://blog.naver.com/write'}})
 });expect(result.status).toBe('draft_saved');
});
