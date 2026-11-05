import { beforeEach, afterEach } from "vitest";
const clock = process.hrtime.bigint;
const epoch = Date.now.bind(Date);
const key = Symbol.for("cf.component.observer");
const starts = new Map();
let current;
globalThis[key] = {
  mark(name) {
    if (!current?.historical) return;
    const begin = clock();
    current.stages.push({ name, elapsedMs: Number(begin - starts.get(current.id)) / 1e6, epochMs: epoch() });
    current.markCostNs += Number(clock() - begin);
  }
};
beforeEach((context) => {
  const begin = clock(), task = context.task;
  const names = [task.name];
  let parent = task.suite;
  while (parent && parent.type !== "file") { names.unshift(parent.name); parent = parent.suite; }
  const name = names.join(" ");
  current = {
    id: task.id, name, pid: process.pid,
    workerEnv: process.env.VITEST_WORKER_ID ?? null,
    startedEpochMs: epoch(), stages: [], markCostNs: 0,
    historical: name.includes("lista longa mantém") || name.includes("compares conflict snapshots")
  };
  starts.set(task.id, begin);
  task.meta.cfObserve = current;
  current.beforeHookCostNs = Number(clock() - begin);
});
afterEach((context) => {
  const begin = clock(), record = context.task.meta.cfObserve;
  if (!record) return;
  record.finishedEpochMs = epoch();
  record.elapsedIncludingHooksMs = Number(begin - starts.get(record.id)) / 1e6;
  if (record.historical) record.stages.push({ name: "cleanup-complete", elapsedMs: record.elapsedIncludingHooksMs, epochMs: record.finishedEpochMs });
  record.afterHookCostNs = Number(clock() - begin);
  starts.delete(record.id);
  current = undefined;
});
