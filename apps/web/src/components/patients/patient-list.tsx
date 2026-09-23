'use client';

import Link from 'next/link';
import {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {PatientNameSort, PatientStatusFilter} from '@/lib/api/medical-api';
import {canWritePatientDemographics} from '@/lib/auth/patient-profile-access';
import {usePatientSearch} from '@/lib/hooks/use-medical';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {Patient} from '@/types/medical/patient';

function useDebouncedValue<T>(value: T, delayMs: number): T {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timeoutId = window.setTimeout(() => setDebounced(value), delayMs);
		return () => window.clearTimeout(timeoutId);
	}, [value, delayMs]);

	return debounced;
}

function statusLabel(status: Patient['status']) {
	return status === 'active' ? 'Active' : 'Inactive';
}

const PatientList = () => {
	const [searchTerm, setSearchTerm] = useState('');
	const [status, setStatus] = useState<PatientStatusFilter>('all');
	const [sort, setSort] = useState<PatientNameSort>('name-asc');
	const debouncedQuery = useDebouncedValue(searchTerm, 300);
	const {
		data,
		isPending,
		isError,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = usePatientSearch({query: debouncedQuery, status, sort});

	const patients = data?.pages.flatMap((page) => page.patients) ?? [];
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canWrite = !isSessionLoading && canWritePatientDemographics(session?.permissions);

	return (
		<Card>
			<CardHeader>
				{canWrite && (
					<div className="mb-4 flex justify-end">
						<Link
							href="/dashboard/patients/new"
							className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						>
							Add patient
						</Link>
					</div>
				)}
				<div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<div className="sm:col-span-2 lg:col-span-1">
						<label htmlFor="patient-search" className="mb-2 block text-sm font-medium text-gray-700">
							Search patients
						</label>
						<Input
							id="patient-search"
							type="search"
							placeholder="Name, email, phone, or ID"
							value={searchTerm}
							onChange={(event) => setSearchTerm(event.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="patient-status" className="mb-2 block text-sm font-medium text-gray-700">
							Status
						</label>
						<select
							id="patient-status"
							value={status}
							onChange={(event) => setStatus(event.target.value as PatientStatusFilter)}
							className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="all">All statuses</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
					<div>
						<label htmlFor="patient-sort" className="mb-2 block text-sm font-medium text-gray-700">
							Sort by name
						</label>
						<select
							id="patient-sort"
							value={sort}
							onChange={(event) => setSort(event.target.value as PatientNameSort)}
							className="flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="name-asc">Last name A–Z</option>
							<option value="name-desc">Last name Z–A</option>
						</select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				{isPending && (
					<div className="space-y-3" aria-busy="true">
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<div className="h-20 animate-pulse rounded-lg bg-gray-200" />
						<span className="sr-only">Loading patients</span>
					</div>
				)}

				{isError && (
					<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
						<p className="text-sm text-gray-700">Unable to load patients.</p>
						<Button type="button" className="mt-3" variant="outline" onClick={() => refetch()}>
							Retry
						</Button>
					</div>
				)}

				{!isPending && !isError && patients.length === 0 && (
					<p className="text-sm text-gray-600">No patients match your search.</p>
				)}

				{!isPending && !isError && patients.length > 0 && (
					<ul className="space-y-3" aria-label="Patients">
						{patients.map((patient) => (
							<li
								key={patient.id}
								className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
							>
								<div>
									<p className="font-medium text-gray-900">
										{patient.firstName} {patient.lastName}
									</p>
									<p className="mt-1 text-sm text-gray-700">{statusLabel(patient.status)}</p>
									<Link
										href={`/dashboard/patients/${patient.id}`}
										aria-label={`View profile for ${patient.firstName} ${patient.lastName}`}
										className="mt-2 inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
									>
										View profile
									</Link>
								</div>
								<div className="flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:gap-4">
									<span>{patient.email}</span>
									<span>{patient.phone}</span>
								</div>
							</li>
						))}
					</ul>
				)}

				{!isPending && !isError && hasNextPage && (
					<div className="mt-4">
						<Button
							type="button"
							variant="outline"
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
						>
							{isFetchingNextPage ? 'Loading more patients' : 'Load more'}
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export {PatientList};
