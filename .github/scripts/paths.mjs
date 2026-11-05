import fs from 'node:fs';
import path from 'node:path';

// Resolve existing aliases (including Windows SUBST) before appending new outputs.
export function physicalPath(value){
  const absolute=path.resolve(value);
  let existing=absolute;
  while(!fs.existsSync(existing)){
    const parent=path.dirname(existing);
    if(parent===existing)throw new Error('No existing path ancestor');
    existing=parent;
  }
  return path.join(fs.realpathSync.native(existing),path.relative(existing,absolute));
}
