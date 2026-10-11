import {it,expect} from 'vitest';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createJob} from '../../src/state/jobStore.js';
import {atomicWriteJson} from '../../src/state/jsonStore.js';
import {sourceBasis,loadReviewedProvider} from '../../src/providers/reviewedFile.js';
import {sha256} from '../../src/editorial/fingerprint.js';
import {fixtureFacts,request} from './stock.js';
import type {SourceHints} from '../../src/providers/types.js';
export async function sourceFixture(){
 const root=await mkdtemp(join(tmpdir(),'stock-provider-')),job=await createJob(root,request),facts=fixtureFacts();
 const bytes=Buffer.from(JSON.stringify(facts)),evidence=Buffer.from('SYNTHETIC ONLY: official report and identity evidence');
 await writeFile(join(job,'provider-data.json'),bytes);await writeFile(join(job,'evidence.txt'),evidence);
 const hints:SourceHints={schemaVersion:1,provider:{kind:'reviewed_file',relativePath:'provider-data.json',sha256:sha256(bytes),permission:{status:'approved',basis:'Synthetic test only'}},officialSite:{url:'https://example.com/about',hostname:'example.com',selector:'main',requiredLabels:['가상전자'],issuerName:'가상전자',verificationUrl:'https://example.com/official-report',licenseNote:'Synthetic test only'},evidence:[{evidenceId:'report',relativePath:'evidence.txt',sourceUrl:'https://example.com/official-report',sha256:sha256(evidence),retrievedAt:'2026-10-10T01:00:00Z',licenseNote:'Synthetic test only',factIds:['identity','overview','quote','market_cap','range_52w','business','outlook']}],review:{status:'approved',reviewedBy:'fixture reviewer',reviewedAt:'2026-10-10T02:00:00Z',basisFingerprint:''}};
 hints.review.basisFingerprint=sourceBasis(hints);await atomicWriteJson(join(job,'source-hints.json'),hints);return {root,job,facts,hints};
}
