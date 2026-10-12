import {requiredRoles,type AssetRole} from './asset.js';
import type {JobRequest} from './job.js';
import type {FactDocument} from './stock.js';
export type ImageLayout='legacy_cards'|'stock_sources_five_v1';
export const sourceRoles=['company_intro','market_overview','price_history','business_structure','performance_context'] as const;
export type SourceRole=typeof sourceRoles[number];
export const imageLayoutFor=(request:JobRequest):ImageLayout=>request.conditions.imageLayout??'legacy_cards';
export const rolesFor=(request:JobRequest):readonly AssetRole[]=>imageLayoutFor(request)==='legacy_cards'?requiredRoles:sourceRoles;
export function factIdsFor(role:AssetRole,facts:FactDocument):string[]{switch(role){case 'overview_hero':case 'company_intro':return [facts.overview.factId];case 'market_cap_card':case 'market_overview':return [facts.marketCap.factId];case 'price_52w_card':case 'price_history':return [facts.quote.factId,facts.range52w.factId];case 'core_business_card':case 'business_structure':return [facts.business.factId];case 'outlook_visual':return [facts.outlook.factId];case 'performance_context':return [];}}
