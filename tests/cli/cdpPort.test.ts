import { beforeEach,expect,it,vi } from 'vitest';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

vi.mock('../../src/collectors/collectJob.js',async importOriginal=>({
 ...await importOriginal<typeof import('../../src/collectors/collectJob.js')>(),
 collectJob:vi.fn(async()=>({status:'needs_user',code:'fixture_only',message:'fixture_only'})),
}));
import { collectJob } from '../../src/collectors/collectJob.js';
import { runCli } from '../../src/cli/main.js';

const jobPath=join(tmpdir(),'stock-cli-port-job'),profilePath=join(tmpdir(),'stock-cli-port-profile');
beforeEach(()=>vi.clearAllMocks());
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
