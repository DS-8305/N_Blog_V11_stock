import {join} from 'node:path';
import {readRequest} from '../state/jobStore.js';
import {readJson} from '../state/jsonStore.js';
import {collectionCheck} from '../collectors/collectJob.js';
import {parseAssetManifest} from '../domain/asset.js';
import {parsePostDocument} from '../domain/post.js';
export async function loadBundle(jobPath:string){const request=await readRequest(jobPath),{facts,sourceFingerprint}=await collectionCheck(jobPath),assets=parseAssetManifest(await readJson(join(jobPath,'assets.json'))),post=parsePostDocument(await readJson(join(jobPath,'post.json')));return {request,facts,assets,post,sourceFingerprint};}
