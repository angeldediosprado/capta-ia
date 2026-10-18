import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProspectingContext, type ProspectingActions } from '../prospecting-context-state';
import { useProspecting } from '../prospecting-context';

vi.mock('@tanstack/react-start', () => ({ useServerFn: vi.fn() }));
vi.mock('@/lib/backend/client', () => ({ supabase: {} }));
vi.mock('../prospecting.functions', () => ({ loadWorkspace: vi.fn(), saveWorkspace: vi.fn(), consultSources: vi.fn() }));

const actions: ProspectingActions = {
  user: 'operator', busy: false, error: '', refresh: vi.fn(), save: vi.fn(),
  consult: vi.fn(), setMode: vi.fn(),
};
function Consumer() { const session = useProspecting(); return <span>{session.user}</span>; }
afterEach(cleanup);
describe('shared prospecting context', () => {
  it('reads the independently owned context used by the provider', () => {
    const view = render(<ProspectingContext.Provider value={actions}><Consumer /></ProspectingContext.Provider>);
    expect(screen.getByText('operator')).toBeDefined();
    view.rerender(<ProspectingContext.Provider value={{ ...actions, user: 'updated operator' }}><Consumer /></ProspectingContext.Provider>);
    expect(screen.getByText('updated operator')).toBeDefined();
  });
});