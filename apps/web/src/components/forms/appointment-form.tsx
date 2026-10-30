'use client';

import {ReactNode, useState} from 'react';
import {useRouter} from 'next/navigation';
import {Controller, FieldPath, UseFormRegisterReturn, useForm, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {DateTimeField} from '@/components/ui/date-time-field';
import {ApiError} from '@/lib/api/http';
import {addMinutesLocal} from '@/lib/format/date-input';
import {useCreateAppointment} from '@/lib/hooks/use-medical';
import {Patient} from '@/types/medical/patient';
import {Provider} from '@/types/medical/provider';
import {
	APPOINTMENT_STATE_LABELS,
	APPOINTMENT_TYPE_LABELS,
	appointmentFormSchema,
	appointmentFormToCreateInput,
	AppointmentFormValues,
	emptyAppointmentFormValues,
	isAppointmentFieldPath,
} from '@/components/forms/appointment-form-schema';
import {
	formCardContentClassName,
	formControlBaseClassName,
	formControlClassName,
} from '@/components/forms/form-field-styles';

interface AppointmentFormProps {
	patients: Patient[];
	providers: Provider[];
	prefilledPatientId?: string;
}

function FieldFrame({
	id,
	label,
	error,
	children,
}: {
	id: string;
	label: string;
	error?: string;
	children: ReactNode;
}) {
	const errorId = `${id}-error`;
	return (
		<div>
			<label htmlFor={id} className="block text-sm font-medium text-gray-700">
				{label}
			</label>
			{children}
			{error && (
				<p id={errorId} className="mt-1 text-sm text-red-600" role="alert">
					{error}
				</p>
			)}
		</div>
	);
}

export function AppointmentForm({patients, providers, prefilledPatientId}: AppointmentFormProps) {
	const router = useRouter();
	const createAppointment = useCreateAppointment();
	const form = useForm<AppointmentFormValues>({
		resolver: zodResolver(appointmentFormSchema),
		mode: 'onSubmit',
		shouldFocusError: true,
		defaultValues: emptyAppointmentFormValues(prefilledPatientId ?? ''),
	});
	const {
		register,
		handleSubmit,
		setError,
		getValues,
		setValue,
		formState: {errors},
	} = form;
	const start = useWatch({control: form.control, name: 'start'});
	const [formError, setFormError] = useState<string | null>(null);

	const onSubmit = async (data: AppointmentFormValues) => {
		setFormError(null);
		try {
			await createAppointment.mutateAsync(appointmentFormToCreateInput(data));
			router.push('/dashboard/appointments');
		} catch (error) {
			if (error instanceof ApiError && error.details?.length) {
				let applied = false;
				for (const detail of error.details) {
					if (isAppointmentFieldPath(detail.path)) {
						setError(detail.path as FieldPath<AppointmentFormValues>, {message: detail.message}, {shouldFocus: !applied});
						applied = true;
					}
				}
				if (applied) {
					return;
				}
			}
			const message =
				error instanceof ApiError && error.message ? error.message : 'Unable to schedule this appointment.';
			setFormError(message);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} noValidate>
			<Card>
				<CardContent className={formCardContentClassName}>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">Schedule appointment</h1>
						<p className="mt-2 text-sm text-gray-600">Synthetic demo data. Not a real medical record.</p>
					</div>

					{formError && (
						<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
							<p className="text-sm text-gray-700">{formError}</p>
						</div>
					)}

					<section className="space-y-4" aria-labelledby="appointment-details-heading">
						<h2 id="appointment-details-heading" className="text-lg font-semibold text-gray-900">
							Appointment details
						</h2>
						<div className="grid gap-4 sm:grid-cols-2">
							<SelectField
								id="patientId"
								label="Patient"
								error={errors.patientId?.message}
								register={register('patientId')}
								placeholder="Choose a patient"
								options={patients.map((patient) => ({
									value: patient.id,
									label: `${patient.firstName} ${patient.lastName}`,
								}))}
							/>
							<SelectField
								id="providerId"
								label="Provider"
								error={errors.providerId?.message}
								register={register('providerId')}
								placeholder="Choose a provider"
								options={providers.map((provider) => ({value: provider.id, label: provider.displayName}))}
							/>
							<Controller
								control={form.control}
								name="start"
								render={({field, fieldState}) => (
									<DateTimeField
										id="start"
										legend="Start"
										name={field.name}
										value={field.value}
										onChange={(next) => {
											field.onChange(next);
											// Offer a 30-minute visit: fill End only when it is empty or no longer after Start.
											const end = getValues('end');
											if (next && (!end || new Date(end) <= new Date(next))) {
												setValue('end', addMinutesLocal(next, 30));
											}
										}}
										onBlur={field.onBlur}
										inputRef={field.ref}
										error={fieldState.error?.message}
									/>
								)}
							/>
							<Controller
								control={form.control}
								name="end"
								render={({field, fieldState}) => (
									<DateTimeField
										id="end"
										legend="End"
										name={field.name}
										value={field.value}
										minValue={start}
										onChange={field.onChange}
										onBlur={field.onBlur}
										inputRef={field.ref}
										error={fieldState.error?.message}
									/>
								)}
							/>
							<SelectField
								id="type"
								label="Type"
								error={errors.type?.message}
								register={register('type')}
								placeholder="Choose a type"
								options={Object.entries(APPOINTMENT_TYPE_LABELS).map(([value, label]) => ({value, label}))}
							/>
							<SelectField
								id="state"
								label="State"
								error={errors.state?.message}
								register={register('state')}
								options={[
									{value: 'scheduled', label: APPOINTMENT_STATE_LABELS.scheduled},
									{value: 'confirmed', label: APPOINTMENT_STATE_LABELS.confirmed},
								]}
							/>
						</div>
						<FieldFrame id="notes" label="Notes" error={errors.notes?.message}>
							<textarea
								id="notes"
								rows={3}
								aria-invalid={errors.notes?.message ? true : undefined}
								aria-describedby={errors.notes?.message ? 'notes-error' : undefined}
								className={formControlBaseClassName}
								{...register('notes')}
							/>
						</FieldFrame>
					</section>

					<Button type="submit" disabled={createAppointment.isPending}>
						{createAppointment.isPending ? 'Scheduling appointment' : 'Schedule appointment'}
					</Button>
				</CardContent>
			</Card>
		</form>
	);
}

function SelectField({
	id,
	label,
	error,
	register,
	options,
	placeholder,
}: {
	id: string;
	label: string;
	error?: string;
	register: UseFormRegisterReturn;
	options: Array<{value: string; label: string}>;
	placeholder?: string;
}) {
	const errorId = `${id}-error`;
	return (
		<FieldFrame id={id} label={label} error={error}>
			<select
				id={id}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				className={formControlClassName}
				{...register}
			>
				{placeholder && <option value="">{placeholder}</option>}
				{options.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</FieldFrame>
	);
}
