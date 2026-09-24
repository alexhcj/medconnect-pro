'use client';

import Link from 'next/link';
import {ReactNode} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {
	canViewMedicalRecords,
	canViewPatientProfile,
	canViewVitals,
	canWritePatientDemographics,
} from '@/lib/auth/patient-profile-access';
import {canWriteAppointments} from '@/lib/auth/appointment-access';
import {
	usePatient,
	usePatientDocuments,
	usePatientHistory,
	usePatientMedications,
	usePatientVitals,
	useProvider,
} from '@/lib/hooks/use-medical';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {HistoryEntry} from '@/types/medical/history';
import {Medication} from '@/types/medical/medication';
import {Patient} from '@/types/medical/patient';
import {PatientDocument} from '@/types/medical/document';
import {Vital} from '@/types/medical/vital';

interface PatientProfileProps {
	patientId: string;
}

interface ProfileSection {
	id: string;
	label: string;
}

function SectionQueryState({
	isPending,
	isError,
	onRetry,
	loadingLabel,
	errorMessage,
	isEmpty,
	emptyMessage,
	children,
}: {
	isPending: boolean;
	isError: boolean;
	onRetry: () => void;
	loadingLabel: string;
	errorMessage: string;
	isEmpty: boolean;
	emptyMessage: string;
	children: ReactNode;
}) {
	if (isPending) {
		return (
			<div className="space-y-3" aria-busy="true">
				<div className="h-16 animate-pulse rounded-lg bg-gray-200" />
				<span className="sr-only">{loadingLabel}</span>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
				<p className="text-sm text-gray-700">{errorMessage}</p>
				<Button type="button" className="mt-3" variant="outline" onClick={onRetry}>
					Retry
				</Button>
			</div>
		);
	}

	if (isEmpty) {
		return <p className="text-sm text-gray-600">{emptyMessage}</p>;
	}

	return children;
}

function DefinitionItem({label, value}: {label: string; value: string}) {
	return (
		<div>
			<dt className="text-sm font-medium text-gray-700">{label}</dt>
			<dd className="mt-1 text-sm text-gray-900">{value}</dd>
		</div>
	);
}

function formatAddress(patient: Patient) {
	const {street, city, state, postalCode} = patient.address;
	return `${street}, ${city}, ${state} ${postalCode}`;
}

function DemographicsSection({patient}: {patient: Patient}) {
	const provider = useProvider(patient.providerId);
	const providerLabel = provider.isPending
		? 'Loading provider'
		: provider.data?.displayName ?? patient.providerId;

	return (
		<section id="demographics" aria-labelledby="demographics-heading" className="scroll-mt-6">
			<Card>
				<CardHeader>
					<h2 id="demographics-heading" className="text-lg font-semibold text-gray-900">
						Demographics
					</h2>
				</CardHeader>
				<CardContent>
					<dl className="grid gap-4 sm:grid-cols-2">
						<DefinitionItem label="Date of birth" value={patient.dateOfBirth} />
						<DefinitionItem label="Gender" value={patient.gender} />
						<DefinitionItem label="Status" value={patient.status === 'active' ? 'Active' : 'Inactive'} />
						<DefinitionItem label="Phone" value={patient.phone} />
						<DefinitionItem label="Email" value={patient.email} />
						<DefinitionItem label="Address" value={formatAddress(patient)} />
						<DefinitionItem label="Emergency contact" value={patient.emergencyContact.name} />
						<DefinitionItem label="Relationship" value={patient.emergencyContact.relationship} />
						<DefinitionItem label="Emergency phone" value={patient.emergencyContact.phone} />
						<DefinitionItem label="Insurance" value={patient.insurance.provider} />
						<DefinitionItem label="Policy number" value={patient.insurance.policyNumber} />
						<DefinitionItem label="Group number" value={patient.insurance.groupNumber} />
						<DefinitionItem label="Assigned provider" value={providerLabel} />
					</dl>
				</CardContent>
			</Card>
		</section>
	);
}

function HistorySection({
	entries,
	isPending,
	isError,
	onRetry,
}: {
	entries: HistoryEntry[] | undefined;
	isPending: boolean;
	isError: boolean;
	onRetry: () => void;
}) {
	return (
		<section id="history" aria-labelledby="history-heading" className="scroll-mt-6">
			<Card>
				<CardHeader>
					<h2 id="history-heading" className="text-lg font-semibold text-gray-900">
						History
					</h2>
				</CardHeader>
				<CardContent>
					<SectionQueryState
						isPending={isPending}
						isError={isError}
						onRetry={onRetry}
						loadingLabel="Loading history"
						errorMessage="Unable to load history."
						isEmpty={(entries?.length ?? 0) === 0}
						emptyMessage="No history records."
					>
						<ul className="space-y-3" aria-label="History">
							{entries?.map((entry) => (
								<li key={entry.id} className="rounded-lg border border-gray-200 p-4">
									<p className="font-medium text-gray-900">{entry.title}</p>
									<p className="mt-1 text-sm text-gray-700">
										{entry.type} · {entry.status} · {entry.occurredAt.slice(0, 10)}
									</p>
									<p className="mt-2 text-sm text-gray-700">{entry.summary}</p>
								</li>
							))}
						</ul>
					</SectionQueryState>
				</CardContent>
			</Card>
		</section>
	);
}

function VitalsSection({
	entries,
	isPending,
	isError,
	onRetry,
}: {
	entries: Vital[] | undefined;
	isPending: boolean;
	isError: boolean;
	onRetry: () => void;
}) {
	return (
		<section id="vitals" aria-labelledby="vitals-heading" className="scroll-mt-6">
			<Card>
				<CardHeader>
					<h2 id="vitals-heading" className="text-lg font-semibold text-gray-900">
						Vitals
					</h2>
				</CardHeader>
				<CardContent>
					<SectionQueryState
						isPending={isPending}
						isError={isError}
						onRetry={onRetry}
						loadingLabel="Loading vitals"
						errorMessage="Unable to load vitals."
						isEmpty={(entries?.length ?? 0) === 0}
						emptyMessage="No vitals recorded."
					>
						<ul className="space-y-3" aria-label="Vitals">
							{entries?.map((entry) => (
								<li key={entry.id} className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
									<p className="font-medium text-gray-900">{entry.recordedAt.slice(0, 10)}</p>
									<p className="mt-1">
										Blood pressure {entry.systolicMmHg}/{entry.diastolicMmHg} mmHg
									</p>
									<p>Heart rate {entry.heartRateBpm} bpm</p>
									<p>Temperature {entry.temperatureC} °C</p>
									<p>Respiratory rate {entry.respiratoryRate}</p>
									<p>SpO2 {entry.spo2Percent}%</p>
									<p>Weight {entry.weightKg} kg</p>
								</li>
							))}
						</ul>
					</SectionQueryState>
				</CardContent>
			</Card>
		</section>
	);
}

function MedicationsSection({
	entries,
	isPending,
	isError,
	onRetry,
}: {
	entries: Medication[] | undefined;
	isPending: boolean;
	isError: boolean;
	onRetry: () => void;
}) {
	return (
		<section id="medications" aria-labelledby="medications-heading" className="scroll-mt-6">
			<Card>
				<CardHeader>
					<h2 id="medications-heading" className="text-lg font-semibold text-gray-900">
						Medications
					</h2>
				</CardHeader>
				<CardContent>
					<SectionQueryState
						isPending={isPending}
						isError={isError}
						onRetry={onRetry}
						loadingLabel="Loading medications"
						errorMessage="Unable to load medications."
						isEmpty={(entries?.length ?? 0) === 0}
						emptyMessage="No medications recorded."
					>
						<ul className="space-y-3" aria-label="Medications">
							{entries?.map((entry) => (
								<li key={entry.id} className="rounded-lg border border-gray-200 p-4">
									<p className="font-medium text-gray-900">{entry.name}</p>
									<p className="mt-1 text-sm text-gray-700">
										{entry.dosage} · {entry.frequency} · {entry.route} · {entry.status}
									</p>
									<p className="mt-2 text-sm text-gray-700">{entry.instructions}</p>
								</li>
							))}
						</ul>
					</SectionQueryState>
				</CardContent>
			</Card>
		</section>
	);
}

function DocumentsSection({
	entries,
	isPending,
	isError,
	onRetry,
}: {
	entries: PatientDocument[] | undefined;
	isPending: boolean;
	isError: boolean;
	onRetry: () => void;
}) {
	return (
		<section id="documents" aria-labelledby="documents-heading" className="scroll-mt-6">
			<Card>
				<CardHeader>
					<h2 id="documents-heading" className="text-lg font-semibold text-gray-900">
						Documents
					</h2>
				</CardHeader>
				<CardContent>
					<SectionQueryState
						isPending={isPending}
						isError={isError}
						onRetry={onRetry}
						loadingLabel="Loading documents"
						errorMessage="Unable to load documents."
						isEmpty={(entries?.length ?? 0) === 0}
						emptyMessage="No documents recorded."
					>
						<ul className="space-y-3" aria-label="Documents">
							{entries?.map((entry) => (
								<li key={entry.id} className="rounded-lg border border-gray-200 p-4">
									<p className="font-medium text-gray-900">{entry.name}</p>
									<p className="mt-1 text-sm text-gray-700">
										{entry.category} · {entry.type} · {entry.uploadedAt.slice(0, 10)}
									</p>
								</li>
							))}
						</ul>
					</SectionQueryState>
				</CardContent>
			</Card>
		</section>
	);
}

function ProfileShell({title, action, children}: {title: string; action?: ReactNode; children: ReactNode}) {
	return (
		<div>
			<Link
				href="/dashboard/patients"
				className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
			>
				Back to patients
			</Link>
			<p className="mt-4 text-sm text-gray-600">Synthetic demo data. Not a real medical record.</p>
			<div className="mb-6 mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold text-gray-900">{title}</h1>
				{action}
			</div>
			{children}
		</div>
	);
}

const PatientProfile = ({patientId}: PatientProfileProps) => {
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const permissions = session?.permissions;
	const canView = !isSessionLoading && canViewPatientProfile(permissions);
	const canWrite = canView && canWritePatientDemographics(permissions);
	const canSchedule = canView && canWriteAppointments(permissions);
	const showClinical = isMockMode();
	const showMedicalRecords = showClinical && canView && canViewMedicalRecords(permissions);
	const showVitals = showClinical && canView && canViewVitals(permissions);

	const patient = usePatient(canView ? patientId : '');
	const history = usePatientHistory(patientId, showMedicalRecords);
	const vitals = usePatientVitals(patientId, showVitals);
	const medications = usePatientMedications(patientId, showMedicalRecords);
	const documents = usePatientDocuments(patientId, showMedicalRecords);

	if (isSessionLoading) {
		return (
			<ProfileShell title="Patient profile">
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading patient profile</span>
				</div>
			</ProfileShell>
		);
	}

	if (!canView) {
		return (
			<ProfileShell title="Patient profile">
				<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
					<p className="text-sm text-gray-700">You do not have access to patient profiles.</p>
				</div>
			</ProfileShell>
		);
	}

	if (patient.isPending) {
		return (
			<ProfileShell title="Patient profile">
				<div className="space-y-3" aria-busy="true">
					<div className="h-24 animate-pulse rounded-lg bg-gray-200" />
					<span className="sr-only">Loading patient</span>
				</div>
			</ProfileShell>
		);
	}

	if (patient.isError || !patient.data) {
		return (
			<ProfileShell title="Patient profile">
				<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
					<p className="text-sm text-gray-700">Unable to load this patient.</p>
					<Button type="button" className="mt-3" variant="outline" onClick={() => patient.refetch()}>
						Retry
					</Button>
				</div>
			</ProfileShell>
		);
	}

	const record = patient.data;
	const sections: ProfileSection[] = [{id: 'demographics', label: 'Demographics'}];
	if (showMedicalRecords) {
		sections.push({id: 'history', label: 'History'});
	}
	if (showVitals) {
		sections.push({id: 'vitals', label: 'Vitals'});
	}
	if (showMedicalRecords) {
		sections.push({id: 'medications', label: 'Medications'}, {id: 'documents', label: 'Documents'});
	}

	return (
		<ProfileShell
			title={`${record.firstName} ${record.lastName}`}
			action={
				canWrite || canSchedule ? (
					<div className="flex flex-wrap gap-3">
						{canSchedule && (
							<Link
								href={`/dashboard/appointments/new?patientId=${record.id}`}
								className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							>
								Schedule appointment
							</Link>
						)}
						{canWrite && (
							<Link
								href={`/dashboard/patients/${record.id}/edit`}
								className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							>
								Edit patient
							</Link>
						)}
					</div>
				) : undefined
			}
		>
			<nav aria-label="Profile sections" className="mb-6">
				<ul className="flex flex-wrap gap-2">
					{sections.map((section) => (
						<li key={section.id}>
							<a
								href={`#${section.id}`}
								className="inline-flex h-10 items-center rounded-md px-3 text-sm font-medium text-blue-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							>
								{section.label}
							</a>
						</li>
					))}
				</ul>
			</nav>
			<div className="space-y-6">
				<DemographicsSection patient={record} />
				{showMedicalRecords && (
					<HistorySection
						entries={history.data}
						isPending={history.isPending}
						isError={history.isError}
						onRetry={() => history.refetch()}
					/>
				)}
				{showVitals && (
					<VitalsSection
						entries={vitals.data}
						isPending={vitals.isPending}
						isError={vitals.isError}
						onRetry={() => vitals.refetch()}
					/>
				)}
				{showMedicalRecords && (
					<MedicationsSection
						entries={medications.data}
						isPending={medications.isPending}
						isError={medications.isError}
						onRetry={() => medications.refetch()}
					/>
				)}
				{showMedicalRecords && (
					<DocumentsSection
						entries={documents.data}
						isPending={documents.isPending}
						isError={documents.isError}
						onRetry={() => documents.refetch()}
					/>
				)}
			</div>
		</ProfileShell>
	);
};

export {PatientProfile};
