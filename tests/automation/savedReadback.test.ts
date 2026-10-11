import { expect,it,vi } from 'vitest';
import { rm,writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fixtureBundle } from '../helpers/bundle.js';
import { confirmDraft } from '../../src/automation/draftVerifier.js';
it('a matching current buffer cannot hide incomplete persisted content',async()=>{
 const b=await fixtureBundle();let clock=0;const now=vi.spyOn(Date,'now').mockImplementation(()=>clock);
 try{
  const images=b.assets.assets.map((a,i)=>({key:'block'+i,src:'https://example.com/image'+i+'.png',loaded:true,width:a.width,height:a.height}));
  const expected={jobId:b.request.jobId,jobPath:b.jobPath,title:'Title',fingerprint:'a'.repeat(64),events:[],assets:b.assets.assets,expected:{bodyText:'Expected local body',imageAssetIds:b.assets.assets.map(a=>a.assetId),captions:[],sources:['Expected']}};
  await writeFile(join(b.jobPath,'input-proof.json'),JSON.stringify({title:'Title',bodyText:expected.expected.bodyText,images,beforeCount:0,receipts:b.assets.assets.map((a,i)=>({assetId:a.assetId,blockKey:'block'+i,index:i}))}));
  let reloads=0,visible=true,active=true,body=expected.expected.bodyText;
  const marker={isVisible:async()=>active},row={isVisible:async()=>visible,innerText:async()=> 'Title',click:async()=>{if(!active){visible=false;body='Incomplete saved body';}},locator:()=>({locator:()=>marker})};
  const empty={filter(){return this;},count:async()=>0};
  const title={count:async()=>1,nth(){return this;},isVisible:async()=>true,innerText:async()=> 'Title'};
  const count={...title,innerText:async()=> '1',click:async()=>{visible=true;}};
  const rows={filter(){return this;},count:async()=>1,nth:()=>row};
  const frame={getByText:()=>({}),locator:(selector:string)=>selector.includes('save_count_btn')?count:selector==='button[data-click-area="tpb*s.tlist"]'?rows:selector.includes('popup')||selector.includes('data-group')?empty:selector==='.se-components-wrap'?{first:()=>({isVisible:async()=>true})}:selector==='.se-components-wrap .se-text-paragraph'?{evaluateAll:async()=>[body]}:selector==='.se-components-wrap .se-module-image'?{all:async()=>images.map(image=>({scrollIntoViewIfNeeded:async()=>{},evaluate:async()=>({...image})}))}:title};
  const page={frames:()=>[frame],isClosed:()=>false,url:()=> 'https://blog.naver.com/GoBlogWrite.naver',bringToFront:async()=>{},waitForTimeout:async()=>{clock+=1000;},reload:async()=>{reloads++;visible=false;active=false;body='';},keyboard:{press:async()=>{visible=false;}}};
  expect(await confirmDraft({editorPage:page} as any,expected as any)).toBeNull();expect(reloads).toBe(1);
 }finally{now.mockRestore();await rm(b.root,{recursive:true,force:true});}
});
