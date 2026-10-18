import { describe, expect, it } from 'vitest';
import { prepareDrafts, publicChannel, discoveryProfiles } from '../prospecting/automation';
import { emptyWorkspace, type Lead } from '../prospecting/types';
import { applySourceResult } from '../prospecting/discovery';
const date = '2026-10-18T14:06:00Z';
const lead = (id: string, overrides: Partial<Lead> = {}): Lead => ({ id, name: 'Empresa pública', address: '100 Main', city: 'San Francisco', naics: '238220', classifications: [], active: true, email: 'contact@example.org', createdAt: date, review: false, provenance: [{ source: 'datasf', recordId: id, url: 'https://data.sf.gov', fetchedAt: date, dataClass: 'live', attribution: 'DataSF', query: '238220', runId: 'run' }], ...overrides });
describe('safe preparation automation', () => {
  it('prepares one personalized draft per eligible public lead without sending or recording attempts', () => {
    const w = { ...emptyWorkspace(), leads: [lead('1')] };
    const out = prepareDrafts(w, 'Hola {empresa}', date);
    expect(out.drafts[0]?.text).toBe('Hola Empresa pública');
    expect(out.drafts[0]?.channel).toBe('email');
    expect(out.attempts).toEqual([]);
    expect(out.responses).toEqual([]);
    expect(w.drafts).toEqual([]);
    expect(prepareDrafts(out, 'Otro mensaje', date).drafts).toEqual(out.drafts);
  });
  it('excludes missing contacts, ambiguous identities, missing required fields, nonmatches and demo records', () => {
    const demo = lead('demo'); if (demo.provenance[0]) demo.provenance[0].dataClass = 'demo';
    const w = { ...emptyWorkspace(), leads: [lead('no-channel', { email: undefined }), lead('review', { review: true }), lead('missing', { active: undefined }), lead('other-city', { city: 'Oakland' }), demo] };
    expect(prepareDrafts(w, 'Hola', date).drafts).toEqual([]);
  });
  it('does not contact again after a manual attempt or overwrite a human draft', () => {
    const w = prepareDrafts({ ...emptyWorkspace(), leads: [lead('1')] }, 'Borrador humano', date);
    w.leads.push(lead('2'));
    w.attempts.push({ id: 'attempt', leadId: '2', channel: 'email', date, status: 'attempt-recorded', note: 'Acción manual', providerConfirmed: false });
    expect(prepareDrafts(w, 'Nuevo', date).drafts).toEqual(w.drafts);
  });
  it('suggests only channels actually present', () => {
    expect(publicChannel(lead('1', { email: undefined, phone: '123' }))).toBe('phone');
    expect(publicChannel(lead('1', { email: undefined, website: 'https://example.org' }))).toBe('web');
    expect(publicChannel(lead('1', { email: undefined }))).toBeNull();
  });
  it('keeps provisional sector presets explicit rather than declaring an official profile', () => {
    expect(discoveryProfiles.every(p => p.icp.provisional)).toBe(true);
    expect(discoveryProfiles.find(p => p.id === 'electrical')?.icp.naics).toBe('238210');
    expect(discoveryProfiles.find(p => p.id === 'restaurants')?.icp.classifications).toEqual([]);
  });
  it('failed sources preserve drafts and cannot claim downstream processing', () => {
    const w = prepareDrafts({ ...emptyWorkspace(), leads: [lead('1')] }, 'Hola', date);
    const out = applySourceResult(w, { leads: [], run: { id: 'failed', source: 'datasf', fetchedAt: date, query: '238220', dataClass: 'live', status: 'error', error: 'HTTP 503', received: 0, newUnique: 0, merged: 0, review: 0, url: 'https://data.sf.gov', attribution: 'DataSF' } }, date);
    expect(out.drafts).toEqual(w.drafts);
    expect(out.runs.at(-1)?.stages?.map(s => s.agent)).toEqual(['scout']);
  });
});