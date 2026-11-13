import type {Appointment} from '@/types/medical/appointment';

/**
 * The next real appointment after this visit, for the patient's "visit ended" card. Cancelled and
 * completed appointments never count, and neither does the visit just held. Undefined when none exists,
 * so the card is not shown (FE-064).
 */
export function findNextAppointment(
	appointments: readonly Appointment[] | undefined,
	currentAppointmentId: string,
	now: number = Date.now(),
): Appointment | undefined {
	return (appointments ?? [])
		.filter(
			(appointment) =>
				appointment.id !== currentAppointmentId &&
				(appointment.state === 'scheduled' || appointment.state === 'confirmed') &&
				Date.parse(appointment.start) > now,
		)
		.sort((a, b) => Date.parse(a.start) - Date.parse(b.start))[0];
}

export function followUpHref(patientId?: string, providerId?: string): string {
	const query = new URLSearchParams();
	if (patientId) {
		query.set('patientId', patientId);
	}
	if (providerId) {
		query.set('providerId', providerId);
	}
	const text = query.toString();
	return text ? `/dashboard/appointments/new?${text}` : '/dashboard/appointments/new';
}
