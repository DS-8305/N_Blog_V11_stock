import {array,record,version,safeId,enumeration,string,strings,hash,integer,timestamp,sourceUrl,isoDate} from './validation.js';
import {parseIdentity,type SecurityIdentity} from './stock.js';
export const requiredRoles=['overview_hero','market_cap_card','price_52w_card','core_business_card','outlook_visual'] as const;
export type AssetRole=typeof requiredRoles[number];
export interface StockAsset {assetId:string;role:AssetRole;assetKind:'official_screenshot'|'data_card'|'ai_concept';relativePath:string;sourceUrl:string|null;capturedAt:string;generatedAt?:string;asOf:string;factIds:string[];caption:string;sha256:string;width:number;height:number;reviewStatus:'pending'|'approved';licenseNote:string;displayContext:{ticker:string;market:string;currency:string;asOfDate:string};provenance?:{model:string;prompt:string;generatedAt:string;licenseNote:string;inputSha256:string}}
export interface AssetManifest {schemaVersion:1;jobId:string;identity:SecurityIdentity;asOfDate:string;assets:StockAsset[]}
export function parseAssetManifest(v:unknown):AssetManifest {
 const d=record(v);version(d);const assets=array(d.assets,'assets').map(v=>{
  const a=record(v),c=record(a.displayContext);let provenance:StockAsset['provenance'];
  if(a.provenance!==undefined){const p=record(a.provenance);provenance={model:string(p.model,'model'),prompt:string(p.prompt,'prompt'),generatedAt:timestamp(p.generatedAt),licenseNote:string(p.licenseNote,'license'),inputSha256:hash(p.inputSha256)};}
  return {assetId:safeId(a.assetId),role:enumeration(a.role,requiredRoles,'asset_role'),assetKind:enumeration(a.assetKind,['official_screenshot','data_card','ai_concept'],'asset_kind'),relativePath:string(a.relativePath,'relative_path'),sourceUrl:a.sourceUrl===null?null:sourceUrl(a.sourceUrl),capturedAt:timestamp(a.capturedAt),...(a.generatedAt?{generatedAt:timestamp(a.generatedAt)}:{}),asOf:timestamp(a.asOf),factIds:strings(a.factIds,'fact_ids'),caption:string(a.caption,'caption'),sha256:hash(a.sha256),width:integer(a.width,'width',1),height:integer(a.height,'height',1),reviewStatus:enumeration(a.reviewStatus,['pending','approved'],'image_review'),licenseNote:string(a.licenseNote,'asset_license'),displayContext:{ticker:string(c.ticker,'ticker'),market:string(c.market,'market'),currency:string(c.currency,'currency'),asOfDate:isoDate(c.asOfDate)},...(provenance?{provenance}:{})} satisfies StockAsset;
 });
 if(new Set(assets.map(a=>a.assetId)).size!==assets.length)throw Error('duplicate_asset_id');
 return {schemaVersion:1,jobId:safeId(d.jobId),identity:parseIdentity(d.identity),asOfDate:isoDate(d.asOfDate),assets};
}
