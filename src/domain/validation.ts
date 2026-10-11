export interface ValidationIssue {code:string;path:string;message:string}
export interface ValidationReport {errors:ValidationIssue[];warnings:ValidationIssue[];fingerprint:string}
export const issue=(code:string,path=''):ValidationIssue=>({code,path,message:code});
export function record(value:unknown,label='document'):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`invalid_${label}`);return value as Record<string,unknown>;}
export function string(value:unknown,label:string,allowEmpty=false):string {if(typeof value!=='string'||(!allowEmpty&&!value.trim()))throw Error(`invalid_${label}`);return value;}
export function integer(value:unknown,label:string,min=0):number {if(typeof value!=='number'||!Number.isSafeInteger(value)||value<min)throw Error(`invalid_${label}`);return value;}
export function positive(value:unknown,label:string):number {if(typeof value!=='number'||!Number.isFinite(value)||value<=0)throw Error(`invalid_${label}`);return value;}
export function version(value:Record<string,unknown>):void {if(value.schemaVersion!==1)throw Error('schema_version');}
export function isoDate(value:unknown):string {const d=string(value,'date');if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d)throw Error('invalid_date');return d;}
export function timestamp(value:unknown):string {const d=string(value,'timestamp');if(!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(d)||!Number.isFinite(Date.parse(d)))throw Error('invalid_timestamp');isoDate(d.slice(0,10));return d;}
export function safeId(value:unknown):string {const id=string(value,'id');if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,100}$/.test(id)||/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(id))throw Error('unsafe_id');return id;}
export function array(value:unknown,label:string):unknown[]{if(!Array.isArray(value))throw Error(`invalid_${label}`);return value;}
export const strings=(v:unknown,label:string)=>array(v,label).map(x=>string(x,label));
export function enumeration<T extends string>(v:unknown,values:readonly T[],label:string):T {if(typeof v!=='string'||!values.includes(v as T))throw Error(`invalid_${label}`);return v as T;}
export function hash(v:unknown):string {const h=string(v,'sha256');if(!/^[a-f0-9]{64}$/.test(h))throw Error('invalid_sha256');return h;}
export function sourceUrl(v:unknown):string {const s=string(v,'source_url'),u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)throw Error('https_source_required');return s;}
export function timezone(v:unknown):string {const s=string(v,'timezone');try{new Intl.DateTimeFormat('en',{timeZone:s});}catch{throw Error('invalid_timezone');}return s;}
export function localDate(value:string|Date,zone:string):string {return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
