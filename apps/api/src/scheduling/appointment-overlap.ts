import type {AppointmentState} from '../persistence/entities/appointment.entity.js';

export type OverlapInterval = {
	id?: string;
	providerId: string;
	start: Date;
	end: Date;
	state: AppointmentState;
};

export function intervalsOverlap(start: Date, end: Date, existingStart: Date, existingEnd: Date): boolean {
	return start < existingEnd && end > existingStart;
}

export function hasProviderOverlap(
	providerId: string,
	start: Date,
	end: Date,
	existing: readonly OverlapInterval[],
	excludeId?: string,
): boolean {
	return existing.some((item) => {
		if (item.providerId !== providerId) {
			return false;
		}
		if (item.state === 'cancelled') {
			return false;
		}
		if (excludeId && item.id === excludeId) {
			return false;
		}
		return intervalsOverlap(start, end, item.start, item.end);
	});
}
