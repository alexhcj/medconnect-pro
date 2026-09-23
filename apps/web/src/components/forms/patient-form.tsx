'use client';

import {ReactNode, useState} from 'react';
import {useRouter} from 'next/navigation';
import {FieldPath, UseFormRegisterReturn, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Button} from '@/components/ui/button';
import {ApiError} from '@/lib/api/http';
import {useCreatePatient, useUpdatePatient} from '@/lib/hooks/use-medical';
import {Patient} from '@/types/medical/patient';
import {Provider} from '@/types/medical/provider';
import {
	emptyPatientFormValues,
	isPatientFieldPath,
	patientFormSchema,
	PatientFormValues,
	patientToFormValues,
} from '@/components/forms/patient-form-schema';

const inputClassName =
	'mt-1 flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

interface PatientFormProps {
	mode: 'create' | 'edit';
	providers: Provider[];
	patient?: Patient;
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

export function PatientForm({mode, providers, patient}: PatientFormProps) {
	const router = useRouter();
	const createPatient = useCreatePatient();
	const updatePatient = useUpdatePatient();
	const isEdit = mode === 'edit';

	const form = useForm<PatientFormValues>({
		resolver: zodResolver(patientFormSchema),
		mode: 'onSubmit',
		shouldFocusError: true,
		defaultValues: patient ? patientToFormValues(patient) : emptyPatientFormValues(),
	});

	const {
		register,
		handleSubmit,
		setError,
		formState: {errors},
	} = form;
	const [formError, setFormError] = useState<string | null>(null);

	const onSubmit = async (data: PatientFormValues) => {
		setFormError(null);
		try {
			const saved = isEdit
				? await updatePatient.mutateAsync({patientId: patient?.id ?? '', updates: data})
				: await createPatient.mutateAsync(data);
			router.push(`/dashboard/patients/${saved.id}`);
		} catch (error) {
			if (error instanceof ApiError && error.details?.length) {
				let applied = false;
				for (const detail of error.details) {
					if (isPatientFieldPath(detail.path)) {
						setError(detail.path as FieldPath<PatientFormValues>, {message: detail.message}, {shouldFocus: !applied});
						applied = true;
					}
				}
				if (applied) {
					return;
				}
			}
			const message = error instanceof ApiError && error.message ? error.message : 'Unable to save this patient.';
			setFormError(message);
		}
	};

	const pending = createPatient.isPending || updatePatient.isPending;
	const submitLabel = isEdit ? 'Save changes' : 'Create patient';

	return (
		<form className="space-y-8" onSubmit={handleSubmit(onSubmit)} noValidate>
			<div>
				<h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit patient' : 'Add patient'}</h1>
				<p className="mt-2 text-sm text-gray-600">Synthetic demo data. Not a real medical record.</p>
			</div>

			{formError && (
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">{formError}</p>
				</div>
			)}

			<section className="space-y-4" aria-labelledby="patient-demographics-heading">
				<h2 id="patient-demographics-heading" className="text-lg font-semibold text-gray-900">
					Demographics
				</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					<TextField id="firstName" label="First name" autoComplete="given-name" error={errors.firstName?.message} register={register('firstName')} />
					<TextField id="lastName" label="Last name" autoComplete="family-name" error={errors.lastName?.message} register={register('lastName')} />
					<TextField id="dateOfBirth" label="Date of birth" type="date" autoComplete="bday" error={errors.dateOfBirth?.message} register={register('dateOfBirth')} />
					<SelectField
						id="gender"
						label="Gender"
						error={errors.gender?.message}
						register={register('gender')}
						placeholder="Select a gender"
						options={[
							{value: 'female', label: 'Female'},
							{value: 'male', label: 'Male'},
							{value: 'non-binary', label: 'Non-binary'},
						]}
					/>
					<SelectField
						id="status"
						label="Status"
						error={errors.status?.message}
						register={register('status')}
						options={[
							{value: 'active', label: 'Active'},
							{value: 'inactive', label: 'Inactive'},
						]}
					/>
					<SelectField
						id="providerId"
						label="Assigned provider"
						error={errors.providerId?.message}
						register={register('providerId')}
						placeholder="Select a provider"
						options={providers.map((provider) => ({value: provider.id, label: provider.displayName}))}
					/>
				</div>
			</section>

			<section className="space-y-4" aria-labelledby="patient-contact-heading">
				<h2 id="patient-contact-heading" className="text-lg font-semibold text-gray-900">
					Contact
				</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					<TextField id="phone" label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} register={register('phone')} />
					<TextField id="email" label="Email" type="email" autoComplete="email" error={errors.email?.message} register={register('email')} />
					<TextField id="address-street" label="Street" autoComplete="street-address" error={errors.address?.street?.message} register={register('address.street')} />
					<TextField id="address-city" label="City" autoComplete="address-level2" error={errors.address?.city?.message} register={register('address.city')} />
					<TextField id="address-state" label="State" autoComplete="address-level1" error={errors.address?.state?.message} register={register('address.state')} />
					<TextField id="address-postalCode" label="Postal code" autoComplete="postal-code" error={errors.address?.postalCode?.message} register={register('address.postalCode')} />
				</div>
			</section>

			<section className="space-y-4" aria-labelledby="patient-emergency-heading">
				<h2 id="patient-emergency-heading" className="text-lg font-semibold text-gray-900">
					Emergency contact
				</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					<TextField id="emergencyContact-name" label="Emergency contact name" error={errors.emergencyContact?.name?.message} register={register('emergencyContact.name')} />
					<TextField id="emergencyContact-relationship" label="Relationship" error={errors.emergencyContact?.relationship?.message} register={register('emergencyContact.relationship')} />
					<TextField id="emergencyContact-phone" label="Emergency phone" type="tel" error={errors.emergencyContact?.phone?.message} register={register('emergencyContact.phone')} />
				</div>
			</section>

			<section className="space-y-4" aria-labelledby="patient-insurance-heading">
				<h2 id="patient-insurance-heading" className="text-lg font-semibold text-gray-900">
					Insurance
				</h2>
				<div className="grid gap-4 sm:grid-cols-2">
					<TextField id="insurance-provider" label="Insurance provider" error={errors.insurance?.provider?.message} register={register('insurance.provider')} />
					<TextField id="insurance-policyNumber" label="Policy number" error={errors.insurance?.policyNumber?.message} register={register('insurance.policyNumber')} />
					<TextField id="insurance-groupNumber" label="Group number" error={errors.insurance?.groupNumber?.message} register={register('insurance.groupNumber')} />
				</div>
			</section>

			<Button type="submit" disabled={pending}>
				{pending ? (isEdit ? 'Saving changes' : 'Creating patient') : submitLabel}
			</Button>
		</form>
	);
}

function TextField({
	id,
	label,
	type = 'text',
	autoComplete,
	error,
	register,
}: {
	id: string;
	label: string;
	type?: string;
	autoComplete?: string;
	error?: string;
	register: UseFormRegisterReturn;
}) {
	const errorId = `${id}-error`;
	return (
		<FieldFrame id={id} label={label} error={error}>
			<input
				id={id}
				type={type}
				autoComplete={autoComplete}
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
