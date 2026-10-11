export {requiredRoles,type AssetRole,type StockAsset as CapturedAsset,type AssetManifest,parseAssetManifest} from './asset.js';
export {type FactDocument,parseFacts as parseFactDocument,parseIdentity} from './stock.js';
export {type PostDocument,type PostBlock,parsePostDocument} from './post.js';
export {type ValidationReport,type ValidationIssue,sourceUrl} from './validation.js';
import type {StockAsset} from './asset.js';
export type EditorEvent={type:'setTitle'|'typeText'|'typeBold'|'insertQuote';text:string;bold?:boolean}|{type:'setImageCaption';text:string;assetId:string}|{type:'insertImage';relativePath:string;absolutePath:string;assetId:string};
export interface PreparedDraft {jobId:string;jobPath:string;title:string;fingerprint:string;events:EditorEvent[];assets:StockAsset[];expected:{bodyText:string;imageAssetIds:string[];captions:string[];sources:string[]}}
