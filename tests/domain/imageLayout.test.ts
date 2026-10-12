import {describe,it,expect} from 'vitest';
import {parseJobRequest} from '../../src/domain/job.js';
import {rolesFor,imageLayoutFor} from '../../src/domain/imageLayout.js';
import {fingerprint} from '../../src/editorial/fingerprint.js';
const old={schemaVersion:1,jobId:'old',ticker:'009150',market:'KRX:KOSPI',asOfDate:'2026-10-12',allowHistorical:false,conditions:{articleLength:{min:800,max:1000},imageCaptionPlacement:'native'}};
describe('source layout compatibility',()=>{
 it('preserves old request fingerprint and routes old jobs to cards',()=>{const request=parseJobRequest(old);expect(fingerprint(request)).toBe(fingerprint(old));expect(imageLayoutFor(request)).toBe('legacy_cards');expect(rolesFor(request)[0]).toBe('overview_hero');});
 it('routes explicit source layout to five source roles',()=>{const request=parseJobRequest({...old,conditions:{...old.conditions,imageLayout:'stock_sources_five_v1'}});expect(rolesFor(request)).toEqual(['company_intro','market_overview','price_history','business_structure','performance_context']);});
 it('rejects unknown layout',()=>expect(()=>parseJobRequest({...old,conditions:{...old.conditions,imageLayout:'unknown'}})).toThrow('image_layout'));
});
