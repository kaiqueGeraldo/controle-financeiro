import {render} from '@testing-library/react';
import {StrictMode} from 'react';
import {expect, test, vi} from 'vitest';
import {OperationModal} from '@/components/forms/operationModal';

vi.mock('@/hooks/useUser', () => ({useUser: () => ({user: {id: 'cleanup-review'}})}));
vi.mock('@/contexts/toastContext', () => ({useToast: () => ({error: vi.fn()})}));
vi.mock('@/hooks/useFinanceData', () => ({useFinanceData: () => ({accounts: []})}));

test('RVR24 review: StrictMode and repeated visual cycles release both session subscriptions', () => {
  sessionStorage.clear();
  const transportListeners = new Set<EventListener>();
  class Transport {
    addEventListener(_type: string, listener: EventListener) { transportListeners.add(listener); }
    removeEventListener(_type: string, listener: EventListener) { transportListeners.delete(listener); }
  }
  vi.stubGlobal('BroadcastChannel', Transport);
  const added = vi.spyOn(window, 'addEventListener');
  const removed = vi.spyOn(window, 'removeEventListener');
  const asset = {id: 'A', ticker: 'A', name: 'A', type: 'OTHER' as const, quantity: 0, averagePrice: 0, currentPrice: 0};
  const callbacks = {onClose: vi.fn(), onSuccess: vi.fn()};
  for (let cycle = 0; cycle < 5; cycle++) {
    const view = render(<StrictMode><OperationModal isOpen asset={asset} {...callbacks}/></StrictMode>);
    expect(transportListeners.size).toBe(2);
    view.rerender(<StrictMode><OperationModal isOpen={false} asset={null} {...callbacks}/></StrictMode>);
    view.rerender(<StrictMode><OperationModal isOpen asset={{...asset, id: 'B'}} {...callbacks}/></StrictMode>);
    expect(transportListeners.size).toBe(2);
    view.unmount();
    expect(transportListeners.size).toBe(0);
  }
  const registrations = added.mock.calls.filter(([event]) => event === 'sessionExpired');
  const removals = removed.mock.calls.filter(([event]) => event === 'sessionExpired');
  expect(registrations.length).toBeGreaterThan(0);
  expect(removals.map(([, listener]) => listener)).toEqual(registrations.map(([, listener]) => listener));
  expect(callbacks.onClose).not.toHaveBeenCalled();
  expect(callbacks.onSuccess).not.toHaveBeenCalled();
});
