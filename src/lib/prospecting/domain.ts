import type { Lead, ICP, ICPEvaluation, CostRecord, ContactAttempt, Workspace, SourceId, Channel } from './types';
export const normalize = (s = '') => s.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const validLead = (l: Lead) => !!l.name.trim() && !!l.address?.trim() && !l.review;
export function evaluateICP(l: Lead, icp: ICP): ICPEvaluation {
 const checks: { result: boolean | undefined; reason: string }[] = [
  { result: l.city ? normalize(l.city) === normalize(icp.city) : undefined, reason: `Ciudad: ${l.city ?? 'ausente'}; requerida: ${icp.city}` },
  { result: l.naics || l.classifications.length ? icp.naics.split(',').map(c=>c.trim()).includes(l.naics ?? '') || l.classifications.some(c => icp.classifications.includes(c)) : undefined, reason: `Actividad: ${l.naics ?? (l.classifications.join(', ') || 'ausente')}; NAICS ${icp.naics} o ${icp.classifications.join(', ')}` },
 ];
 if (icp.requireActive) checks.push({ result: l.active, reason: `Activo: ${l.active === undefined ? 'desconocido' : l.active ? 'sí' : 'no'}` });
 if (icp.businessType && icp.requireBusinessType) checks.push({result:undefined,reason:`Tipo de empresa: ${icp.businessType}; no informado por las fuentes conectadas`});
 return { status: checks.some(c => c.result === false) ? 'no-match' : checks.some(c => c.result === undefined) ? 'insufficient' : 'match', reasons: checks.map(c => `${c.result === undefined ? 'Información insuficiente' : c.result ? 'Coincide' : 'No coincide'} · ${c.reason}`) };
}
function strongConflict(a: Lead, b: Lead) { return !!((a.licenseNumber && b.licenseNumber && a.licenseNumber !== b.licenseNumber) || (a.accountId && b.accountId && a.accountId !== b.accountId)); }
export function deduplicate(existing: Lead[], incoming: Lead[]) {
 const leads = existing.map(l => ({ ...l, provenance: [...l.provenance] })); let merged = 0, review = 0, newUnique = 0;
 for (const row of incoming) {
  const strong = leads.filter(l => (row.licenseNumber && l.licenseNumber === row.licenseNumber) || (row.accountId && l.accountId === row.accountId));
  const exact = leads.filter(l => normalize(l.name) === normalize(row.name) && !!normalize(row.address) && normalize(l.address) === normalize(row.address));
  const candidates = strong.length ? strong : exact;
  const target = candidates.length === 1 ? candidates[0] : undefined;
  if (target && !strongConflict(target, row)) {
   target.provenance.push(...row.provenance.filter(p => !target.provenance.some(t => t.runId === p.runId && t.recordId === p.recordId)));
   for (const key of ['phone', 'email', 'website', 'licenseNumber', 'accountId', 'city', 'address', 'naics', 'active'] as const) if (target[key] === undefined && row[key] !== undefined) Object.assign(target, { [key]: row[key] });
   target.classifications = [...new Set([...target.classifications, ...row.classifications])]; merged++;
  } else {
   const ambiguous = candidates.length > 0 || leads.some(l => normalize(l.name) === normalize(row.name) || (!!normalize(l.address) && normalize(l.address) === normalize(row.address)));
   leads.push({ ...row, review: ambiguous, provenance: [...row.provenance] }); if (ambiguous) review++; else newUnique++;
  }
 }
 return { leads, merged, review, newUnique, received: incoming.length };
}
export function validateAttempt(a: ContactAttempt) { if ((a.status === 'sent' || a.status === 'delivered') && !a.providerConfirmed) throw new Error('Envío/entrega requiere confirmación del proveedor'); if (!a.note.trim() || !Number.isFinite(Date.parse(a.date))) throw new Error('Fecha y evidencia del intento obligatorias'); }
export function ratio(costs: CostRecord[], denominator: number, from: string, to: string) {
 if (!denominator) return { value: null, currency: '', reason: 'Denominador cero', numerator: null, denominator };
 const selected = costs.filter(c => c.periodFrom <= to && c.periodTo >= from);
 if (!selected.length || selected.some(c => c.amount === null || !c.complete || c.periodFrom < from || c.periodTo > to)) return { value: null, currency: '', reason: 'Costo desconocido, incompleto o periodo no alineado', numerator: null, denominator };
 const coverage=[...selected].sort((a,b)=>a.periodFrom.localeCompare(b.periodFrom));let coveredThrough='';for(const c of coverage){if(!coveredThrough && c.periodFrom>from)break;if(coveredThrough && Date.parse(c.periodFrom)>Date.parse(coveredThrough)+86400000)break;if(c.periodTo>coveredThrough)coveredThrough=c.periodTo;}
 if(coveredThrough<to)return {value:null,currency:'',reason:'Costos incompletos: periodo sin cobertura completa',numerator:null,denominator};
 if (new Set(selected.map(c => c.currency)).size !== 1) return { value: null, currency: '', reason: 'Monedas mezcladas; no se convierte automáticamente', numerator: null, denominator };
 const numerator = selected.reduce((n,c) => n + (c.type === 'human-time' ? (c.hours ?? NaN) * (c.hourlyRate ?? NaN) : c.amount ?? NaN), 0);
 if (!Number.isFinite(numerator)) return { value: null, currency: '', reason: 'Tiempo sin horas o tarifa explícita', numerator: null, denominator };
 return { value: numerator / denominator, currency: selected[0]?.currency ?? '', reason: '', numerator, denominator };
}
export function metrics(w: Workspace, from: string, to: string) {
 const inPeriod = (d: string) => d.slice(0,10) >= from && d.slice(0,10) <= to;
 const eligible = w.leads.filter(l => validLead(l) && evaluateICP(l,w.icp).status === 'match' && l.provenance.every(p => p.dataClass !== 'demo'));
 const acquired = eligible.filter(l => inPeriod(l.createdAt));
 const attempts = w.attempts.filter(a => inPeriod(a.date) && a.status !== 'failed' && eligible.some(l => l.id === a.leadId));
 const uniqueAttempts = new Set(attempts.map(a=>a.leadId));
 const replies = new Set(w.responses.filter(r=>inPeriod(r.date) && attempts.some(a=>a.id===r.attemptId)).map(r=>r.leadId));
 const latestQualifications = [...w.qualifications].filter(q=>q.date.slice(0,10)<=to).sort((a,b)=>a.date.localeCompare(b.date));
 const currentQualifications = new Map(latestQualifications.map(q=>[q.leadId,q]));
 const qualified = new Set([...currentQualifications.values()].filter(q=>q.positive && inPeriod(q.date) && eligible.some(l=>l.id===q.leadId)).map(q=>q.leadId));
 return { eligible: acquired.length, attempted: uniqueAttempts.size, responded: replies.size, qualified: qualified.size, responseRate: uniqueAttempts.size ? replies.size / uniqueAttempts.size : null,
 sources: (['datasf','cslb'] as SourceId[]).map(source => { const first = acquired.filter(l=>l.provenance[0]?.source===source).length; const multi = acquired.filter(l=>l.provenance.some(p=>p.source===source)).length; const costs = w.costs.filter(c=>c.dimension==='source' && c.target===source); return { source, first, multi, cpl: ratio(costs,first,from,to), multiCpl: ratio(costs,multi,from,to) }; }),
 channels: (['phone','email','web'] as Channel[]).map(channel=> { const n = new Set(attempts.filter(a=>a.channel===channel).map(a=>a.leadId)).size; return { channel, leads: n, cpl: ratio(w.costs.filter(c=>c.dimension==='channel' && c.target===channel),n,from,to) }; }),
 qualifiedCpl: ratio(w.costs,qualified.size,from,to) };
}
