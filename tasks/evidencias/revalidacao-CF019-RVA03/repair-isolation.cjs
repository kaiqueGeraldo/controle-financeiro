const fs=require('node:fs'),path=require('node:path');
const {Scanner}=require('../../../controle-financeiro-frontend/node_modules/@tailwindcss/oxide');
const root=process.cwd(),front=path.join(root,'.rv3/controle-financeiro-frontend');
function scan(){const scanner=new Scanner({sources:[{base:front,pattern:'**/*',negated:false}]});const classes=scanner.scan();return {count:classes.length,flex:classes.includes('flex'),fixed:classes.includes('fixed'),files:scanner.files.length};}
const before=scan();
fs.writeFileSync(path.join(root,'.rv3/.gitignore'),'candidate.zip\n');
const after=scan();
fs.writeFileSync(path.join(__dirname,'isolation-scanner.json'),JSON.stringify({before,after},null,2));
console.log({before,after});
if(!after.flex||!after.fixed)throw Error('Source scanning still broken');
const config=path.join(front,'next.config.ts');
fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace('const nextConfig: NextConfig = {','const nextConfig: NextConfig = {\n  distDir: ".next-review-02",'));
