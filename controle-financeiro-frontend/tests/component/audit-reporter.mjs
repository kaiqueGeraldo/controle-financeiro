import fs from 'node:fs';
import path from 'node:path';

export default class ComponentAuditReporter {
  data={version:1,expectedFiles:[],collected:[],errors:[],completed:false};
  save(){fs.writeFileSync(process.env.CF_COMPONENT_AUDIT,JSON.stringify(this.data,null,2)+'\n');}
  onInit(ctx){this.root=ctx.config.root;this.data.context=JSON.parse(process.env.CF_COMPONENT_CONTEXT);this.save();}
  relative(file){return path.relative(this.root,file).split(path.sep).join('/');}
  onTestRunStart(specs){this.data.expectedFiles=specs.map(x=>this.relative(x.moduleId));this.save();}
  onTestModuleCollected(module){
    const cases=[...module.children.allTests()].map(t=>{const names=[t.name];let p=t.parent;while(p.type==='suite'){names.unshift(p.name);p=p.parent;}return names.join(' ');});
    const collected={file:this.relative(module.moduleId),cases};this.data.collected.push(collected);
    fs.appendFileSync(process.env.CF_COMPONENT_AUDIT+'.events.jsonl',JSON.stringify(collected)+'\n');
  }
  onTestRunEnd(modules,errors,reason){
    this.data.reason=reason;this.data.completed=true;this.data.reportedFiles=modules.map(x=>this.relative(x.moduleId));
    this.data.errors=errors.map(e=>({name:e.name,message:e.message,stack:e.stack}));this.save();
  }
}
