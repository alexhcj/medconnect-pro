'use client';

import {ReactNode, useState} from 'react';
import {useRouter} from 'next/navigation';
import {FieldPath, UseFormRegisterReturn, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from '@/components/ui/button';
import {ApiError} from '@/lib/api/http';
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

const inputClassName =
	'mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

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
		formState: {errors},
	} = form;
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
		<form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
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
					<TextField
						id="start"
						label="Start"
						type="datetime-local"
						error={errors.start?.message}
						register={register('start')}
					/>
					<TextField
						id="end"
						label="End"
						type="datetime-local"
						error={errors.end?.message}
						register={register('end')}
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
						className="mt-1 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						{...register('notes')}
					/>
				</FieldFrame>
			</section>

			<Button type="submit" disabled={createAppointment.isPending}>
				{createAppointment.isPending ? 'Scheduling appointment' : 'Schedule appointment'}
			</Button>
		</form>
	);
}

function TextField({
	id,
	label,
	type = 'text',
	error,
	register,
}: {
	id: string;
	label: string;
	type?: string;
	error?: string;
	register: UseFormRegisterReturn;
}) {
	const errorId = `${id}-error`;
	return (
		<FieldFrame id={id} label={label} error={error}>
			<input
				id={id}
				type={type}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				className={inputClassName}
				{...register}
			/>
		</FieldFrame>
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
				className={inputClassName}
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
