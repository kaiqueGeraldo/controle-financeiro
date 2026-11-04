import fs from "node:fs";
import { createElement, Profiler, type ReactElement } from "react";
import { render as baseRender } from "@testing-library/react";
import { vi } from "vitest";
const clock = process.hrtime.bigint;
const cpu = process.cpuUsage.bind(process);
const out = "/work/diag/traces";
fs.mkdirSync(out, { recursive: true });
let active: any = null;
let sequence = 0;
const elapsed = (started: bigint) => Number(clock() - started) / 1e6;
function event(kind: string, name: string, extra: object = {}) {
  if (active) active.events.push({ kind, name, atMs: elapsed(active.started), ...extra });
}
function installCosts() {
  const restores: (() => void)[] = [];
  const wrap = (owner: any, key: string, label: string) => {
    const original = owner[key];
    owner[key] = function (...args: any[]) {
      const start = clock();
      try { return original.apply(this, args); }
      finally { if (active) { const cost = active.costs[label] ??= { calls: 0, ms: 0 }; cost.calls++; cost.ms += elapsed(start); } }
    };
    restores.push(() => { owner[key] = original; });
  };
  wrap(Date.prototype, "toLocaleDateString", "Date.toLocaleDateString");
  wrap(Number.prototype, "toLocaleString", "Number.toLocaleString");
  const original = window.getComputedStyle;
  const globalOriginal = globalThis.getComputedStyle;
  const wrapped = function (...args: any[]) {
    const start = clock();
    try { return original.apply(window, args as any); }
    finally { if (active) { const cost = active.costs.getComputedStyle ??= { calls: 0, ms: 0 }; cost.calls++; cost.ms += elapsed(start); } }
  };
  window.getComputedStyle = wrapped as typeof original;
  globalThis.getComputedStyle = wrapped as typeof original;
  restores.push(() => { window.getComputedStyle = original; globalThis.getComputedStyle = globalOriginal; });
  return () => { for (const restore of restores.reverse()) restore(); };
}
export function beginTrace(name: string) {
  if (!name.includes("lista longa mantém") && !name.includes("compares conflict snapshots")) return;
  active = { name, run: process.env.CF_DIAG_RUN, pid: process.pid, worker: process.env.VITEST_WORKER_ID, pool: process.env.VITEST_POOL_ID, started: clock(), initialCpu: cpu(), events: [], costs: {}, render: { commits: 0, actualMs: 0 }, pending: [], sequence: sequence++ };
  active.restore = installCosts();
  event("begin", "preparation");
}
export function markTrace(name: string, extra: object = {}) { event("mark", name, extra); }
export function step<T>(name: string, fn: () => T): T {
  if (!active) return fn();
  const context = active, start = clock(), startCpu = cpu();
  event("start", name); context.pending.push(name);
  try { return fn(); }
  finally { const used = cpu(startCpu); event("end", name, { wallMs: elapsed(start), cpuMs: (used.user + used.system) / 1000 }); context.pending = context.pending.filter((n: string) => n !== name); }
}
export async function asyncStep<T>(name: string, fn: () => Promise<T>): Promise<T> {
  if (!active) return fn();
  const context = active, start = clock(), startCpu = cpu();
  event("start", name); context.pending.push(name);
  try { return await fn(); }
  finally { const used = cpu(startCpu); event("end", name, { wallMs: elapsed(start), cpuMs: (used.user + used.system) / 1000 }); context.pending = context.pending.filter((n: string) => n !== name); }
}
export function diagnosticRender(ui: ReactElement) {
  if (!active) return baseRender(ui);
  return step("render", () => baseRender(createElement(Profiler, { id: "diagnostic", onRender: (_id, phase, actualMs) => {
    if (active) { active.render.commits++; active.render.actualMs += actualMs; event("render", phase, { actualMs }); }
  } }, ui)));
}
export function flushTrace() {
  if (!active) return;
  const context = active;
  event("mark", "after-cleanup", { nodesRemaining: document.body.querySelectorAll("*").length, fakeTimers: vi.isFakeTimers(), pendingTimers: vi.isFakeTimers() ? vi.getTimerCount() : null });
  const used = cpu(context.initialCpu);
  const record = { ...context, started: undefined, initialCpu: undefined, restore: undefined, totalWallMs: elapsed(context.started), totalCpuMs: (used.user + used.system) / 1000 };
  context.restore();
  fs.writeFileSync(out + "/" + context.run + "-" + process.pid + "-" + context.sequence + ".json", JSON.stringify(record, null, 2) + "\n");
  active = null;
}
