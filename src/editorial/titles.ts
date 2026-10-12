import type {FactDocument} from '../domain/stock.js';
export interface TitleCandidate {text:string;factIds:string[];angle:string;priority:number}
export function buildTitleCandidates(f:FactDocument):TitleCandidate[]{const name=f.identity.issuerName,business=f.business.value.segments[0]!.name;return [
 {text:`${name}, 어떤 회사인지 먼저 살펴봐요`,factIds:[f.overview.factId],angle:'introduction',priority:30},
 {text:`${name}는 ${business}로 무엇을 만들까요?`,factIds:[f.business.factId],angle:'business_question',priority:90},
 {text:`${name}의 사업 구조, 주요 제품부터 읽어봐요`,factIds:[f.business.factId],angle:'business_structure',priority:60},
 {text:`${name} 기업 규모, 시가총액으로 읽는 법`,factIds:[f.marketCap.factId],angle:'scale',priority:55},
 {text:`${name} 주가, 지난 가격 범위를 어떻게 볼까요?`,factIds:[f.quote.factId,f.range52w.factId],angle:'price',priority:70},
 {text:`${name} 주식이 처음이라면, 회사와 시장을 함께 봐요`,factIds:[f.overview.factId,f.marketCap.factId],angle:'beginner',priority:40},
 {text:`${name}의 다음 자료에서 확인할 사업 변화`,factIds:[f.outlook.factId],angle:'checkpoints',priority:50},
 ].map(c=>({...c,priority:c.priority-Math.max(0,c.text.length-45)}));}
export function selectTitle(candidates:TitleCandidate[]):TitleCandidate{const valid=candidates.filter(c=>c.factIds.length&&c.text.trim()&&c.text.length<=80);if(!valid.length)throw Error('needs_user:title_answer_required');return valid.reduce((best,c)=>c.priority>best.priority?c:best);}
