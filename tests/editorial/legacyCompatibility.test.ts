import {it,expect} from 'vitest';import {fixtureBundle} from '../helpers/bundle.js';import {fingerprint} from '../../src/editorial/fingerprint.js';
it('preserves the legacy manuscript fingerprint from origin/main',async()=>{const b=await fixtureBundle();expect(fingerprint(b.post)).toBe('cecbdc5ad7cab7bd356ce9951cde27e8739cc4dd5d2645ad58e0f1a6e6b6488f');});
