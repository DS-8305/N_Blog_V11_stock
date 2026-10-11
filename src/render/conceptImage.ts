import {readFile} from 'node:fs/promises';
import sharp from 'sharp';
import {jobFile} from '../state/paths.js';
import {sha256} from '../editorial/fingerprint.js';
import type {SourceHints} from '../providers/types.js';
import type {StockAsset} from '../domain/asset.js';
import {fontFamily,assertKoreanFont} from './fonts.js';
import {xml} from './svgSanitize.js';
export interface ConceptImageRequest {industry:string;activities:string[];tone:string;prohibited:string[]}
export interface ConceptImageResult {png:Buffer;provenance:NonNullable<StockAsset['provenance']>}
export interface ConceptImageProvider {generate(request:ConceptImageRequest):Promise<ConceptImageResult>}
export const conceptRequest=(industry:string,activities:string[]):ConceptImageRequest=>({industry,activities,tone:'실사형 산업 환경 콘셉트',prohibited:['실재 기업의 공식 사진처럼 묘사','실제 인물·공장·제품의 재현 주장','합성 기업 로고','금융 수치와 위조 차트']});
export class ReviewedConceptImport implements ConceptImageProvider {
 constructor(private jobPath:string,private config:SourceHints['concept']){}
 async generate(_request:ConceptImageRequest):Promise<ConceptImageResult>{
  const c=this.config;if(!c||c.reviewStatus!=='approved')throw Error('needs_user:concept_image_required');
  if(Date.parse(c.generatedAt)>Date.now())throw Error('needs_user:future_concept_image');
  const bytes=await readFile(await jobFile(this.jobPath,c.relativePath));if(sha256(bytes)!==c.sha256)throw Error('needs_user:concept_hash_changed');
  const meta=await sharp(bytes).metadata();if(meta.format!=='png'||meta.width!==1200||meta.height!==1200)throw Error('needs_user:concept_png_1200_required');
  await assertKoreanFont();
  const label=`<svg width="1200" height="1200" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="1110" width="1200" height="90" fill="#10223c" fill-opacity="0.92"/><text x="600" y="1168" text-anchor="middle" font-family="${xml(fontFamily())}" font-size="32" fill="white">AI 생성 콘셉트 이미지</text></svg>`;
  return {png:await sharp(bytes).composite([{input:Buffer.from(label)}]).png().toBuffer(),provenance:{model:c.model,prompt:c.prompt,generatedAt:c.generatedAt,licenseNote:c.licenseNote,inputSha256:c.sha256}};
 }
}
