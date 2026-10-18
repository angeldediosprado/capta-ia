import type { Qualification, AgentRun } from './types';
export interface DaptaQualificationRequest { leadId: string; companyName: string; publicSources: string[]; icpReasons: string[] }
export interface DaptaQualificationResponse { qualification: Qualification; run: AgentRun; providerRequestId: string }
export const daptaStatus = { connected: false, reason: 'Faltan endpoint, credenciales y contrato request-response aprobado. No hay resultados automáticos.' } as const;
export async function qualifyWithDapta(_request: DaptaQualificationRequest): Promise<DaptaQualificationResponse> { throw new Error(daptaStatus.reason); }
