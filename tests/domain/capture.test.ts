import {describe,it,expect} from 'vitest';
import {parseCaptureHints,parseCaptureManifest} from '../../src/domain/capture.js';
import {hintsFixture,sourceRoles} from '../helpers/captureHints.js';
const digest='a'.repeat(64);
const manifest=()=>({schemaVersion:1,jobId:'capture',runId:'run-1',requestFingerprint:digest,basisFingerprint:digest,screens:sourceRoles.map(role=>({role,runId:'run-1',parentUrl:'https://company.example/page',regionSelector:'#region',sourceName:'Official',capturedAt:'2026-10-12T01:00:00Z',sourceDateText:null,unitText:null,marketScope:null,priceBasis:null,selectedPeriod:null,identityText:'삼성전기 009150 KRX',regionText:'자료',contentSignature:digest,relativePath:`assets/${role}.png`,width:1100,height:500,sha256:digest,hintsFingerprint:digest}))});
describe('capture contracts',()=>{
 it('preserves original aspect ratio and absent metadata',()=>{expect(parseCaptureManifest(manifest()).screens[0]).toMatchObject({width:1100,height:500,sourceDateText:null});});
 it.each([4,6])('rejects a %i screen set',count=>{const m=manifest();m.screens=Array.from({length:count},(_,i)=>m.screens[i%5]!);expect(()=>parseCaptureManifest(m)).toThrow('five_capture_roles_required');});
 it('rejects duplicated or reordered roles',()=>{const m=manifest();m.screens.reverse();expect(()=>parseCaptureManifest(m)).toThrow('five_capture_roles_required');});
 it('rejects HTTP and escaping paths',()=>{const m=manifest();m.screens[0]!.parentUrl='http://company.example';expect(()=>parseCaptureManifest(m)).toThrow('https');m.screens[0]!.parentUrl='https://company.example';m.screens[0]!.relativePath='../other.png';expect(()=>parseCaptureManifest(m)).toThrow('capture_path');});
 it('requires permission basis and approved permission',()=>{const h=hintsFixture();h.sources[0]!.permission.basis='';expect(()=>parseCaptureHints(h)).toThrow('permission_basis');});
 it('binds the configured hostname',()=>{const h=hintsFixture();h.sources[0]!.hostname='other.example';expect(()=>parseCaptureHints(h)).toThrow('capture_host_mismatch');});
});
