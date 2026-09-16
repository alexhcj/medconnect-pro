export type HistoryEntryType = 'visit' | 'consultation' | 'procedure';
export type HistoryEntryStatus = 'draft' | 'completed' | 'reviewed' | 'amended';

export interface HistoryEntry {
	id: string;
	patientId: string;
	type: HistoryEntryType;
	occurredAt: string;
	title: string;
	summary: string;
	providerId: string;
	status: HistoryEntryStatus;
	synthetic: boolean;
}
