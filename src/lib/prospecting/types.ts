import type { StageAudit } from './discovery';
export type DataClass = 'live' | 'imported' | 'historical' | 'demo';
export type SourceId = 'datasf' | 'cslb';
export type Channel = 'phone' | 'email' | 'web';
export interface Provenance { source: SourceId; recordId: string; url: string; fetchedAt: string; sourceUpdatedAt?: string | undefined; dataClass: DataClass; attribution: string; query: string; runId: string }
export interface Lead { id: string; name: string; address?: string | undefined; city?: string | undefined; naics?: string | undefined; classifications: string[]; licenseNumber?: string | undefined; accountId?: string | undefined; active?: boolean | undefined; phone?: string | undefined; email?: string | undefined; website?: string | undefined; createdAt: string; provenance: Provenance[]; review: boolean }
export interface Source { id: SourceId; title: string; url: string; attribution: string; mode: 'live' | 'import'; }
export interface SourceRun { id: string; source: SourceId; fetchedAt: string; sourceUpdatedAt?: string | undefined; query: string; dataClass: DataClass; filename?: string | undefined; status: 'success' | 'error'; error?: string | undefined; received: number; newUnique: number; merged: number; review: number; url: string; attribution: string; finishedAt?: string | undefined; discarded?: number | undefined; stages?: StageAudit[] | undefined; evaluations?: {leadId:string;status:string;reasons:string[]}[] | undefined; icpSnapshot?: ICP | undefined }
export interface ICP { provisional: boolean; city: string; naics: string; classifications: string[]; requireActive: boolean; businessType?: string | undefined; requireBusinessType?: boolean | undefined; optionalCriteria?: string | undefined }
export interface ICPEvaluation { status: 'match' | 'no-match' | 'insufficient'; reasons: string[] }
export interface ContactDraft { id: string; leadId: string; channel: Channel; text: string; date: string }
export interface ContactAttempt { id: string; leadId: string; channel: Channel; date: string; status: 'attempt-recorded' | 'sent' | 'delivered' | 'failed'; note: string; providerConfirmed: boolean; }
export interface ContactResponse { id: string; attemptId: string; leadId: string; date: string; responder: string; note: string; status: 'response-observed' }
export interface CostRecord { id: string; amount: number | null; currency: string; date: string; dimension: 'source' | 'channel'; target: SourceId | Channel; note: string; type: 'direct' | 'human-time'; hours?: number | undefined; hourlyRate?: number | undefined; complete: boolean; periodFrom: string; periodTo: string }
export interface Qualification { id: string; leadId: string; positive: boolean; method: 'manual' | 'dapta'; date: string; evidence: string }
export interface AgentRun { id: string; agent: 'scout' | 'sorter' | 'check' | 'dapta'; status: 'not-connected' | 'success' | 'error'; date: string; evidence: string }
export interface Workspace { leads: Lead[]; runs: SourceRun[]; icp: ICP; drafts: ContactDraft[]; attempts: ContactAttempt[]; responses: ContactResponse[]; costs: CostRecord[]; qualifications: Qualification[]; agentRuns: AgentRun[] }
export const defaultICP: ICP = { provisional: true, city: 'San Francisco', naics: '238220', classifications: ['C-20', 'C-36'], requireActive: true };
export const emptyWorkspace = (): Workspace => ({ leads: [], runs: [], icp: { ...defaultICP }, drafts: [], attempts: [], responses: [], costs: [], qualifications: [], agentRuns: [] });
export const SOURCE_DEFINITIONS: Source[] = [
 { id: 'datasf', title: 'DataSF · Registered Business Locations', url: 'https://data.sfgov.org/resource/g8m3-pdis.json', attribution: 'San Francisco Treasurer & Tax Collector · DataSF; términos: https://datasf.org/opendata/terms-of-use/', mode: 'live' },
 { id: 'cslb', title: 'CSLB · Contractors', url: 'https://www.cslb.ca.gov/OnlineServices/DataPortal/', attribution: 'California Contractors State License Board · archivo público importado por el usuario; sujeto a términos del portal.', mode: 'import' }
];
