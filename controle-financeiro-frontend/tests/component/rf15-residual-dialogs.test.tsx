import {act, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {useState} from 'react';
import {expect, test, vi} from 'vitest';
import {HabitDetails} from '@/components/screens/habits/habitDetails';
import {BrowserTodayProvider} from '@/contexts/browserTodayContext';
import type {Habit} from '@/types';

vi.mock('@/hooks/useUser', () => ({useUser: () => ({user:{privacyMode:false}})}));
const habit: Habit = {id:'h',name:'Hábito original',description:'Descrição original',frequency:'DAILY',icon:'Flame',color:'BLUE',currentStreak:0,highestStreak:0,logs:[],orderIndex:0,createdAt:'2027-01-15T12:00:00Z'};

test('CF014: dois Escape consecutivos cancelam rascunho e fecham sem callback obsoleto', async () => {
  function View() {
    const [open,setOpen] = useState(false);
    return <BrowserTodayProvider><button onClick={() => setOpen(true)}>Abrir</button>
      {open && <HabitDetails isOpen habit={habit} onClose={() => setOpen(false)} onUpdate={async () => {}} onDelete={() => {}}/>}
    </BrowserTodayProvider>;
  }
  render(<View/>);
  const opener = screen.getByRole('button',{name:'Abrir'});
  opener.focus(); fireEvent.click(opener);
  fireEvent.click(screen.getByRole('button',{name:'Editar Hábito'}));
  fireEvent.change(screen.getAllByRole('textbox')[0],{target:{value:'Rascunho descartado'}});
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(document.activeElement).toBe(opener);
});

test('CF014: Escape durante gravação não descarta nem fecha', async () => {
  let finish!: () => void;
  const update = vi.fn(() => new Promise<void>(resolve => {finish=resolve;}));
  const close = vi.fn();
  render(<BrowserTodayProvider><HabitDetails isOpen habit={habit} onClose={close} onUpdate={update} onDelete={() => {}}/></BrowserTodayProvider>);
  fireEvent.click(screen.getByRole('button',{name:'Editar Hábito'}));
  fireEvent.submit(screen.getByRole('dialog'));
  fireEvent.keyDown(document,{key:'Escape'});
  expect(close).not.toHaveBeenCalled();
  expect(update).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('textbox')).toHaveLength(2);
  await act(async () => {finish();});
  expect(screen.getByRole('button',{name:'Editar Hábito'})).toBeDefined();
});
