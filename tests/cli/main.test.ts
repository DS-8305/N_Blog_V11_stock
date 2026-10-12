import {it,expect} from 'vitest';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runCli} from '../../src/cli/main.js';
it('documents implemented commands and rejects publishing or unknown options',async()=>{expect((await runCli(['help'])).exitCode).toBe(0);expect((await runCli(['publish'])).exitCode).toBe(2);expect((await runCli(['job:init','--ticker','009150','--market','KRX:KOSPI','--unknown','x'])).exitCode).toBe(2);});
it('initializes a unique Samsung Electro-Mechanics job but does not report data success',async()=>{const root=await mkdtemp(join(tmpdir(),'stock-cli-'));const a=await runCli(['job:init','--ticker','009150','--market','KRX:KOSPI','--issuer-name','삼성전기','--workspace-root',root]);expect(a.exitCode).toBe(0);const doc=a.output as {jobPath:string;jobId:string};expect(doc.jobId).toContain('009150');expect((await runCli(['source:inspect','--job',doc.jobPath])).exitCode).toBe(3);const b=await runCli(['job:init','--ticker','009150','--market','KRX:KOSPI','--workspace-root',root]);expect((b.output as {jobId:string}).jobId).not.toBe(doc.jobId);});
it('requires both market and ticker, absolute job paths and loopback CDP',async()=>{expect((await runCli(['job:init','--ticker','009150'])).exitCode).toBe(2);expect((await runCli(['draft:run','--job','relative','--cdp','https://example.com','--profile','relative'])).exitCode).toBe(2);});
it('starts new screenshot jobs with reviewed writing-date research while leaving legacy jobs unchanged',async()=>{
 const root=await mkdtemp(join(tmpdir(),'reader-cli-'));
 for(const layout of ['stock_sources_five_v1','legacy_cards']){
  const result=await runCli(['job:init','--ticker','009150','--market','KRX:KOSPI','--workspace-root',root,'--image-layout',layout]);
  const {jobPath}=result.output as {jobPath:string};const request=JSON.parse(await readFile(join(jobPath,'request.json'),'utf8')),template=JSON.parse(await readFile(join(jobPath,'provider-data.template.json'),'utf8'));
  expect(request.conditions.editorialStyle).toBe(layout==='legacy_cards'?undefined:'reader_focused_v2');
  expect(template.marketResearch?.status).toBe(layout==='legacy_cards'?undefined:'unverified');
 }
});
