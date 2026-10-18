import { evaluateICP, validLead } from './domain';
import type { Channel, ICP, Lead, Workspace } from './types';

export const discoveryProfiles: { id: string; label: string; icp: ICP }[] = [
  { id: 'hvac', label: 'Climatización y plomería', icp: { provisional: true, city: 'San Francisco', naics: '238220', classifications: ['C-20', 'C-36'], requireActive: true } },
  { id: 'electrical', label: 'Instalaciones eléctricas', icp: { provisional: true, city: 'San Francisco', naics: '238210', classifications: ['C-10'], requireActive: true } },
  { id: 'restaurants', label: 'Restaurantes', icp: { provisional: true, city: 'San Francisco', naics: '722511,722513', classifications: [], requireActive: true } },
];
export function publicChannel(lead: Lead): Channel | null {
  return lead.email ? 'email' : lead.phone ? 'phone' : lead.website ? 'web' : null;
}
export function prepareDrafts(workspace: Workspace, template: string, date = new Date().toISOString()): Workspace {
  if (!template.trim() || template.length > 10000) throw new Error('Escribe un mensaje de hasta 10.000 caracteres');
  const drafts = [...workspace.drafts];
  for (const lead of workspace.leads) {
    const channel = publicChannel(lead);
    if (!channel || !validLead(lead) || evaluateICP(lead, workspace.icp).status !== 'match' ||
      lead.provenance.some(p => p.dataClass === 'demo') || drafts.some(d => d.leadId === lead.id) ||
      workspace.attempts.some(a => a.leadId === lead.id)) continue;
    drafts.push({ id: crypto.randomUUID(), leadId: lead.id, channel, date, text: template.replaceAll('{empresa}', lead.name) });
  }
  return { ...workspace, drafts };
}