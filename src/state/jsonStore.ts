import { readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
export async function readJson(path:string):Promise<unknown>{return JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));}
export async function atomicWriteJson(path:string,value:unknown):Promise<void>{
  await atomicWriteBytes(path,JSON.stringify(value,null,2)+'\n');
}
export async function atomicWriteBytes(path:string,bytes:string|Buffer):Promise<void>{
  const temporary=`${path}.${randomUUID()}.tmp`;
  try{await writeFile(temporary,bytes,{flag:'wx'});await rename(temporary,path);}finally{await unlink(temporary).catch(()=>{});}
}
