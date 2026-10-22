import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '../../../controle-financeiro-frontend/node_modules/@testing-library/react/dist/index.js';
import { createElement } from '../../../controle-financeiro-frontend/node_modules/react/index.js';
import { expect, it, vi } from 'vitest';
import { RefField, availableRefs } from '../../../controle-financeiro-frontend/src/screens/private/onboarding/Fields';
import { check, refRule } from '../../../controle-financeiro-frontend/src/services/onboarding/input';
import { canonicalString } from '../../../controle-financeiro-frontend/src/services/onboarding/result';
import { refKey } from '../../../controle-financeiro-frontend/src/services/onboarding/model';
vi.mock('@/hooks/useUser', () => ({ useUser: () => ({ user: { privacyMode: false }, isLoading: false }) }));
const fixture = JSON.parse(readFileSync('../tasks/evidencias/CF-028/examples.json', 'utf8'));
const a = '20000000-0000-4000-8000-000000000001';
const b = '20000000-0000-4000-8000-000000000002';
it('persistent writes require own id and never inherit it from a temporary ref', () => {
  const temp = { kind: 'ACCOUNT', tempId: a }; Object.setPrototypeOf(temp, { id: b });
  expect(check(refRule('ACCOUNT', true), temp)).not.toHaveLength(0);
  const persistent = { kind: 'ACCOUNT', id: b }; Object.setPrototypeOf(persistent, { tempId: a });
  expect(check(refRule('ACCOUNT', true), persistent)).toHaveLength(0);
  expect(refKey(persistent as { kind: 'ACCOUNT'; id: string })).toBe(`ACCOUNT:${b}`);
});
it('selection emits the own source reference and not the inherited alternate', () => {
  const draft = structuredClone(fixture.draft.payload);
  const tempId = draft.sections.accounts.items[0].tempId;
  const value = { kind: 'ACCOUNT', tempId }; Object.setPrototypeOf(value, { id: b });
  const changed = vi.fn();
  render(createElement(RefField, { label: 'Fonte independente', path: '/source', value, onChange: changed, issues: [], choices: [], draft, kinds: ['ACCOUNT'] }));
  const select = screen.getByRole('combobox', { name: 'Fonte independente' });
  expect((select as HTMLSelectElement).value).toBe(`ACCOUNT:${tempId}`);
  fireEvent.change(select, { target: { value: `ACCOUNT:${tempId}` } });
  expect(changed).toHaveBeenCalledWith({ kind: 'ACCOUNT', tempId });
  expect(Object.hasOwn(changed.mock.calls[0][0], 'id')).toBe(false);
});
it('monetary LINK options retain the correct persisted label and exclude its alias', () => {
  const draft = structuredClone(fixture.draft.payload);
  const ref = { kind: 'GOAL', id: a }; Object.setPrototypeOf(ref, { tempId: b });
  draft.sections.goals.items = [{ tempId: b, action: 'LINK', ref }];
  const choices = [{ kind: 'GOAL' as const, id: a, label: 'Meta vinculada correta', type: 'MONETARY' as const }];
  expect(availableRefs({ draft, choices }, ['GOAL'], true)).toEqual([{ ref: { kind: 'GOAL', tempId: b }, label: 'Meta vinculada correta' }]);
});
it('null-prototype references and mixed persisted kinds preserve canonical order and identities', () => {
  const account = Object.assign(Object.create(null), { kind: 'ACCOUNT', id: a });
  const investment = { kind: 'INVESTMENT', id: a };
  Object.setPrototypeOf(investment, { tempId: b });
  expect(check(refRule('ACCOUNT'), account)).toHaveLength(0);
  expect(refKey(account)).toBe(`ACCOUNT:${a}`);
  expect(refKey(investment as { kind: 'INVESTMENT'; id: string })).toBe(`INVESTMENT:${a}`);
  expect(canonicalString([{ source: investment }, { source: account }])).toBe(canonicalString([{ source: { kind: 'ACCOUNT', id: a } }, { source: { kind: 'INVESTMENT', id: a } }]));
});
