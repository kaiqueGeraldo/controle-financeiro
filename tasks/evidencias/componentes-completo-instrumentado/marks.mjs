export function mark(name) {
  globalThis[Symbol.for("cf.component.observer")]?.mark(name);
}
