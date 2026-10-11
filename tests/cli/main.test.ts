import {it,expect} from 'vitest';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runCli} from '../../src/cli/main.js';
it('documents implemented commands and rejects publishing or unknown options',async()=>{expect((await runCli(['help'])).exitCode).toBe(0);expect((await runCli(['publish'])).exitCode).toBe(2);expect((await runCli(['job:init','--ticker','009150','--market','KRX:KOSPI','--unknown','x'])).exitCode).toBe(2);});
it('initializes a unique Samsung Electro-Mechanics job but does not report data success',async()=>{const root=await mkdtemp(join(tmpdir(),'stock-cli-'));const a=await runCli(['job:init','--ticker','009150','--market','KRX:KOSPI','--issuer-name','삼성전기','--workspace-root',root]);expect(a.exitCode).toBe(0);const doc=a.output as {jobPath:string;jobId:string};expect(doc.jobId).toContain('009150');expect((await runCli(['source:inspect','--job',doc.jobPath])).exitCode).toBe(3);const b=await runCli(['job:init','--ticker','009150','--market','KRX:KOSPI','--workspace-root',root]);expect((b.output as {jobId:string}).jobId).not.toBe(doc.jobId);});
it('requires both market and ticker, absolute job paths and loopback CDP',async()=>{expect((await runCli(['job:init','--ticker','009150'])).exitCode).toBe(2);expect((await runCli(['draft:run','--job','relative','--cdp','https://example.com','--profile','relative'])).exitCode).toBe(2);});
