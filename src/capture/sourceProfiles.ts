import type {Page,Locator} from 'playwright';
import type {CaptureHints,CaptureSourceHint} from '../domain/capture.js';
import {sourceUrl} from '../domain/validation.js';
import {assertRegionReady,inspectRegion,resolveExtentArea} from './readiness.js';
type Identity=CaptureHints['identity'];
const includes=(text:string,label:string)=>text.replace(/\s+/g,'').includes(label.replace(/\s+/g,''));
export function assertSourceIdentity(text:string,identity:Identity):void{
 const exchange=identity.market.split(':').at(-1)!,labels=exchange==='KOSPI'?['KOSPI','코스피']:exchange==='KOSDAQ'?['KOSDAQ','코스닥']:[exchange],normalized=text.toUpperCase();
 if(!includes(text,identity.issuerName)||!new RegExp(`(?<![A-Za-z0-9.-])${identity.ticker.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}(?![A-Za-z0-9.-])`).test(text)||!labels.some(label=>includes(normalized,label)))throw Error('needs_user:capture_identity_mismatch');
}
export function assertSourceUrl(url:string,hint:CaptureSourceHint,identity:Identity,frame=false):void{
 const u=new URL(sourceUrl(url));if(u.hostname!==(frame?hint.frame?.hostname:hint.hostname))throw Error('needs_user:capture_host_mismatch');
 if(hint.profile==='naverpay'){
  if(!identity.market.startsWith('KRX:'))throw Error('needs_user:naverpay_market_not_supported');
  if(frame){if(u.hostname!=='navercomp.wisereport.co.kr'||u.searchParams.get('cmp_cd')!==identity.ticker)throw Error('needs_user:capture_frame_ticker_mismatch');}
  else if(u.hostname==='navercomp.wisereport.co.kr'){if(!u.pathname.startsWith('/v2/company/')||u.searchParams.get('cmp_cd')!==identity.ticker)throw Error('needs_user:capture_parent_ticker_mismatch');}
  else if(u.hostname!=='stock.naver.com'||!u.pathname.startsWith(`/domestic/stock/${identity.ticker}/`))throw Error('needs_user:capture_parent_ticker_mismatch');
 }
 if(!frame&&url!==hint.url)throw Error('needs_user:capture_redirect_requires_review');
}
export async function resolveSourceRegion(page:Page,hint:CaptureSourceHint,identity:Identity):Promise<{region:Locator;frameOwner?:Locator;frameUrl?:string;identityText:string;regionText:string}>{
 if(hint.profile==='naverpay'&&!identity.market.startsWith('KRX:'))throw Error('needs_user:naverpay_market_not_supported');
 let identityText='';
 if(hint.verificationUrl!==hint.url){await page.goto(hint.verificationUrl,{waitUntil:'domcontentloaded'});if(page.url()!==hint.verificationUrl)throw Error('needs_user:capture_verification_redirect');identityText=await page.locator(hint.identitySelector).innerText();assertSourceIdentity(identityText,identity);}
 await page.goto(hint.url,{waitUntil:'domcontentloaded'});assertSourceUrl(page.url(),hint,identity);
 if(!identityText){identityText=await page.locator(hint.identitySelector).innerText();assertSourceIdentity(identityText,identity);}
 if(hint.requiredIdentityLabels.some(label=>!includes(identityText,label)))throw Error('needs_user:capture_identity_label_missing');
 if(hint.profile==='company'&&!includes(await page.locator('body').innerText(),identity.issuerName))throw Error('needs_user:capture_company_missing');
 let scope:Page|import('playwright').Frame=page,frameOwner:Locator|undefined,frameUrl:string|undefined;
 if(hint.frame){frameOwner=page.locator(hint.frame.selector);if(await frameOwner.count()!==1)throw Error('needs_user:capture_frame_ambiguous');await frameOwner.scrollIntoViewIfNeeded();const frame=await (await frameOwner.elementHandle())?.contentFrame();if(!frame)throw Error('needs_user:capture_frame_unready');frameUrl=frame.url();assertSourceUrl(frameUrl,hint,identity,true);scope=frame;}
 if(hint.selection){
  const selected=scope.locator(hint.selection.selector);if(await selected.count()!==1)throw Error('needs_user:capture_selection_ambiguous');
  const controlState=()=>selected.evaluate(e=>{
   const input=e.tagName==='INPUT'?e as HTMLInputElement:e.tagName==='LABEL'?(e as HTMLLabelElement).control as HTMLInputElement|null:e.querySelector('input');
   const text=[e.getAttribute('aria-label'),e.textContent,...(input?.labels?Array.from(input.labels).map(l=>l.textContent):[])].filter(Boolean).join(' ');
   const checked=e.getAttribute('aria-selected')==='true'||e.getAttribute('aria-pressed')==='true'||e.getAttribute('aria-checked')==='true'||input?.checked===true||e.classList.contains('active')||e.classList.contains('on');
   return {text,checked};
  });
  const before=await controlState();if(!includes(before.text,hint.selection.expectedText))throw Error('needs_user:capture_selection_ambiguous');if(!before.checked)await selected.click();const after=await controlState();if(!after.checked||!includes(after.text,hint.selection.expectedText))throw Error('needs_user:capture_selection_unconfirmed');
 }
 const region=scope.locator(hint.selector);if(await region.count()!==1)throw Error('needs_user:capture_region_ambiguous');await region.waitFor({state:'visible'});const regionText=await readRegionText(region,hint);
 const labels=[...hint.requiredRegionLabels,...[hint.sourceDateText,hint.unitText,hint.marketScope,hint.priceBasis,hint.selectedPeriod].filter((s):s is string=>s!==null)];if(labels.some(l=>!includes(regionText,l)))throw Error('needs_user:capture_metadata_not_visible');
 if((hint.forbiddenRegionLabels??[]).some(l=>includes(regionText,l)))throw Error('needs_user:capture_forbidden_label_present');
 return {region,...(frameOwner?{frameOwner,frameUrl}:{}),identityText,regionText};
}
/** Text the capture actually contains: the extent area when configured, otherwise the whole region (legacy). */
export async function readRegionText(region:Locator,hint:Pick<CaptureSourceHint,'extent'>):Promise<string>{if(!hint.extent)return region.innerText();const {area}=await resolveExtentArea(region,hint.extent);return (await inspectRegion(region,area)).text;}
