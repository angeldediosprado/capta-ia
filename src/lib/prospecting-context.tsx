import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/lib/backend/client';
import { loadWorkspace, saveWorkspace, consultSources } from './prospecting.functions';
import { getProspectingData, setProspectingData, useDataRevision, emptyWorkspace, type Workspace, type ICP } from './data-service';
interface Actions { user:string|null; busy:boolean; error:string; refresh:()=>Promise<void>; save:(w:Workspace)=>Promise<void>; consult:(icp?:ICP,draftTemplate?:string)=>Promise<Workspace>; setMode:(m:'demo'|'real')=>void }
const Context=createContext<Actions|null>(null);
export function ProspectingProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=useServerFn(loadWorkspace),saveFn=useServerFn(saveWorkspace),consultFn=useServerFn(consultSources);
 async function perform(fn:()=>Promise<void>){setBusy(true);setError('');try{await fn();}catch(e){const message=e instanceof Error?e.message:'Error de conexión';setError(message);throw e;}finally{setBusy(false);}}
 async function refresh(){await perform(async()=>{const r=await load();setProspectingData(r.workspace,r.revision);});}
 async function save(w:Workspace){await perform(async()=>{const current=getProspectingData();const r=await saveFn({data:{workspace:w,revision:current.revision}});sessionStorage.setItem('capta-data-mode','real');setProspectingData(r.workspace,r.revision,'real');});}
 async function consult(icp?:ICP,draftTemplate?:string){let result:Workspace|undefined;await perform(async()=>{const r=await consultFn({data:{revision:getProspectingData().revision,icp,draftTemplate}});sessionStorage.setItem('capta-data-mode','real');setProspectingData(r.workspace,r.revision,'real');result=r.workspace;});if(!result)throw new Error('No se recibió el resultado');return result;}
 useEffect(()=>{
  let disposed=false;
  const apply=(email:string|null)=>{if(disposed)return;setUser(email);if(email)void load().then(r=>{if(!disposed)setProspectingData(r.workspace,r.revision);}).catch(()=>{if(!disposed)setError('No se pudieron cargar los datos guardados');});else setProspectingData(emptyWorkspace(),0,'demo');};
  const selectedMode=sessionStorage.getItem('capta-data-mode');
  if(selectedMode==='real'||selectedMode==='demo'){const current=getProspectingData();setProspectingData(current.workspace,current.revision,selectedMode);}
  void supabase.auth.getSession().then(({data})=>apply(data.session?.user.email??null));
  const {data}=supabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='USER_UPDATED')setTimeout(()=>apply(session?.user.email??null),0);});
  return()=>{disposed=true;data.subscription.unsubscribe();};
 },[load]);
 return <Context.Provider value={{user,busy,error,refresh,save,consult,setMode:m=>{sessionStorage.setItem('capta-data-mode',m);const s=getProspectingData();setProspectingData(s.workspace,s.revision,m);}}}>{children}</Context.Provider>;
}
export function useProspecting(){useDataRevision();const c=useContext(Context);if(!c)throw new Error('ProspectingProvider ausente');return {...c,...getProspectingData()};}
