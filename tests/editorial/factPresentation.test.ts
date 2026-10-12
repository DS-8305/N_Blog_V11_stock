import {it,expect} from 'vitest';import {readerMoney} from '../../src/editorial/factPresentation.js';
it.each([[450000000000000,'450조 원'],[75000,'7만 5,000원'],[123456789,'1억 2,345만 6,789원'],[50000,'5만 원'],[1234,'1,234원']])('preserves exact won amount %i', (amount,text)=>expect(readerMoney(amount as number,'KRW')).toBe(text));
it('preserves decimals and USD without rounding them away',()=>{expect(readerMoney(1234.125,'USD')).toContain('1,234.125');expect(readerMoney(12.5,'KRW')).toContain('12.5');});
