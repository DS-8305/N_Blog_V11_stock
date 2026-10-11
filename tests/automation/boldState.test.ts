import { afterEach,expect,it,vi } from 'vitest';
import type { Page } from 'playwright';
import { setBold } from '../../src/automation/editorHelpers.js';

afterEach(()=>vi.restoreAllMocks());

function delayedBold(initial:boolean,delay:number|null,indicator:'class'|'aria'){
 let elapsed=0,clickedAt:number|null=null,clicks=0;
 vi.spyOn(Date,'now').mockImplementation(()=>elapsed);
 const active=()=>clickedAt!==null&&delay!==null&&elapsed-clickedAt>=delay?!initial:initial;
 const button={
  isVisible:async()=>true,
  getAttribute:async(name:string)=>name==='aria-pressed'?(indicator==='aria'?String(active()):null):name==='class'?(active()?'se-toolbar-button se-is-selected':'se-toolbar-button'):null,
  click:async()=>{clicks++;clickedAt=elapsed;}
 };
 const page={
  isClosed:()=>false,
  frames:()=>[{locator:()=>({count:async()=>1,nth:()=>button})}],
  waitForTimeout:async(ms:number)=>{elapsed+=ms;}
 } as unknown as Page;
 return {page,clicks:()=>clicks,elapsed:()=>elapsed};
}

it('waits for the delayed selected class after enabling bold with one click',async()=>{
 const control=delayedBold(false,150,'class');
 await expect(setBold(control.page,true)).resolves.toBeUndefined();
 expect(control.clicks()).toBe(1);
 expect(control.elapsed()).toBeGreaterThanOrEqual(150);
});

it('waits for the delayed aria state after disabling bold with one click',async()=>{
 const control=delayedBold(true,150,'aria');
 await expect(setBold(control.page,false)).resolves.toBeUndefined();
 expect(control.clicks()).toBe(1);
 expect(control.elapsed()).toBeGreaterThanOrEqual(150);
});

it('does not click or wait when bold already has the requested state',async()=>{
 const control=delayedBold(true,null,'class');
 await setBold(control.page,true);
 expect(control.clicks()).toBe(0);
 expect(control.elapsed()).toBe(0);
});

it('keeps the existing error when the requested bold state never appears and stops polling',async()=>{
 const control=delayedBold(false,null,'aria');
 await expect(setBold(control.page,true)).rejects.toThrow('bold_state_unconfirmed');
 expect(control.clicks()).toBe(1);
 expect(control.elapsed()).toBeGreaterThanOrEqual(3000);
 expect(control.elapsed()).toBeLessThanOrEqual(3050);
});
