import {it,expect} from 'vitest';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createJob} from '../../src/state/jobStore.js';
import {atomicWriteJson} from '../../src/state/jsonStore.js';
import {sourceBasis,loadReviewedProvider} from '../../src/providers/reviewedFile.js';
import {sha256} from '../../src/editorial/fingerprint.js';
import {fixtureFacts,request} from '../fixtures/stock.js';
import type {SourceHints} from '../../src/providers/types.js';
export async function sourceFixture(){
 const root=await mkdtemp(join(tmpdir(),'stock-provider-')),job=await createJob(root,request),facts=fixtureFacts();
 const bytes=Buffer.from(JSON.stringify(facts)),evidence=Buffer.from('SYNTHETIC ONLY: official report and identity evidence');
 await writeFile(join(job,'provider-data.json'),bytes);await writeFile(join(job,'evidence.txt'),evidence);
 const hints:SourceHints={schemaVersion:1,provider:{kind:'reviewed_file',relativePath:'provider-data.json',sha256:sha256(bytes),permission:{status:'approved',basis:'Synthetic test only'}},officialSite:{url:'https://example.com/about',hostname:'example.com',selector:'main',requiredLabels:['가상전자'],issuerName:'가상전자',verificationUrl:'https://example.com/official-report',licenseNote:'Synthetic test only'},evidence:[{evidenceId:'report',relativePath:'evidence.txt',sourceUrl:'https://example.com/official-report',sha256:sha256(evidence),retrievedAt:'2026-10-10T01:00:00Z',licenseNote:'Synthetic test only',factIds:['identity','overview','quote','market_cap','range_52w','business','outlook']}],review:{status:'approved',reviewedBy:'fixture reviewer',reviewedAt:'2026-10-10T02:00:00Z',basisFingerprint:''}};
 hints.review.basisFingerprint=sourceBasis(hints);await atomicWriteJson(join(job,'source-hints.json'),hints);return {root,job,facts,hints};
}
it('loads a hash-bound reviewed document with source evidence',async()=>{const {job}=await sourceFixture();const {provider}=await loadReviewedProvider(job);expect((await provider.resolve('005930','KRX:KOSPI')).issuerName).toBe('가상전자');await expect(provider.resolve('5930','KRX:KOSPI')).rejects.toThrow('security_identity_mismatch');});
it('blocks provider data altered after review',async()=>{const {job}=await sourceFixture();await writeFile(join(job,'provider-data.json'),'{}');await expect(loadReviewedProvider(job)).rejects.toThrow('provider_hash_changed');});
it('blocks evidence modified after review',async()=>{const {job}=await sourceFixture();await writeFile(join(job,'evidence.txt'),'changed');await expect(loadReviewedProvider(job)).rejects.toThrow('evidence_hash_changed');});
it('blocks source URL substitution and pending review',async()=>{const {job,hints}=await sourceFixture();hints.evidence[0]!.sourceUrl='https://example.com/other';await atomicWriteJson(join(job,'source-hints.json'),hints);await expect(loadReviewedProvider(job)).rejects.toThrow('source_review_required');hints.review.basisFingerprint=sourceBasis(hints);await atomicWriteJson(join(job,'source-hints.json'),hints);await expect(loadReviewedProvider(job)).rejects.toThrow('fact_evidence_mismatch');});
it('rejects an outside file even if a valid hash is supplied',async()=>{const {job,hints}=await sourceFixture();hints.provider.relativePath='../provider-data.json';hints.review.basisFingerprint=sourceBasis(hints);await atomicWriteJson(join(job,'source-hints.json'),hints);await expect(loadReviewedProvider(job)).rejects.toThrow('unsafe_relative_path');});
