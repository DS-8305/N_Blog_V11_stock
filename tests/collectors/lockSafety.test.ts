import {it,expect} from 'vitest';
import {fixtureBundle} from '../helpers/bundle.js';
import {readJobState,writeJobState} from '../../src/state/jobStore.js';
import {collectJob} from '../../src/collectors/collectJob.js';
import {acquireJobLock} from '../../src/browser/runLock.js';
it('does not mutate a job when another process owns its lock',async()=>{const b=await fixtureBundle(),before=await readJobState(b.jobPath),release=await acquireJobLock(b.jobPath);try{expect((await collectJob(b.jobPath)).status).toBe('needs_user');expect(await readJobState(b.jobPath)).toEqual(before);}finally{await release();}});
it('does not alter a job that has already entered the editor',async()=>{const b=await fixtureBundle(),state=await readJobState(b.jobPath);state.lastAcknowledgedEvent=0;await writeJobState(b.jobPath,state);expect((await collectJob(b.jobPath)).status).toBe('needs_user');expect(await readJobState(b.jobPath)).toEqual(state);});
