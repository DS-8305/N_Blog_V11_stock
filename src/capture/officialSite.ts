import {join} from 'node:path';
import type {OwnedCollectionSession} from '../browser/session.js';
import type {FactDocument} from '../domain/stock.js';
import type {StockAsset} from '../domain/asset.js';
import type {SourceHints} from '../providers/types.js';
import {captureRegion} from './captureRegion.js';
import {atomicWriteJson} from '../state/jsonStore.js';
import {jobFile} from '../state/paths.js';
import {captionFor} from '../render/captions.js';
export async function captureOfficialSite(jobPath:string,facts:FactDocument,hints:SourceHints,sourceFingerprint:string,session:OwnedCollectionSession):Promise<StockAsset>{
 await jobFile(jobPath,'assets');await jobFile(jobPath,'receipts');const page=await session.newPage(),o=hints.officialSite;const response=await page.goto(o.url,{waitUntil:'domcontentloaded',timeout:30000});
 if(response&&response.status()>=400)throw Error('needs_user:official_site_http_'+response.status());
 if(new URL(page.url()).hostname!==o.hostname)throw Error('needs_user:official_redirect_domain_mismatch');
 if(await page.locator('iframe[src*="captcha"],input[name="captcha"],#captchaimg').first().isVisible())throw Error('needs_user:official_site_security');
 const locator=page.locator(o.selector);if(await locator.count()!==1)throw Error('needs_user:official_region_ambiguous');
 const relativePath='assets/overview_hero.png',meta=await captureRegion({page,locator,outputPath:join(jobPath,relativePath),requiredLabels:o.requiredLabels}),capturedAt=new Date().toISOString();
 const asset:StockAsset={assetId:'overview_hero',role:'overview_hero',assetKind:'official_screenshot',relativePath,sourceUrl:page.url(),capturedAt,asOf:facts.overview.asOf,factIds:[facts.overview.factId],caption:captionFor('overview_hero',facts,capturedAt), ...meta,reviewStatus:'pending',licenseNote:o.licenseNote,displayContext:{ticker:facts.identity.ticker,market:facts.identity.market,currency:facts.identity.currency,asOfDate:facts.asOfDate}};
 await atomicWriteJson(join(jobPath,'receipts','official-capture.json'),{schemaVersion:1,jobId:facts.jobId,sourceFingerprint,requestedUrl:o.url,sourceUrl:asset.sourceUrl,requiredLabels:o.requiredLabels,capturedAt,sha256:meta.sha256,width:meta.width,height:meta.height});
 return asset;
}
