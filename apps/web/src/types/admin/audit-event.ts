export interface AuditEvent {
	id: string;
	practiceId: string;
	actorUserId: string;
	action: string;
	resourceType: string;
	resourceId: string | null;
	correlationId: string;
	createdAt: string;
}
