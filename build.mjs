import { build } from 'esbuild';
await build({entryPoints:['src/cli/main.ts'],outfile:'dist/cli.js',bundle:true,platform:'node',format:'esm',target:'node22',packages:'external',sourcemap:true});
await build({entryPoints:['scripts/pick-candidate.ts'],outfile:'dist/pick-candidate.js',bundle:true,platform:'node',format:'esm',target:'node22',packages:'external'});
