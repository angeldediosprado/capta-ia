import { Button } from '@/components/ui/button';
import { useProspecting } from '@/lib/prospecting-context';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/backend/client';
import { RefreshCw, LogOut } from 'lucide-react';
export function WorkspaceBar(){const s=useProspecting();const queryClient=useQueryClient();const navigate=useNavigate();async function signOut(){await queryClient.cancelQueries();queryClient.clear();await supabase.auth.signOut();await navigate({to:'/auth',replace:true});}return <div className="mb-5 flex flex-wrap items-center gap-3 border-b pb-3 text-xs">
 <div role="group" aria-label="Origen de datos" className="flex gap-1"><Button size="sm" variant={s.mode==='demo'?'default':'outline'} onClick={()=>s.setMode('demo')}>Datos de demostración</Button><Button size="sm" variant={s.mode==='real'?'default':'outline'} onClick={()=>s.setMode('real')}>Workspace real</Button></div>
 <span className="text-muted-foreground">{s.user?'Tus datos son privados':'Inicia sesión para guardar tus leads'}</span>
 {s.user?<><Button size="icon" variant="ghost" aria-label="Actualizar datos" disabled={s.busy} onClick={()=>void s.refresh().catch(()=>{})}><RefreshCw/></Button><Button size="icon" variant="ghost" aria-label="Cerrar sesión" onClick={()=>void signOut()}><LogOut/></Button></>:<Button variant="outline" size="sm" asChild><Link to="/auth">Entrar con correo</Link></Button>}
 {s.busy&&<span role="status">Guardando / consultando…</span>}{s.error&&<p role="alert" className="w-full text-destructive">{s.error} · No se han sustituido por datos sintéticos.</p>}
 </div>}
