import { createContext } from 'react';
import type { ICP, Workspace } from './prospecting/types';

export interface ProspectingActions {
  user: string | null;
  busy: boolean;
  error: string;
  refresh: () => Promise<void>;
  save: (workspace: Workspace) => Promise<void>;
  consult: (icp?: ICP, draftTemplate?: string, sources?: ('datasf' | 'openmap' | 'rnt' | 'pereira')[]) => Promise<Workspace>;
  setMode: (mode: 'demo' | 'real') => void;
}

// Keep context identity outside the hot-reloaded provider component module.
export const ProspectingContext = createContext<ProspectingActions | null>(null);