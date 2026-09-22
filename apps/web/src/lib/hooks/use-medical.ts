import {useInfiniteQuery, useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {toast} from 'react-hot-toast';
import {useCallback, useEffect, useRef, useState} from 'react';
import {medicalAPI, PatientNameSort, PatientStatusFilter} from '@/lib/api/medical-api';
import {Patient} from '@/types/medical/patient';

export interface PatientSearchInput {
	query?: string;
	status?: PatientStatusFilter;
	sort?: PatientNameSort;
}

export function usePatient(patientId: string) {
	return useQuery({
		queryKey: ['patient', patientId],
		queryFn: () => medicalAPI.getPatient(patientId),
		enabled: !!patientId,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function usePatientSearch({query = '', status = 'all', sort = 'name-asc'}: PatientSearchInput = {}) {
	return useInfiniteQuery({
		queryKey: ['patients', 'search', query, status, sort],
		queryFn: ({pageParam}) => medicalAPI.searchPatients({pageParam, query, status, sort}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
		staleTime: 2 * 60 * 1000,
		gcTime: 5 * 60 * 1000,
	});
}

export function useUpdatePatient() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({patientId, updates}: {patientId: string; updates: Partial<Patient>}) =>
			medicalAPI.updatePatient(patientId, updates),
		onSuccess: (updatedPatient) => {
			queryClient.setQueryData(['patient', updatedPatient.id], updatedPatient);
			queryClient.invalidateQueries({queryKey: ['patients', 'search']});
			toast.success('Patient information updated successfully');
		},
		onError: (error) => {
			console.error('Failed to update patient:', error);
			toast.error('Failed to update patient information');
		},
	});
}

export function usePatientHistory(patientId: string) {
	return useQuery({
		queryKey: ['patient', patientId, 'history'],
		queryFn: () => medicalAPI.getPatientHistory(patientId),
		enabled: !!patientId,
		staleTime: 3 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
}

export function usePatientVitals(patientId: string) {
	return useQuery({
		queryKey: ['patient', patientId, 'vitals'],
		queryFn: () => medicalAPI.getPatientVitals(patientId),
		enabled: !!patientId,
		staleTime: 5 * 60 * 1000,
		gcTime: 15 * 60 * 1000,
	});
}

export function usePatientMedications(patientId: string) {
	return useQuery({
		queryKey: ['patient', patientId, 'medications'],
		queryFn: () => medicalAPI.getPatientMedications(patientId),
		enabled: !!patientId,
		staleTime: 5 * 60 * 1000,
		gcTime: 15 * 60 * 1000,
	});
}

export function usePatientDocuments(patientId: string) {
	return useQuery({
		queryKey: ['patient', patientId, 'documents'],
		queryFn: () => medicalAPI.getPatientDocuments(patientId),
		enabled: !!patientId,
		staleTime: 5 * 60 * 1000,
		gcTime: 15 * 60 * 1000,
	});
}

export function useProvider(providerId: string) {
	return useQuery({
		queryKey: ['provider', providerId],
		queryFn: () => medicalAPI.getProvider(providerId),
		enabled: !!providerId,
	});
}

export function usePatientWorkflow(patientId: string) {
	const patient = usePatient(patientId);
	const history = usePatientHistory(patientId);
	const vitals = usePatientVitals(patientId);
	const medications = usePatientMedications(patientId);
	const documents = usePatientDocuments(patientId);

	return {
		patient: patient.data,
		history: history.data,
		vitals: vitals.data,
		medications: medications.data,
		documents: documents.data,
		isLoading:
			patient.isLoading ||
			history.isLoading ||
			vitals.isLoading ||
			medications.isLoading ||
			documents.isLoading,
		error: patient.error || history.error || vitals.error || medications.error || documents.error,
		refetchAll: () => {
			patient.refetch();
			history.refetch();
			vitals.refetch();
			medications.refetch();
			documents.refetch();
		},
	};
}

export function useFormAutoSave<T>(
	formId: string,
	saveFunction: (data: T) => Promise<void>,
	interval: number = 30000,
) {
	const [isDirty, setIsDirty] = useState(false);
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const dataRef = useRef<T | null>(null);

	const saveData = useCallback(async () => {
		if (!isDirty || !dataRef.current) return;

		try {
			await saveFunction(dataRef.current);
			setLastSaved(new Date());
			setIsDirty(false);
			toast.success('Draft saved automatically');
		} catch (error) {
			console.error('Auto-save failed:', error);
			toast.error('Auto-save failed');
		}
	}, [isDirty, saveFunction]);

	useEffect(() => {
		const intervalId = setInterval(saveData, interval);
		return () => clearInterval(intervalId);
	}, [saveData, interval]);

	useEffect(() => {
		const handleAutoSave = () => saveData();
		window.addEventListener('auto-save-triggered', handleAutoSave);
		return () => window.removeEventListener('auto-save-triggered', handleAutoSave);
	}, [saveData]);

	return {
		updateData: (data: T) => {
			dataRef.current = data;
			setIsDirty(true);
		},
		saveNow: saveData,
		isDirty,
		lastSaved,
	};
}
