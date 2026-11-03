import fs from 'node:fs';
import path from 'node:path';
import {physicalPath} from '../../../.github/scripts/paths.mjs';

function statIfPresent(file){
  try{return fs.lstatSync(file);}catch(error){if(error.code==='ENOENT')return null;throw error;}
}
function within(root,destination){
  const relative=path.relative(root,destination);
  return relative!==''&&!path.isAbsolute(relative)&&relative!=='..'&&!relative.startsWith('..'+path.sep);
}
export function requireNewRuntime(value,allowedRoot){
  if(typeof value!=='string'||!path.isAbsolute(value))throw new Error('Absolute runtime required');
  if(value.split(/[\\/]/).includes('..'))throw new Error('Runtime traversal refused');
  const root=path.resolve(allowedRoot),destination=path.resolve(value);
  if(!within(root,destination))throw new Error('Runtime outside authorized root');
  if(!/^(?:expanded-local|revisao-plataformas-docker)-[A-Za-z0-9][A-Za-z0-9._-]*$/.test(path.basename(destination)))throw new Error('Unsupported runtime name');
  const parts=path.relative(root,destination).split(path.sep);
  let current=root;
  for(const part of parts){
    current=path.join(current,part);
    const info=statIfPresent(current);
    if(info?.isSymbolicLink())throw new Error('Runtime link or junction refused');
    if(current===destination&&info)throw new Error('Runtime must be new');
    if(info&&!info.isDirectory())throw new Error('Runtime parent is not a directory');
  }
  const physicalRoot=fs.realpathSync.native(root),physicalDestination=physicalPath(destination);
  if(!within(physicalRoot,physicalDestination))throw new Error('Physical runtime outside authorized root');
  return physicalDestination;
}
