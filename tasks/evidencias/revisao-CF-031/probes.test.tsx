import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import { beforeEach, expect, it, vi } from '../../../controle-financeiro-frontend/node_modules/vitest/dist/index.js';
import { parseReceipt, parseSession, parseSummary } from '../../../controle-financeiro-frontend/src/services/onboarding/result';
import { createElement } from '../../../controle-financeiro-frontend/node_modules/react/index.js';
import { render, act } from '../../../controle-financeiro-frontend/node_modules/@testing-library/react/dist/index.js';
import { BrowserTodayProvider } from '../../../controle-financeiro-frontend/src/contexts/browserTodayContext';
import { Modal } from '../../../controle-financeiro-frontend/src/components/ui/modal';

const e01 = JSON.parse(readFileSync('../tasks/evidencias/CF-028/examples.json', 'utf8'));
const bounds = JSON.parse(readFileSync('../tasks/evidencias/saneamento-CF-028-origem/snapshots.json', 'utf8'));
beforeEach(() => vi.stubGlobal('crypto', webcrypto));

it('control: original E01 receipt and completed session are readable', async () => {
  await expect(parseReceipt(e01.completeResponse.data)).resolves.toBeTruthy();
  const session = completed();
  await expect(parseSession(session)).resolves.toBeTruthy();
});
function completed() {
  const receipt = structuredClone(e01.completeResponse.data);
  return { ...structuredClone(e01.saveResponse.data), status: 'COMPLETED', version: String(BigInt(receipt.draftVersion) + 1n), pendingIntent: null, completedReceipt: receipt };
}
it('RC031-01: reload must reject an incoherent free-cash total (1300 - 350 = 950)', async () => {
  const session = completed();
  expect(session.completedReceipt.summary.metrics.accountsSigned.value).toBe('1300.00');
  expect(session.completedReceipt.summary.metrics.reservedAccounts.value).toBe('350.00');
  session.completedReceipt.summary.metrics.freeAccountCash.value = '999999.00';
  session.completedReceipt.summary.metrics.freeAccountCash.knownSubtotal = '999999.00';
  await expect(parseSession(session)).rejects.toThrow();
});
it('RC031-02: receipt reservation goal value must be an own field', async () => {
  const fixture = bounds.cases.find((c: any) => c.prepareResponse.data.summary.reservationReview?.reservations.some((r: any) => r.goal.state === 'KNOWN'));
  expect(fixture).toBeTruthy();
  const receipt = structuredClone(e01.completeResponse.data);
  receipt.summary = structuredClone(fixture.prepareResponse.data.summary);
  const r = receipt.summary.reservationReview.reservations.find((r: any) => r.goal.state === 'KNOWN');
  await expect(parseReceipt(receipt)).resolves.toBeTruthy();
  const value = r.goal.value; delete r.goal.value; Object.setPrototypeOf(r.goal, { value });
  expect(Object.hasOwn(r.goal, 'value')).toBe(false);
  await expect(parseReceipt(receipt)).rejects.toThrow();
});
it('RC031-02: reservation change must validate goal and attribution, not just nominal', () => {
  const summary = structuredClone(e01.completeResponse.data.summary);
  const id = '20000000-0000-4000-8000-000000000011';
  const nominal = { state: 'KNOWN', value: '0.00', knownSubtotal: '0.00', outsideIndividualRange: false, missingPaths: [] };
  summary.reservationChanges = [{ reservationId: id, action: 'CLOSE', previous: { reservationId: id, revision: '1', goal: null, nominal, attribution: null }, proposed: { reservationId: id, revision: '2', goal: null, nominal, attribution: null } }];
  expect(() => parseSummary(summary)).toThrow();
});
it.each(['focus', 'visibilitychange'])('diagnostic: calendar alone cleans its timer after %s', event => {
  vi.useFakeTimers();
  try {
    vi.setSystemTime(new Date('2026-09-08T02:59:59Z'));
    const view = render(createElement(BrowserTodayProvider, {children: createElement('span', null, 'calendar')}));
    act(() => { vi.setSystemTime(new Date('2026-09-09T03:05:00Z')); (event === 'focus' ? window : document).dispatchEvent(new Event(event)); });
    view.unmount();
    console.info('calendar-alone', event, 'pending', vi.getTimerCount());
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});
it('diagnostic: shared Modal animation schedules pending work after unmount under fake timers', () => {
  vi.useFakeTimers();
  try {
    const view = render(createElement(Modal, {isOpen:true,onClose:()=>{},title:'Diagnostic',children:createElement('button',null,'Action')}));
    view.unmount();
    const pending = vi.getTimerCount();
    act(() => vi.runOnlyPendingTimers());
    console.info('modal-alone', {pending, afterDrain:vi.getTimerCount()});
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  } finally { vi.useRealTimers(); }
});

