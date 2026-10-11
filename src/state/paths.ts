import {realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep} from 'node:path';
export async function jobFile(jobPath:string,relativePath:string):Promise<string>{
 if(isAbsolute(relativePath)||relativePath.includes('\\')||relativePath.includes(':')||relativePath.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('unsafe_relative_path');
 const root=await realpath(jobPath),file=await realpath(resolve(root,relativePath)),difference=relative(root,file);
 if(!difference||difference==='..'||difference.startsWith('..'+sep)||isAbsolute(difference))throw Error('path_escape');return file;
}
