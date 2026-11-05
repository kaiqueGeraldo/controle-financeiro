import fs from "node:fs";import path from "node:path";import assert from "node:assert/strict";import {hash} from "../../../.github/scripts/source.mjs";
let count=0;
export function javaArgfileInvocation(platform,args) {
 assert.equal(platform,"win32");const runtime=fs.realpathSync.native(process.env.CF_ARGFILE_RUNTIME),back=fs.realpathSync.native(process.env.CF_ARGFILE_BACKEND),home=fs.realpathSync.native(process.env.CF_ARGFILE_MAVEN_HOME),jdk=fs.realpathSync.native(process.env.JAVA_HOME);
 assert.equal(process.env.MAVEN_ARGS,"--offline");
 for(const key of ["MAVEN_OPTS","MAVEN_DEBUG_OPTS","INTERNAL_MAVEN_OPTS","JAVA_TOOL_OPTIONS","JDK_JAVA_OPTIONS"])assert.ok(!process.env[key],key+" requires explicit equivalence review");
 for(const name of ["jvm.config","maven.config"])assert.equal(fs.existsSync(path.join(back,".mvn",name)),false);
 for(const name of ["mavenrc_pre.bat","mavenrc_pre.cmd","mavenrc_post.bat","mavenrc_post.cmd"])assert.equal(fs.existsSync(path.join(process.env.USERPROFILE,name)),false);
 const boot=fs.readdirSync(path.join(home,"boot")).filter(f=>/^plexus-classworlds-.*\.jar$/.test(f));assert.equal(boot.length,1);
 const jvm=["--enable-native-access=ALL-UNNAMED","-classpath",path.join(home,"boot",boot[0]),"-Dclassworlds.conf="+path.join(home,"bin/m2.conf"),"-Dmaven.home="+home,"-Dlibrary.jansi.path="+path.join(home,"lib/jansi-native"),"-Dmaven.multiModuleProjectDirectory="+back,"org.codehaus.plexus.classworlds.launcher.Launcher","--offline","--batch-mode",...args];
 const quote=value=>{assert.ok(!/[\r\n\0]/.test(value));return '"'+value.replaceAll("\\","\\\\").replaceAll('"','\\"')+'"';};
 const dir=path.join(runtime,"a1");fs.mkdirSync(dir,{recursive:true});const name="maven-"+String(++count).padStart(2,"0"),file=path.join(dir,name+".args");
 fs.writeFileSync(file,jvm.map(quote).join("\n")+"\n",{flag:"wx"});
 fs.writeFileSync(path.join(dir,name+".json"),JSON.stringify({at:new Date().toISOString(),java:path.join(jdk,"bin/java.exe"),mavenHome:home,backend:back,originalMavenArgs:args,effectiveJavaArgs:jvm,argfileSha256:hash(fs.readFileSync(file)),classpathJar:{file:path.join(home,"boot",boot[0]),sha256:hash(fs.readFileSync(path.join(home,"boot",boot[0])))},m2ConfSha256:hash(fs.readFileSync(path.join(home,"bin/m2.conf"))),origin:"Exact launch structure from installed Maven3.9.12/bin/mvn.cmd; enable-native-access supported by approved JDK21; file avoids CMD argument limit"},null,2)+"\n",{flag:"wx"});
 return {executable:path.join(jdk,"bin/java.exe"),args:["@"+file]};
}
