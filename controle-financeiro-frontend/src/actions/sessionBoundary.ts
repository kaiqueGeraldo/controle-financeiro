"use client";

type SessionChange = "login" | "logout";
let channel: BroadcastChannel | undefined;

function sessionChannel() {
  if (typeof BroadcastChannel === "undefined") return undefined;
  return (channel ??= new BroadcastChannel("cf-auth-session"));
}

/** Only an invalidation signal crosses tabs; no identity, token or financial payload. */
export function publishSessionChange(change: SessionChange) {
  sessionChannel()?.postMessage(change);
}

export function subscribeToSessionChange(onChange: (change: SessionChange) => void) {
  const transport = sessionChannel();
  const receive = (event: MessageEvent<unknown>) => {
    if (event.data === "login" || event.data === "logout") onChange(event.data);
  };
  transport?.addEventListener("message", receive);
  return () => transport?.removeEventListener("message", receive);
}
