import { useSyncExternalStore } from 'react';
import { emptyWorkspace, type Workspace } from './prospecting/types';
let workspace=emptyWorkspace(); let mode:'demo'|'real'='demo'; let revision=0; let version=0;
const listeners=new Set<()=>void>();
export function setProspectingData(w:Workspace,r:number,m:'demo'|'real'=mode) {workspace=w;revision=r;mode=m;version++;listeners.forEach(l=>l());}
export const getProspectingData=()=>({workspace,revision,mode});
export const useDataRevision=()=>useSyncExternalStore(l=>{listeners.add(l);return()=>listeners.delete(l)},()=>version,()=>0);
