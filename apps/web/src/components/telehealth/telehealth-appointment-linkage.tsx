import {APPOINTMENT_TYPE_LABELS} from '@/components/forms/appointment-form-schema';
import {TelehealthSession} from '@/types/medical/telehealth-session';

export const TELEHEALTH_DEMO_NOTICE = 'Synthetic demo. Not a production telehealth deployment.';

export function formatTelehealthRange(start: string, end: string) {
	const startDate = new Date(start);
	const endDate = new Date(end);
	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
		return `${start} – ${end}`;
	}
	return `${startDate.toLocaleString()} – ${endDate.toLocaleTimeString()}`;
}

export function TelehealthAppointmentLinkage({session}: {session: TelehealthSession}) {
	const typeLabel = APPOINTMENT_TYPE_LABELS[session.type] ?? session.type;

	return (
		<dl className="space-y-1 text-sm text-gray-700">
			<div>
				<dt className="inline font-medium text-gray-900">Patient: </dt>
				<dd className="inline">{session.patientName}</dd>
			</div>
			<div>
				<dt className="inline font-medium text-gray-900">Provider: </dt>
				<dd className="inline">{session.providerName}</dd>
			</div>
			<div>
				<dt className="inline font-medium text-gray-900">Time: </dt>
				<dd className="inline">{formatTelehealthRange(session.start, session.end)}</dd>
			</div>
			<div>
				<dt className="inline font-medium text-gray-900">Type: </dt>
				<dd className="inline">{typeLabel}</dd>
			</div>
			<div>
				<dt className="inline font-medium text-gray-900">Appointment: </dt>
				<dd className="inline">{session.appointmentId}</dd>
			</div>
		</dl>
	);
}
