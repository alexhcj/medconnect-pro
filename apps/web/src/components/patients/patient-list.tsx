'use client';

import Link from 'next/link';
import {useEffect, useRef, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {SimplePagination} from '@/components/ui/simple-pagination';
import {PatientNameSort, PatientStatusFilter} from '@/lib/api/medical-api';
import {useListUrlState} from '@/lib/admin/use-list-url-state';
import {canWritePatientDemographics} from '@/lib/auth/patient-profile-access';
import {usePatientPage} from '@/lib/hooks/use-medical';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {
	DEFAULT_PATIENT_SORT,
	DEFAULT_PATIENT_STATUS,
	parsePatientSort,
	parsePatientStatus,
	patientPageRange,
} from '@/lib/patients/list-params';
import {Patient} from '@/types/medical/patient';

const FILTER_NAMES = ['q', 'status', 'sort'] as const;
const SEARCH_DEBOUNCE_MS = 300;

function statusLabel(status: Patient['status']) {
	return status === 'active' ? 'Active' : 'Inactive';
}

const PatientList = () => {
	const {page, filters, setPage, setFilters} = useListUrlState('patients', FILTER_NAMES);
	const urlQuery = filters.q ?? '';
	const status = parsePatientStatus(filters.status);
	const sort = parsePatientSort(filters.sort);

	const [searchTerm, setSearchTerm] = useState(urlQuery);
	const searchTimer = useRef<number | undefined>(undefined);
	const listRegion = useRef<HTMLDivElement>(null);
	const shownPage = useRef(page);

	const {data, isPending, isError, refetch, isPlaceholderData} = usePatientPage({
		query: urlQuery,
		status,
		sort,
		page,
	});

	const patients = data?.patients ?? [];
	const hasNext = data?.hasMore ?? false;
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canWrite = !isSessionLoading && canWritePatientDemographics(session?.permissions);

	// Back/forward changes the URL query; follow it unless the user is mid-typing.
	useEffect(() => {
		if (searchTimer.current === undefined) {
			setSearchTerm(urlQuery);
		}
	}, [urlQuery]);

	useEffect(() => () => window.clearTimeout(searchTimer.current), []);

	// Keep keyboard and screen-reader position on the list after Previous/Next.
	useEffect(() => {
		if (shownPage.current !== page) {
			shownPage.current = page;
			listRegion.current?.focus({preventScroll: true});
		}
	}, [page]);

	// Selects can change faster than the router commits the URL; remember the last value written.
	const pending = useRef({status, sort});
	useEffect(() => {
		pending.current = {status, sort};
	}, [status, sort]);

	function applyFilters(change: {q: string; status?: PatientStatusFilter; sort?: PatientNameSort}) {
		const next = {q: change.q, status: change.status ?? pending.current.status, sort: change.sort ?? pending.current.sort};
		pending.current = {status: next.status, sort: next.sort};
		window.clearTimeout(searchTimer.current);
		searchTimer.current = undefined;
		setFilters({
			q: next.q,
			status: next.status === DEFAULT_PATIENT_STATUS ? undefined : next.status,
			sort: next.sort === DEFAULT_PATIENT_SORT ? undefined : next.sort,
		});
	}

	function handleSearchChange(value: string) {
		setSearchTerm(value);
		window.clearTimeout(searchTimer.current);
		searchTimer.current = window.setTimeout(() => applyFilters({q: value}), SEARCH_DEBOUNCE_MS);
	}

	const showPager = !isPending && !isError && (page > 1 || hasNext);

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
							onChange={(event) => handleSearchChange(event.target.value)}
						/>
					</div>
					<div>
						<label htmlFor="patient-status" className="mb-2 block text-sm font-medium text-gray-700">
							Status
						</label>
						<select
							id="patient-status"
							value={status}
							onChange={(event) =>
								applyFilters({q: searchTerm, status: event.target.value as PatientStatusFilter})
							}
							className="flex h-11 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
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
							onChange={(event) =>
								applyFilters({q: searchTerm, sort: event.target.value as PatientNameSort})
							}
							className="flex h-11 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<option value="name-asc">Last name A–Z</option>
							<option value="name-desc">Last name Z–A</option>
						</select>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div ref={listRegion} tabIndex={-1} className="focus:outline-none" aria-busy={isPlaceholderData}>
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
				</div>

				{showPager && (
					<div className="mt-4">
						<SimplePagination
							label="Patients"
							page={page}
							hasNext={hasNext}
							range={patientPageRange(page, patients.length)}
							disabled={isPlaceholderData}
							onPageChange={setPage}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
};

export {PatientList};
