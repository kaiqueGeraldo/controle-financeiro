import fs from "node:fs";
import path from "node:path";
const epoch = Date.now.bind(Date);
function identity(test) {
  const names = [test.name]; let parent = test.parent;
  while (parent && parent.type === "suite") { names.unshift(parent.name); parent = parent.parent; }
  return [path.relative(test.module.project.config.root, test.module.moduleId).split(path.sep).join("/"), names.join(" ")];
}
export default class ObserverReporter {
  collected = []; events = []; active = new Map(); completed = [];
  modules = []; pendingWrites = [];
  onInit(ctx) {
    this.out = process.env.CF_OBS_OUT;
    fs.mkdirSync(this.out, { recursive: true });
    this.config = { node: process.version, pid: process.pid, testTimeout: ctx.config.testTimeout, hookTimeout: ctx.config.hookTimeout, pool: ctx.config.pool, isolate: ctx.config.isolate, maxWorkers: ctx.config.maxWorkers ?? null, fileParallelism: ctx.config.fileParallelism ?? null, sequence: ctx.config.sequence };
    this.timer = setInterval(() => {
      const line = JSON.stringify({ at: epoch(), active: [...this.active.values()] }) + "\n";
      this.pendingWrites.push(fs.promises.appendFile(path.join(this.out, "active.jsonl"), line));
    }, 2000);
    this.timer.unref();
  }
  onTestRunStart(specs) { this.started = epoch(); this.specFiles = specs.map(spec => spec.moduleId); }
  onTestModuleCollected(module) {
    for (const test of module.children.allTests()) this.collected.push({ id: test.id, identity: identity(test) });
  }
  onTestModuleStart(module) { this.modules.push({ event: "start", id: module.id, file: module.moduleId, at: epoch() }); }
  onTestModuleEnd(module) { this.modules.push({ event: "end", id: module.id, file: module.moduleId, at: epoch() }); }
  onTestCaseReady(test) {
    const event = { event: "start", id: test.id, identity: identity(test), at: epoch() };
    this.events.push(event); this.active.set(test.id, event);
  }
  onTestCaseResult(test) {
    const event = { event: "end", id: test.id, identity: identity(test), at: epoch() };
    this.events.push(event); this.active.delete(test.id);
    this.completed.push({ id: test.id, identity: event.identity, result: test.result(), diagnostic: test.diagnostic(), observation: test.meta().cfObserve ?? null });
  }
  async onTestRunEnd(modules, errors, reason) {
    clearInterval(this.timer);
    await Promise.all(this.pendingWrites);
    fs.writeFileSync(path.join(this.out, "observer.json"), JSON.stringify({
      version: 1, started: this.started, finished: epoch(), config: this.config,
      specFiles: this.specFiles, collected: this.collected, events: this.events,
      completed: this.completed, moduleEvents: this.modules, remainingActive: [...this.active.values()],
      errors: errors.map(error => ({ name: error.name, message: error.message, stack: error.stack })), reason
    }, null, 2) + "\n", { flag: "wx" });
  }
}
