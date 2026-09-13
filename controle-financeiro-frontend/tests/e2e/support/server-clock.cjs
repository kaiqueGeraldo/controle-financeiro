// Preload exclusivo do processo Next dev criado pelo harness integrado.
// Nunca importado pelo produto, pelo build ou pelo comando de produção.
if (process.env.CF_E2E_SERVER_CLOCK !== "1" || process.env.NODE_ENV === "production" ||
    !/^http:\/\/127\.0\.0\.1:\d+$/.test(process.env.BACKEND_API_URL ?? "")) {
  throw new Error("Relógio E2E exige opt-in de teste e backend loopback; proibido em produção.");
}
const NativeDate = Date;
const authTime = NativeDate.parse(process.env.CF_E2E_AUTH_NOW ?? "");
if (!Number.isFinite(authTime)) throw new Error("CF_E2E_AUTH_NOW obrigatório e válido.");
globalThis.Date = new Proxy(NativeDate, {
  construct(target, args, newTarget) {
    return Reflect.construct(target, args.length ? args : [authTime], newTarget);
  },
  apply() { return new NativeDate(authTime).toString(); },
  get(target, property, receiver) {
    return property === "now" ? () => authTime : Reflect.get(target, property, receiver);
  },
});
