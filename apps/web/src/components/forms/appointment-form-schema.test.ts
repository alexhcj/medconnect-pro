import {
	appointmentFormSchema,
	appointmentFormToCreateInput,
	emptyAppointmentFormValues,
} from '@/components/forms/appointment-form-schema';

const valid = {
	patientId: 'demo-patient-002',
	providerId: 'demo-provider-001',
	start: '2026-10-20T10:00',
	end: '2026-10-20T11:00',
	type: 'office_visit',
	state: 'scheduled',
	notes: '',
};

describe('appointmentFormSchema', () => {
	it('accepts a complete appointment', () => {
		expect(appointmentFormSchema.safeParse(valid).success).toBe(true);
	});

	it('rejects an empty patient', () => {
		const result = appointmentFormSchema.safeParse({...valid, patientId: ' '});
		expect(result.success).toBe(false);
	});

	it('rejects an end that is not after start', () => {
		const result = appointmentFormSchema.safeParse({...valid, end: '2026-10-20T09:00'});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.some((issue) => issue.message === 'End must be after start')).toBe(true);
		}
	});

	it('maps form values onto ISO create input', () => {
		const input = appointmentFormToCreateInput({...valid, notes: '  follow up  '});
		expect(input.start).toBe(new Date('2026-10-20T10:00').toISOString());
		expect(input.end).toBe(new Date('2026-10-20T11:00').toISOString());
		expect(input.notes).toBe('follow up');
		expect(emptyAppointmentFormValues('demo-patient-001').patientId).toBe('demo-patient-001');
	});
});
