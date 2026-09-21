// Mounted financial providers contribute their reads to one reconciliation.
// Dispatching a fire-and-forget refresh event cannot certify completion.
const eventName = "reconcileFinancialViews";
type ReadBatch = CustomEvent<Promise<unknown>[]>;

export function onFinancialReconciliation(read: () => Promise<unknown>) {
  const listener = (event: Event) => {
    (event as ReadBatch).detail.push(Promise.resolve().then(read));
  };
  window.addEventListener(eventName, listener);
  return () => window.removeEventListener(eventName, listener);
}

export async function reconcileFinancialViews() {
  const reads: Promise<unknown>[] = [];
  window.dispatchEvent(new CustomEvent(eventName, { detail: reads }));
  await completeReads(reads);
}

export async function completeReads(reads: Promise<unknown>[]) {
  const results = await Promise.allSettled(reads);
  const failure = results.find(result => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
}
