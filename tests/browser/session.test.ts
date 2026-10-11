import { expect,it } from 'vitest';import { openEditorSession } from '../../src/browser/session.js';
it('unowned_first_tab_untouched and release keeps editor open',async()=>{
 const user={url:'https://blog.naver.com/my-unfinished-draft',body:'사용자 원고'};const editor={closed:false,currentUrl:'about:blank',goto:async(url:string)=>{editor.currentUrl=url;},isClosed:()=>editor.closed,close:async()=>{editor.closed=true;}};
 const context={newPage:async()=>editor,pages:()=>[user,editor]};let detached=false,unlocked=false;const session=await openEditorSession({cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test',jobId:'job'},{connect:async()=>({contexts:()=>[context],close:async()=>{detached=true;}}) as any,lock:async()=>async()=>{unlocked=true;}});
 expect(user).toEqual({url:'https://blog.naver.com/my-unfinished-draft',body:'사용자 원고'});expect(session.editorPage).toBe(editor);await session.release();expect(editor.closed).toBe(false);expect(detached&&unlocked).toBe(true);
});
