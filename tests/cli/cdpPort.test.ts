import { beforeEach,expect,it,vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {mkdtemp} from 'node:fs/promises';
import {createJob} from '../../src/state/jobStore.js';
import {request} from '../fixtures/stock.js';

vi.mock('../../src/collectors/collectJob.js',async importOriginal=>({
 ...await importOriginal<typeof import('../../src/collectors/collectJob.js')>(),
 collectJob:vi.fn(async()=>({status:'needs_user',code:'fixture_only',message:'fixture_only'})),
}));
import { collectJob } from '../../src/collectors/collectJob.js';
import { runCli } from '../../src/cli/main.js';

let jobPath:string;const profilePath=join(tmpdir(),'stock-cli-port-profile');
beforeEach(async()=>{vi.clearAllMocks();jobPath=await createJob(await mkdtemp(join(tmpdir(),'stock-cli-port-')),request);});
it('connects collection to port 9223 when --cdp is omitted',async()=>{
 const result=await runCli(['collect:run','--job',jobPath,'--profile',profilePath]);
 expect(result.exitCode).toBe(3);
 expect(collectJob).toHaveBeenCalledWith(jobPath,{cdpEndpoint:'http://127.0.0.1:9223',profilePath});
});
it('preserves an explicitly selected different port',async()=>{
 const result=await runCli(['collect:run','--job',jobPath,'--profile',profilePath,'--cdp','http://localhost:9333']);
 expect(result.exitCode).toBe(3);
 expect(collectJob).toHaveBeenCalledWith(jobPath,{cdpEndpoint:'http://127.0.0.1:9333',profilePath});
});
it('rejects a remote CDP address before starting collection',async()=>{
 const result=await runCli(['collect:run','--job',jobPath,'--profile',profilePath,'--cdp','http://example.com:9223']);
 expect(result.exitCode).toBe(2);
 expect(collectJob).not.toHaveBeenCalled();
});
