import {z} from 'zod';
import {
	APPOINTMENT_CREATE_STATES,
	APPOINTMENT_TYPES,
	AppointmentCreateInput,
	AppointmentState,
} from '@/types/medical/appointment';

const requiredText = (message: string) => z.string().trim().min(1, message);

const TYPE_SET = new Set<string>(APPOINTMENT_TYPES);
const STATE_SET = new Set<string>(APPOINTMENT_CREATE_STATES);

export const appointmentFormSchema = z
	.object({
		patientId: requiredText('Select a patient'),
		providerId: requiredText('Select a provider'),
		start: requiredText('Start is required'),
		end: requiredText('End is required'),
		type: z
			.string()
			.min(1, 'Select a type')
			.refine((value) => TYPE_SET.has(value), 'Select a type'),
		state: z
			.string()
			.min(1, 'Select a state')
			.refine((value) => STATE_SET.has(value), 'Select a state'),
		notes: z.string().max(500, 'Notes must be 500 characters or fewer'),
	})
	.superRefine((value, ctx) => {
		const start = new Date(value.start);
		const end = new Date(value.end);
		if (Number.isNaN(start.getTime())) {
			ctx.addIssue({code: 'custom', path: ['start'], message: 'Enter a valid start time'});
		}
		if (Number.isNaN(end.getTime())) {
			ctx.addIssue({code: 'custom', path: ['end'], message: 'Enter a valid end time'});
		}
		if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
			ctx.addIssue({code: 'custom', path: ['end'], message: 'End must be after start'});
		}
	});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export const APPOINTMENT_FIELD_PATHS = [
	'patientId',
	'providerId',
	'start',
	'end',
	'type',
	'state',
	'notes',
] as const satisfies readonly (keyof AppointmentFormValues)[];

export function isAppointmentFieldPath(path: string): path is (typeof APPOINTMENT_FIELD_PATHS)[number] {
	return (APPOINTMENT_FIELD_PATHS as readonly string[]).includes(path);
}

export function emptyAppointmentFormValues(patientId = ''): AppointmentFormValues {
	return {
		patientId,
		providerId: '',
		start: '',
		end: '',
		type: '',
		state: 'scheduled',
		notes: '',
	};
}

export function datetimeLocalToIso(value: string): string {
	return new Date(value).toISOString();
}

export function appointmentFormToCreateInput(values: AppointmentFormValues): AppointmentCreateInput {
	const notes = values.notes.trim();
	return {
		patientId: values.patientId,
		providerId: values.providerId,
		start: datetimeLocalToIso(values.start),
		end: datetimeLocalToIso(values.end),
		type: values.type as AppointmentCreateInput['type'],
		state: values.state as AppointmentCreateInput['state'],
		notes: notes || undefined,
	};
}

export const APPOINTMENT_TYPE_LABELS: Record<(typeof APPOINTMENT_TYPES)[number], string> = {
	office_visit: 'Office visit',
	telehealth: 'Telehealth',
	follow_up: 'Follow-up',
};

export const APPOINTMENT_STATE_LABELS: Record<AppointmentState, string> = {
	scheduled: 'Scheduled',
	confirmed: 'Confirmed',
	cancelled: 'Cancelled',
	completed: 'Completed',
};
