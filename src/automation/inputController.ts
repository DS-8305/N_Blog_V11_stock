import {join} from 'node:path';
import {unlink} from 'node:fs/promises';
import {atomicWriteJson} from '../state/jsonStore.js';
import {setImageCaption} from './imageCaption.js';
import type {OwnedSession} from '../browser/session.js';
import type {PreparedDraft} from '../domain/bundle.js';
import type {ImageReceipt} from './receipts.js';
import {TextWriter,pageTextPort} from './textWriter.js';
import {insertImage} from './imageUploader.js';
import {verifyOwnedSession} from './sessionProbe.js';
export async function writePreparedDraft(session:OwnedSession,draft:PreparedDraft,onAcknowledged:(index:number,receipts:ImageReceipt[])=>Promise<void>,dependencies:{verify?:typeof verifyOwnedSession;writer?:TextWriter;image?:typeof insertImage;startIndex?:number;receipts?:ImageReceipt[]}={}):Promise<ImageReceipt[]>{
 const writer=dependencies.writer??new TextWriter(pageTextPort(session.editorPage)),receipts=[...(dependencies.receipts??[])];
 for(const [index,event]of draft.events.entries()){
  if(index<(dependencies.startIndex??0))continue;const auth=await(dependencies.verify??verifyOwnedSession)(session);if(auth!=='authenticated')throw Error('needs_user:'+auth);
  const intent=join(draft.jobPath,'input-dispatch.json');
  // Persist intent before changing the editor. A crash before acknowledgement is never retried blindly.
  await atomicWriteJson(intent,{schemaVersion:1,jobId:draft.jobId,fingerprint:draft.fingerprint,index,startedAt:new Date().toISOString()});
  if(event.type==='insertImage'){await writer.prepareImage();const asset=draft.assets.find(a=>a.assetId===event.assetId);if(!asset)throw Error('unknown_asset');receipts.push(await(dependencies.image??insertImage)(session.editorPage,event,asset));}
  else if(event.type==='setImageCaption')await setImageCaption(session.editorPage,event.text);
  else await writer.apply(event);
  await onAcknowledged(index,[...receipts]);await unlink(intent);
 }
 return receipts;
}
