import {expect,it} from 'vitest';
import type {Page} from 'playwright';
import {focusNormalBody} from '../../src/automation/editorHelpers.js';

// Browser geometry observed after inserting a source image: a 500px paragraph
// starts at x=282.5 and the interaction sidebar starts at x=780.
function editorSurface(helpOpen:boolean,sidebarOpen:boolean){
 let focused=false,atEnd=false,clickX=Number.POSITIVE_INFINITY;
 const body={
  isVisible:async()=>true,evaluate:async()=>true,
  boundingBox:async()=>({x:282.5,y:834.1875,width:500,height:28.796875}),
  click:async({position}:{position:{x:number;y:number}})=>{
   clickX=position.x;
   if(helpOpen)throw Error('help intercepts pointer events');
   if(sidebarOpen&&282.5+position.x>=780)throw Error('sidebar intercepts pointer events');
   focused=true;
  }
 };
 const helpClose={isVisible:async()=>helpOpen,click:async()=>{helpOpen=false;}};
 const sidebarClose={isVisible:async()=>sidebarOpen,click:async()=>{sidebarOpen=false;}};
 const empty={count:async()=>0};
 const frame={
  locator:(selector:string)=>{
   if(selector==='.se-components-wrap')return {first:()=>({isVisible:async()=>true})};
   if(selector==='.se-component.se-text .se-module-text p.se-text-paragraph')return {count:async()=>1,nth:()=>body};
   if(selector==='.se-help-panel.se-is-on button.se-help-panel-close-button')return {count:async()=>helpOpen?1:0,first:()=>helpClose};
   if(selector==='.se-sidebar-interaction button.se-sidebar-close-button')return {count:async()=>1,first:()=>sidebarClose};
   return {...empty,filter:()=>empty};
  },
  getByRole:()=>empty
 };
 const page={frames:()=>[frame],keyboard:{press:async(key:string)=>{if(!focused)throw Error('body not focused');atEnd=key==='End';}}} as unknown as Page;
 return {page,atEnd:()=>atEnd,sidebarVisible:()=>sidebarOpen,clickX:()=>clickX};
}

it('focuses the final normal paragraph when the image sidebar overlaps its right edge',async()=>{
 const editor=editorSurface(false,true);
 await expect(focusNormalBody(editor.page,'last')).resolves.toBeUndefined();
 expect(editor.atEnd()).toBe(true);
 expect(editor.clickX()).toBeGreaterThan(0);
 expect(editor.clickX()).toBeLessThan(497.5);
});

it('dismisses editor help before focusing a normal paragraph',async()=>{
 const editor=editorSurface(true,false);
 await expect(focusNormalBody(editor.page,'first')).resolves.toBeUndefined();
 expect(editor.atEnd()).toBe(true);
});

it('closes the library sidebar before restoring body focus',async()=>{
 const editor=editorSurface(false,true);
 await focusNormalBody(editor.page,'last');
 expect(editor.sidebarVisible()).toBe(false);
});
