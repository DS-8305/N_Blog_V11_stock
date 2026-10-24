import type {Locator} from 'playwright';
export interface RegionReadiness {loading?:boolean;visible:boolean;unloadedImages:number;occluded:boolean;clipped:boolean;text:string;width:number;height:number}
export const normalizedIncludes=(text:string,label:string)=>text.replace(/\s+/g,'').includes(label.replace(/\s+/g,''));
export function assertRegionReady(state:RegionReadiness,labels:string[],forbiddenLabels:string[]=[]):{width:number;height:number}{
 if(state.loading)throw Error('parent_loading');
 if(!state.visible||state.width<1||state.height<1)throw Error('region_not_visible');
 if(state.unloadedImages)throw Error('images_unfinished');
 if(state.occluded)throw Error('region_occluded');
 if(state.clipped)throw Error('region_clipped');
 if(labels.some(label=>!normalizedIncludes(state.text,label)))throw Error('required_label_missing');
 if(forbiddenLabels.some(label=>normalizedIncludes(state.text,label)))throw Error('forbidden_label_present');
 return {width:state.width,height:state.height};
}
export async function inspectRegion(locator:Locator,area?:{x:number;y:number;width:number;height:number}):Promise<RegionReadiness>{
 return locator.evaluate((element,area)=>{
  const doc=element.ownerDocument,win=doc.defaultView!,box=element.getBoundingClientRect();
  const r=area?{left:area.x,top:area.y,right:area.x+area.width,bottom:area.y+area.height,width:area.width,height:area.height}:box;
  const visible=(e:Element)=>{const b=e.getBoundingClientRect(),s=win.getComputedStyle(e);return b.width>0&&b.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';};
  const images=[...(element.matches('img')?[element]:[]),...element.querySelectorAll('img')] as HTMLImageElement[],visibleImages=images.filter(visible);
  let clipped=r.left<box.left-1||r.top<box.top-1||r.right>box.right+1||r.bottom>box.bottom+1||r.left<0||r.top<0||r.right>win.innerWidth+1||r.bottom>win.innerHeight+1;
  for(let ancestor=element.parentElement;ancestor&&ancestor!==doc.body;ancestor=ancestor.parentElement){const style=win.getComputedStyle(ancestor);if(/hidden|auto|scroll/.test(style.overflow+style.overflowY+style.overflowX)){const b=ancestor.getBoundingClientRect();if(r.left<b.left-1||r.top<b.top-1||r.right>b.right+1||r.bottom>b.bottom+1)clipped=true;}}
  const blocked=(x:number,y:number)=>{const top=doc.elementFromPoint(x,y);return !top||(!element.contains(top)&&!top.contains(element));};
  const dx=Math.min(8,r.width/2),dy=Math.min(8,r.height/2),points=[[r.left+dx,r.top+dy],[r.right-dx,r.top+dy],[r.left+dx,r.bottom-dy],[r.right-dx,r.bottom-dy],[r.left+r.width/2,r.top+r.height/2]];
  let occluded=points.some(([x,y])=>blocked(x!,y!));
  // Inspect intersections too: a floating panel can miss every global sample.
  for(const candidate of doc.querySelectorAll('*')){
   if(candidate===element||candidate.contains(element)||!visible(candidate))continue;
   const b=candidate.getBoundingClientRect(),left=Math.max(r.left,b.left),top=Math.max(r.top,b.top),right=Math.min(r.right,b.right),bottom=Math.min(r.bottom,b.bottom);
   if(right<=left||bottom<=top)continue;
   if(element.contains(candidate)){
    if(['fixed','sticky'].includes(win.getComputedStyle(candidate).position)){occluded=true;break;}
    continue;
   }
   const inset=Math.min(1,(right-left)/2,(bottom-top)/2);
   if([[left+inset,top+inset],[right-inset,top+inset],[left+inset,bottom-inset],[right-inset,bottom-inset],[(left+right)/2,(top+bottom)/2]].some(([x,y])=>blocked(x!,y!))){occluded=true;break;}
  }
  // With an explicit area, only text actually rendered inside that area counts (sub-region captures).
  const areaText=()=>{if(typeof doc.createTreeWalker!=='function'||typeof doc.createRange!=='function')return (element as HTMLElement).innerText??'';const parts:string[]=[],walker=doc.createTreeWalker(element,4/* NodeFilter.SHOW_TEXT */),range=doc.createRange();for(let n=walker.nextNode();n;n=walker.nextNode()){const value=n.textContent?.trim();if(!value||!n.parentElement||!visible(n.parentElement))continue;range.selectNodeContents(n);const b=range.getBoundingClientRect();if(b.bottom>r.top&&b.top<r.bottom&&b.right>r.left&&b.left<r.right)parts.push(value);}return parts.join(' ');};
  const loading=[...doc.querySelectorAll('[aria-busy="true"],[role="progressbar"],.loading,.loader')].some(visible);
  return {loading,visible:visible(element),unloadedImages:visibleImages.filter(e=>!e.complete||!e.naturalWidth||!e.naturalHeight).length,occluded,clipped,text:area?areaText():(element as HTMLElement).innerText??element.getAttribute('alt')??'',width:r.width,height:r.height};
 },area);
}
export type Box={x:number;y:number;width:number;height:number};
/** Resolve an element-derived extent. `area` is in the region's own frame viewport (for inspectRegion); `clip` is in page coordinates (for page.screenshot). */
export async function resolveExtentArea(locator:Locator,extent:{startSelector?:string;untilSelector?:string;maxHeight?:number}):Promise<{area:Box;clip:Box}>{
 const rel=await locator.evaluate((el,ext)=>{
  const pick=(s:string|undefined)=>{if(!s)return el;const found=el.querySelectorAll(s);if(found.length!==1)throw Error('needs_user:capture_extent_ambiguous');return found[0]!;};
  const start=pick(ext.startSelector),until=pick(ext.untilSelector);start.scrollIntoView({block:'start'});
  const e=el.getBoundingClientRect(),s=start.getBoundingClientRect(),u=until.getBoundingClientRect(),height=Math.min(ext.maxHeight??Number.MAX_SAFE_INTEGER,Math.max(s.bottom,u.bottom)-s.top);
  return {x:e.left,y:s.top,width:e.width,height,ex:e.left,ey:e.top};
 },extent);
 const box=await locator.boundingBox();if(!box)throw Error('region_not_visible');const dx=box.x-rel.ex,dy=box.y-rel.ey,area={x:rel.x,y:rel.y,width:rel.width,height:rel.height};
 return {area,clip:{x:area.x+dx,y:area.y+dy,width:area.width,height:area.height}};
}
