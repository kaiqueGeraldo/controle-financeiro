import {render, screen} from '@testing-library/react';
import {afterEach, expect, test, vi} from 'vitest';
import {PrivacyBlur} from '@/components/ui/privacyBlur';

const user = vi.hoisted(() => ({privacyMode: true}));
vi.mock('@/hooks/useUser', () => ({useUser: () => ({user})}));
afterEach(() => {user.privacyMode = true;});

test.each(['text-text-main text-3xl', 'text-blue-500', 'gap-2 items-center'])('RF15-02: proteção imediata, troca e liberação (%s)', className => {
  const view = (value: string) => <PrivacyBlur className={className}><span style={{color:'red'}}>{value}</span></PrivacyBlur>;
  const r = render(view('R$ 1.234,56'));
  expect(getComputedStyle(screen.getByText('R$ 1.234,56')).visibility).toBe('hidden');
  expect(screen.getByText('R$ 1.234,56').closest('[aria-hidden="true"]')).not.toBeNull();
  r.rerender(view('-R$ 125,45'));
  expect(getComputedStyle(screen.getByText('-R$ 125,45')).visibility).toBe('hidden');
  user.privacyMode = false; r.rerender(view('-R$ 125,45'));
  expect(getComputedStyle(screen.getByText('-R$ 125,45')).visibility).toBe('visible');
  expect(screen.getByText('-R$ 125,45').closest('[aria-hidden="true"]')).toBeNull();
  user.privacyMode = true; r.rerender(view('-R$ 125,45'));
  expect(getComputedStyle(screen.getByText('-R$ 125,45')).visibility).toBe('hidden');
});
