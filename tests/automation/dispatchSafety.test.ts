import {it,expect} from 'vitest';
import {join} from 'node:path';
import {fixtureBundle} from '../helpers/bundle.js';
import {validateBundle,compileDraft} from '../../src/editorial/compileDraft.js';
import {atomicWriteJson} from '../../src/state/jsonStore.js';
import {runDraft} from '../../src/automation/draftRunner.js';
it('never opens a fresh editor after an unacknowledged first event',async()=>{const b=await fixtureBundle(),draft=compileDraft(b.jobPath,b,await validateBundle(b.jobPath,b));await atomicWriteJson(join(b.jobPath,'input-dispatch.json'),{jobId:draft.jobId,fingerprint:draft.fingerprint,index:0});let opens=0;const result=await runDraft(b.jobPath,{cdpEndpoint:'http://127.0.0.1:9222',profilePath:'test'},{open:async()=>{opens++;throw Error('unexpected');}});expect(result.status).toBe('needs_user');expect('code'in result&&result.code).toContain('input_dispatch_unconfirmed');expect(opens).toBe(0);});
