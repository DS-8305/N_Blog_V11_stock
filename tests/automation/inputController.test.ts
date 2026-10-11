import {it,expect} from 'vitest';
import {mkdtemp,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {writePreparedDraft} from '../../src/automation/inputController.js';
it('acknowledges only completed events and stops when authentication is lost',async()=>{
 const jobPath=await mkdtemp(join(tmpdir(),'stock-input-')),acknowledged:number[]=[],texts:string[]=[];let checked=0;
 const draft={jobPath,jobId:'test',fingerprint:'a'.repeat(64),events:[{type:'setTitle',text:'title'},{type:'typeText',text:'body'}],assets:[]} as any;
 await expect(writePreparedDraft({editorPage:{}} as any,draft,async index=>{acknowledged.push(index);},{verify:async()=>++checked===1?'authenticated':'security',writer:{apply:async(event:any)=>{texts.push(event.text);},prepareImage:async()=>{}} as any})).rejects.toThrow('needs_user:security');expect(acknowledged).toEqual([0]);expect(texts).toEqual(['title']);
});
it('records dispatch before typing and retains it if readback acknowledgement fails',async()=>{
 const jobPath=await mkdtemp(join(tmpdir(),'stock-pending-')),draft={jobPath,jobId:'test',fingerprint:'a'.repeat(64),events:[{type:'setTitle',text:'title'}],assets:[]} as any;
 await expect(writePreparedDraft({editorPage:{}} as any,draft,async()=>{throw Error('readback_failed');},{verify:async()=> 'authenticated',writer:{apply:async()=>{expect(JSON.parse(await readFile(join(jobPath,'input-dispatch.json'),'utf8')).index).toBe(0);}} as any})).rejects.toThrow('readback_failed');expect(JSON.parse(await readFile(join(jobPath,'input-dispatch.json'),'utf8')).index).toBe(0);
});
