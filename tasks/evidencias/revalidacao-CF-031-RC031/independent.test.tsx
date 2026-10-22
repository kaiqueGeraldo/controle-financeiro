import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { parseSummary } from '../../../controle-financeiro-frontend/src/services/onboarding/result';
import { refKey } from '../../../controle-financeiro-frontend/src/services/onboarding/model';
import { parse } from '../../../controle-financeiro-frontend/src/services/vendor/lossless-json/parse';

const fixture = JSON.parse(readFileSync('../tasks/evidencias/CF-028/examples.json', 'utf8'));
const summary = () => structuredClone(fixture.completeResponse.data.summary);
const wire = (x: unknown) => parse(JSON.stringify(x), undefined, { parseNumber: raw => Number(raw) });
const id = '20000000-0000-4000-8000-000000000011';
const other = '20000000-0000-4000-8000-000000000099';
const amount = (value: string) => ({ state: 'KNOWN', value, knownSubtotal: value, outsideIndividualRange: false, missingPaths: [] });
function reservationCase() {
  const s = summary();
  const r = { reservationId: id, revision: '1', goal: { state: 'KNOWN', value: { ...s.byGoal[0].ref } }, nominal: amount('24.00'), attribution: { state: 'CONFIRMED', evidenceRefs: [other], parts: [
    { source: { ...s.bySource[0].ref }, amount: amount('12.00') },
    { source: { ...s.bySource[0].ref }, amount: amount('12.00') },
  ] } };
  s.reservationChanges = [{ reservationId: id, action: 'CLOSE', previous: r, proposed: { ...r, revision: '2', nominal: amount('0.00'), attribution: { state: 'CLOSED', evidenceRefs: [other] } } }];
  return s;
}
it('accepts the original receipt summary through the actual JSON reader', () => {
  expect(parseSummary(wire(summary())).metrics.freeAccountCash.value).toBe('950.00');
});
it.each(['source-only', 'missing', 'duplicate'])('rejects incoherent sources on the wire: %s', mode => {
  const s = summary();
  if (mode === 'source-only') s.bySource[0].free = amount('999999.00');
  if (mode === 'missing') s.bySource.shift();
  if (mode === 'duplicate') s.bySource.push(structuredClone(s.bySource[0]));
  expect(() => parseSummary(wire(s))).toThrow();
});
it('rejects duplicate confirmed source identities on the wire', () => {
  expect(() => parseSummary(wire(reservationCase()))).toThrow();
});
it('own __proto__ is data and cannot turn duplicate wire refs into distinct sources', () => {
  const s = reservationCase();
  Object.defineProperty(s.reservationChanges[0].previous.attribution.parts[1].source, '__proto__', { enumerable: true, value: { id: other } });
  const decoded = wire(s) as typeof s;
  const ref = decoded.reservationChanges[0].previous.attribution.parts[1].source;
  expect(Object.hasOwn(ref, '__proto__')).toBe(true);
  expect(Object.hasOwn(ref, 'id')).toBe(false);
  expect(ref.id).toBeUndefined();
  expect(() => parseSummary(decoded)).toThrow();
  expect(({} as { id?: string }).id).toBeUndefined();
});
it('allows extra own __proto__ data on a legitimate wire response without pollution', () => {
  const s = summary();
  Object.defineProperty(s.bySource[0].ref, '__proto__', { enumerable: true, value: { id: other } });
  const decoded = parseSummary(wire(s));
  expect(refKey(decoded.bySource[0].ref)).toBe(refKey(s.bySource[0].ref));
  expect(({} as { id?: string }).id).toBeUndefined();
});
it('must reject duplicate confirmed sources even when a second ref inherits an alternate id', () => {
  const s = reservationCase();
  const parts = s.reservationChanges[0].previous.attribution.parts;
  expect(parts[0].source.tempId).toBe(parts[1].source.tempId);
  Object.setPrototypeOf(parts[1].source, { id: other });
  expect(Object.hasOwn(parts[1].source, 'id')).toBe(false);
  expect(Object.hasOwn(parts[1].source, 'tempId')).toBe(true);
  // A reference's validated own identity must be the one used by uniqueness checks.
  expect(() => parseSummary(s)).toThrow();
});
it('must not let inherited alternate identity change the validated reference consumed by refKey', () => {
  const s = summary();
  Object.setPrototypeOf(s.bySource[0].ref, { id: other });
  expect(Object.hasOwn(s.bySource[0].ref, 'tempId')).toBe(true);
  // Reject or normalize; returning an unvalidated inherited id to consumers is invalid.
  let checked;
  try { checked = parseSummary(s); } catch { return; }
  expect(refKey(checked.bySource[0].ref)).toBe(`ACCOUNT:${s.bySource[0].ref.tempId}`);
});
