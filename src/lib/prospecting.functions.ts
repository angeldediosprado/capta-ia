import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/lib/backend/auth-middleware';
import type { Json } from '@/integrations/supabase/types';
import { applySourceResult } from './prospecting/discovery';
import { workspaceSchema, icpSchema } from './prospecting/schemas';
import { emptyWorkspace } from './prospecting/types';
import { validateAttempt } from './prospecting/domain';
import { fetchDataSF } from './prospecting/sources.server';
import { prepareDrafts } from './prospecting/automation';
export const loadWorkspace=createServerFn({method:'GET'}).middleware([requireSupabaseAuth]).handler(async({context})=> {
 const {data,error}=await context.supabase.from('prospecting_workspaces').select('payload,revision').eq('user_id',context.userId).maybeSingle(); if(error) throw new Error('No se pudo leer el workspace');
 return {workspace:data ? workspaceSchema.parse(data.payload) : emptyWorkspace(),revision:data?.revision ?? 0};
});
export const saveWorkspace=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>z.object({workspace:workspaceSchema,revision:z.number().int().nonnegative()}).parse(input)).handler(async({data,context})=> {
 data.workspace.attempts.forEach(a=> {validateAttempt(a); if(a.providerConfirmed || a.status==='sent' || a.status==='delivered') throw new Error('Proveedor no conectado; solo registro manual'); const lead=data.workspace.leads.find(l=>l.id===a.leadId); if(!lead) throw new Error('Lead ausente'); if(!(a.channel==='phone'?lead.phone:a.channel==='email'?lead.email:lead.website))throw new Error('Sin canal público disponible');});
 data.workspace.responses.forEach(r=> {if(!data.workspace.attempts.some(a=>a.id===r.attemptId && a.leadId===r.leadId && a.status!=='failed' && a.date<=r.date)) throw new Error('Respuesta sin intento válido previo');});
 if(data.workspace.qualifications.some(q=>q.method==='dapta')) throw new Error('Dapta no conectado');
 const {data:revision,error}=await context.supabase.rpc('save_prospecting_workspace',{expected_revision:data.revision,new_payload:JSON.parse(JSON.stringify(data.workspace)) as Json}); if(error) throw new Error('No se guardó: conflicto o error de persistencia. Actualiza y reintenta.'); return {workspace:data.workspace,revision};
});
export const consultSources=createServerFn({method:'POST'}).middleware([requireSupabaseAuth]).inputValidator(input=>z.object({revision:z.number().int().nonnegative(),icp:icpSchema.optional(),draftTemplate:z.string().trim().min(1).max(10000).optional()}).parse(input)).handler(async({data,context})=> {
 const {data:row,error}=await context.supabase.from('prospecting_workspaces').select('payload,revision').eq('user_id',context.userId).maybeSingle(); if(error) throw new Error('No se pudo leer el workspace');
 if((row?.revision ?? 0)!==data.revision) throw new Error('Workspace actualizado en otra sesión; actualiza primero');
 const current=row ? workspaceSchema.parse(row.payload) : emptyWorkspace();
 if(data.icp)current.icp={...data.icp,provisional:true};
 const result=await fetchDataSF(current.icp);
 const processed=applySourceResult(current,result);
 const workspace=result.run.status==='success' && data.draftTemplate ? prepareDrafts(processed,data.draftTemplate) : processed;
 const {data:revision,error:saveError}=await context.supabase.rpc('save_prospecting_workspace',{expected_revision:data.revision,new_payload:JSON.parse(JSON.stringify(workspace)) as Json}); if(saveError) throw new Error('Consulta finalizada pero no guardada; actualiza antes de reintentar'); return {workspace,revision};
});
