export function ryukFromLog(log){
 return new Map([...log.matchAll(/Container (testcontainers\/ryuk:[^\s]+) is starting: ([a-f0-9]{64})/g)].map(match=>[match[2],match[1]]));
}
export function ownsPreflightContainer(inspected,{run,session,baseline,ryuk}){
 if(baseline.some(id=>inspected.Id===id||inspected.Id.startsWith(id)))return false;
 const labels=inspected.Config.Labels??{};
 if(labels['cf.expanded.run']===run||labels['cf.review']===run||(session&&labels['org.testcontainers.sessionId']===session))return true;
 return ryuk.get(inspected.Id)===inspected.Config.Image&&labels['org.testcontainers']==='true';
}
