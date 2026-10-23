import {it,expect} from 'vitest';import {checkTitleDiversity,legacySevenTitlesAllowed,titleEnding} from '../../src/editorial/titleDiversity.js';
const five=['실적 발표 다음 날, 기아에 무슨 일이','매출 114조인데 주가는 제자리, 기아','기아 들고 있다면 볼 숫자 3가지','기아 주가, 다시 오를 수 있을까?','PER 4배 기아 주가, 지금이 바닥일까?'];
it('accepts five candidates with distinct endings',()=>{expect(checkTitleDiversity(five,five[0]!)).toEqual([]);});
it('requires exactly five',()=>{expect(checkTitleDiversity(five.slice(0,4),five[0]!)).toContain('five_titles_required');});
it('rejects repeated endings',()=>{const c=[...five];c[3]='LS 주가, 지금이 바닥일까?';expect(checkTitleDiversity(c,c[0]!)).toContain('title_ending_repeated');});
it('rejects selected ending matching recent titles',()=>{expect(checkTitleDiversity(five,five[4]!,['연매출 11조 찍은 삼성전기 주가, 지금이 바닥일까?'])).toContain('title_ending_matches_recent');expect(titleEnding('A, B?')).toBe('B?');});
it('allows legacy seven only before cutoff',()=>{const s=['a','b','c','d','e','f','g'];expect(legacySevenTitlesAllowed('2026-10-23',s,'a')).toBe(true);expect(legacySevenTitlesAllowed('2026-10-24',s,'a')).toBe(false);});
