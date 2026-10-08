export const CLAIM_STATUSES = ['not_submitted'] as const;

export type ClaimStatus = (typeof CLAIM_STATUSES)[number];

export const CLAIM_PROCESSORS = ['edi837'] as const;

export type ClaimProcessor = (typeof CLAIM_PROCESSORS)[number];

export interface Claim {
	id: string;
	invoiceId: string;
	status: ClaimStatus;
	processor: ClaimProcessor;
	synthetic: boolean;
}
