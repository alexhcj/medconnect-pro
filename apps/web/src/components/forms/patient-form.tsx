'use client';

import z from "zod";
import {useFormAutoSave, useUpdatePatient} from "@/lib/hooks/use-medical";
import {useUISelectors} from "@/lib/stores/ui-store";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect} from "react";

const patientSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().min(1, 'Last name is required'),
	dateOfBirth: z.string().min(1, 'Date of birth is required'),
	phone: z.string().min(10, 'Valid phone number required'),
	email: z.email('Valid email required'),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientFormProps {
	patientId: string;
	initialData?: Partial<PatientFormData>;
}

export function PatientForm({patientId, initialData}: PatientFormProps) {
	// const {updateContext} = useSession();
	const updatePatient = useUpdatePatient();
	const {setFormState} = useUISelectors.useFormState('patient-form');

	const form = useForm<PatientFormData>({
		resolver: zodResolver(patientSchema),
		defaultValues: initialData,
	});

	// Auto-save functionality
	const {updateData, saveNow, isDirty, lastSaved} = useFormAutoSave(
		'patient-form',
		async (data: PatientFormData) => {
			await updatePatient.mutateAsync({patientId, updates: data});
		}
	);

	// Update session context when editing patient
	// useEffect(() => {
	// 	updateContext(`patient_form_${patientId}`);
	// }, [patientId, updateContext]);

	// Track form changes for auto-save
	useEffect(() => {
		const subscription = form.watch((data) => {
			updateData(data as PatientFormData);
			setFormState({hasUnsavedChanges: isDirty});
		});
		return () => subscription.unsubscribe();
	}, [form, updateData, setFormState, isDirty]);

	const onSubmit = async (data: PatientFormData) => {
		try {
			await updatePatient.mutateAsync({patientId, updates: data});
		} catch (error) {
			console.error('Failed to save patient:', error);
		}
	};

	return (
		<div data-clinical-form="true" className="max-w-2xl mx-auto p-6">
			<div className="mb-4 flex justify-between items-center">
				<h2 className="text-xl font-semibold">Patient Information</h2>
				<div className="text-sm text-gray-500">
					{isDirty && 'Unsaved changes • '}
					{lastSaved && `Last saved: ${lastSaved.toLocaleTimeString()}`}
				</div>
			</div>

			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				<div>
					<label className="block text-sm font-medium text-gray-700">
						First Name
					</label>
					<input
						type="text"
						{...form.register('firstName')}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
					/>
					{form.formState.errors.firstName && (
						<p className="text-red-600 text-sm">{form.formState.errors.firstName.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700">
						Last Name
					</label>
					<input
						type="text"
						{...form.register('lastName')}
						className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
					/>
				</div>

				<div className="flex space-x-4">
					<button
						type="button"
						onClick={saveNow}
						className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
					>
						Save Draft
					</button>

					<button
						type="submit"
						disabled={updatePatient.isPending}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
					>
						{updatePatient.isPending ? 'Saving...' : 'Save Patient'}
					</button>
				</div>
			</form>
		</div>
	);
}