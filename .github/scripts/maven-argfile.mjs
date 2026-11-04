import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import { hash } from "./source.mjs";

let invocation = 0;
export function javaArgfileText(args) {
  return args.map(value => {
    assert.ok(!/[\r\n\0]/.test(value), "Invalid Java argument");
    return '"' + value.replaceAll("\\", "\\\\").replaceAll('"', '\\"') + '"';
  }).join("\n") + "\n";
}

// The Windows Java launcher decodes @files using native.encoding, before JVM file.encoding.
export function writeNativeArgfile(file, text) {
  const script = '[Console]::InputEncoding=[Text.UTF8Encoding]::new($false);$p=[Console]::In.ReadToEnd()|ConvertFrom-Json;$enc=[Text.Encoding]::GetEncoding([Text.Encoding]::Default.CodePage,[Text.EncoderFallback]::ExceptionFallback,[Text.DecoderFallback]::ExceptionFallback);$bytes=$enc.GetBytes($p.text);$s=[IO.File]::Open($p.file,[IO.FileMode]::CreateNew,[IO.FileAccess]::Write,[IO.FileShare]::None);try{$s.Write($bytes,0,$bytes.Length)}finally{$s.Dispose()};[Console]::Out.Write($enc.CodePage)';
  const input = JSON.stringify({file,text}).replace(/[\u007f-\uffff]/g, c => "\\u" + c.charCodeAt(0).toString(16).padStart(4,"0"));
  const result = spawnSync("powershell.exe", ["-NoProfile","-NonInteractive","-Command",script], {input,encoding:"utf8",windowsHide:true});
  assert.equal(result.status,0,"Native Java argument encoding failed: "+result.stderr);
  const codePage=Number(result.stdout.trim());assert.ok(codePage>0);return codePage;
}
/** Explicit local Windows option; fail closed for unreviewed JVM/RC configuration. */
export function javaArgfileInvocation(platform, args) {
  assert.equal(platform, "win32");
  const runtime = fs.realpathSync.native(process.env.CF_MAVEN_ARGFILE_ROOT);
  const backend = fs.realpathSync.native(process.env.CF_MAVEN_BACKEND);
  const home = fs.realpathSync.native(process.env.CF_MAVEN_HOME);
  const jdk = fs.realpathSync.native(process.env.JAVA_HOME);
  assert.equal(process.env.MAVEN_ARGS, "--offline");
  assert.match(fs.readFileSync(path.join(backend, ".mvn/wrapper/maven-wrapper.properties"), "utf8"), /apache-maven-3\.9\.12-bin/);
  assert.match(home, /apache-maven-3\.9\.12/);
  for (const key of ["MAVEN_OPTS", "MAVEN_DEBUG_OPTS", "INTERNAL_MAVEN_OPTS", "JAVA_TOOL_OPTIONS", "JDK_JAVA_OPTIONS"])
    assert.ok(!process.env[key], key + " requires explicit equivalence review");
  for (const name of ["jvm.config", "maven.config"])
    assert.equal(fs.existsSync(path.join(backend, ".mvn", name)), false);
  for (const name of ["mavenrc_pre.bat", "mavenrc_pre.cmd", "mavenrc_post.bat", "mavenrc_post.cmd"])
    assert.equal(fs.existsSync(path.join(process.env.USERPROFILE, name)), false);

  const boot = fs.readdirSync(path.join(home, "boot")).filter(f => /^plexus-classworlds-.*\.jar$/.test(f));
  assert.equal(boot.length, 1);
  const classpath = path.join(home, "boot", boot[0]);
  const effective = [
    "--enable-native-access=ALL-UNNAMED", "-classpath", classpath,
    "-Dclassworlds.conf=" + path.join(home, "bin/m2.conf"), "-Dmaven.home=" + home,
    "-Dlibrary.jansi.path=" + path.join(home, "lib/jansi-native"),
    "-Dmaven.multiModuleProjectDirectory=" + backend,
    "org.codehaus.plexus.classworlds.launcher.Launcher", "--offline", "--batch-mode", ...args,
  ];
  const directory = path.join(runtime, "maven-args");
  fs.mkdirSync(directory, { recursive: true });
  const name = "maven-" + String(++invocation).padStart(2, "0");
  const file = path.join(directory, name + ".args");
  const nativeCodePage=writeNativeArgfile(file,javaArgfileText(effective));
  fs.writeFileSync(path.join(directory, name + ".json"), JSON.stringify({
    originalMavenArgs: args, effectiveJavaArgs: effective, nativeCodePage, strictEncoding:true, argfileSha256: hash(fs.readFileSync(file)),
    java: path.join(jdk, "bin/java.exe"), backend, mavenHome: home,
    classpath: { file: classpath, sha256: hash(fs.readFileSync(classpath)) },
    m2ConfSha256: hash(fs.readFileSync(path.join(home, "bin/m2.conf"))),
    origin: "Maven3.9.12 mvn.cmd launch structure; unchanged Maven arguments; JDK21 argfile avoids CMD limit",
  }, null, 2) + "\n", { flag: "wx" });
  return { executable: path.join(jdk, "bin/java.exe"), args: ["@" + file] };
}
