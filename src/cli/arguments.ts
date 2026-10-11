export function argumentsFor(argv:string[]):{command:string;options:Record<string,string|boolean>}{
 const [command='help',...rest]=argv,options:Record<string,string|boolean>={};
 for(let i=0;i<rest.length;i++){
  const key=rest[i]!;if(!/^--[a-z][a-z-]*$/.test(key))throw Error('invalid_argument:'+key);if(Object.hasOwn(options,key.slice(2)))throw Error('duplicate_option:'+key);
  if(key==='--allow-historical')options[key.slice(2)]=true;else{const value=rest[++i];if(!value||value.startsWith('--'))throw Error('option_value_required:'+key);options[key.slice(2)]=value;}
 }
 return {command,options};
}
export function required(options:Record<string,string|boolean>,key:string):string{const value=options[key];if(typeof value!=='string'||!value.trim())throw Error('option_required:--'+key);return value;}
export function rejectUnknown(options:Record<string,string|boolean>,allowed:string[]):void{for(const key of Object.keys(options))if(!allowed.includes(key))throw Error('unknown_option:--'+key);}
