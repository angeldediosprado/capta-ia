import { Button } from '@/components/ui/button';
import { useProspecting } from '@/lib/prospecting-context';
import { useState } from 'react';
import { supabase } from '@/lib/backend/client';
import { RefreshCw, LogOut } from 'lucide-react';
export function WorkspaceBar(){const s=useProspecting();const [loginError,setLoginError]=useState('');const [loggingIn,setLoggingIn]=useState(false);
 async function signIn(){setLoginError('');setLoggingIn(true);try{const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin}});if(error)throw error;}catch(e){setLoginError(e instanceof Error?e.message:'No se pudo iniciar sesión');setLoggingIn(false);}}
 return <div className="mb-5 flex flex-wrap items-center gap-3 border-b pb-3 text-xs">
 <div role="group" aria-label="Origen de datos" className="flex gap-1"><Button size="sm" variant={s.mode==='demo'?'default':'outline'} onClick={()=>s.setMode('demo')}>Datos de demostración</Button><Button size="sm" variant={s.mode==='real'?'default':'outline'} onClick={()=>s.setMode('real')}>Workspace real</Button></div>
 <span className="text-muted-foreground">{s.user?'Datos privados guardados':'Inicia sesión para guardar datos reales'}</span>
 {s.user?<><Button size="icon" variant="ghost" aria-label="Actualizar datos" disabled={s.busy} onClick={()=>void s.refresh().catch(()=>{})}><RefreshCw/></Button><Button size="icon" variant="ghost" aria-label="Cerrar sesión" onClick={()=>void supabase.auth.signOut()}><LogOut/></Button></>:<Button variant="outline" size="sm" disabled={loggingIn} onClick={()=>void signIn()}>{loggingIn?'Abriendo acceso…':'Entrar con Google'}</Button>}
 {loginError&&<p role="alert" className="w-full text-destructive">{loginError}</p>}
 {s.busy&&<span role="status">Guardando / consultando…</span>}{s.error&&<p role="alert" className="w-full text-destructive">{s.error} · No se han sustituido por datos sintéticos.</p>}
 </div>}
