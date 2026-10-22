'use client';

import {useEffect, useState} from 'react';
import {
	ListNotice,
	ListSkeleton,
	useFocusHeadingOnPageChange,
} from '@/components/admin/admin-list-states';
import {DateField, SelectField} from '@/components/admin/list-filter-fields';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader} from '@/components/ui/card';
import {Pagination} from '@/components/ui/pagination';
import {formatAuditDate} from '@/lib/admin/format';
import {adminLoadErrorMessage} from '@/lib/admin/load-error';
import {dateRangeError, pageRange, parseDay} from '@/lib/admin/list-params';
import {useListUrlState, type ListUrlPrefix} from '@/lib/admin/use-list-url-state';
import type {EventListParams, PagedResult} from '@/types/admin/admin-list';
import type {AuditEvent} from '@/types/admin/audit-event';

const FILTER_NAMES = ['action', 'resourceType', 'from', 'to'] as const;

export interface EventsQuery {
	data?: PagedResult<AuditEvent>;
	isPending: boolean;
	isError: boolean;
	isPlaceholderData?: boolean;
	error?: unknown;
	refetch: () => unknown;
}

interface PagedEventListProps {
	prefix: Extract<ListUrlPrefix, 'audit' | 'security'>;
	title: string;
	description: string;
	loadingLabel: string;
	emptyMessage: string;
	errorMessage: string;
	actionOptions: readonly string[];
	resourceTypeOptions: readonly string[];
	useEvents: (params: EventListParams) => EventsQuery;
}

export function PagedEventList({
	prefix,
	title,
	description,
	loadingLabel,
	emptyMessage,
	errorMessage,
	actionOptions,
	resourceTypeOptions,
	useEvents,
}: PagedEventListProps) {
	const {page, filters, setPage, setFilters} = useListUrlState(prefix, FILTER_NAMES);
	const action = filters.action;
	const resourceType = filters.resourceType;
	const from = parseDay(filters.from);
	const to = parseDay(filters.to);
	const query = useEvents({page, action, resourceType, from, to});
	const headingRef = useFocusHeadingOnPageChange(page);

	const [fromDraft, setFromDraft] = useState(from ?? '');
	const [toDraft, setToDraft] = useState(to ?? '');
	useEffect(() => {
		setFromDraft(from ?? '');
		setToDraft(to ?? '');
	}, [from, to]);
	const rangeError = dateRangeError(fromDraft || undefined, toDraft || undefined);

	const hasFilters = Boolean(action || resourceType || from || to);
	const data = query.data;
	const showFilters = hasFilters || !data || data.total > 0;
	const isBusy = query.isPlaceholderData === true;

	function applyFilters(patch: Partial<Record<(typeof FILTER_NAMES)[number], string>>) {
		setFilters({action, resourceType, from, to, ...patch});
	}

	return (
		<Card>
			<CardHeader>
				<h2
					ref={headingRef}
					tabIndex={-1}
					className="text-lg font-semibold text-gray-900 focus:outline-none"
				>
					{title}
				</h2>
				<p className="text-sm text-gray-600">{description}</p>
			</CardHeader>
			<CardContent className="space-y-3">
				{showFilters && (
					<div
						role="group"
						aria-label={`${title} filters`}
						className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-start"
					>
						<SelectField
							label="Action"
							value={action ?? ''}
							options={actionOptions}
							allLabel="All actions"
							disabled={query.isPending}
							className="md:w-56"
							onChange={(value) => applyFilters({action: value})}
						/>
						<SelectField
							label="Resource type"
							value={resourceType ?? ''}
							options={resourceTypeOptions}
							allLabel="All resource types"
							disabled={query.isPending}
							className="md:w-56"
							onChange={(value) => applyFilters({resourceType: value})}
						/>
						<DateField
							label="From"
							value={fromDraft}
							disabled={query.isPending}
							className="md:w-44"
							onChange={(value) => {
								setFromDraft(value);
								if (!dateRangeError(value || undefined, toDraft || undefined)) {
									applyFilters({from: value});
								}
							}}
						/>
						<DateField
							label="To"
							value={toDraft}
							disabled={query.isPending}
							error={rangeError}
							className="md:w-44"
							onChange={(value) => {
								setToDraft(value);
								if (!dateRangeError(fromDraft || undefined, value || undefined)) {
									applyFilters({to: value});
								}
							}}
						/>
						{hasFilters && (
							<Button
								type="button"
								variant="ghost"
								size="lg"
								className="md:mt-6"
								onClick={() => setFilters({})}
							>
								Clear filters
							</Button>
						)}
					</div>
				)}

				{query.isPending && <ListSkeleton label={loadingLabel} />}

				{query.isError && (
					<ListNotice
						tone="error"
						message={adminLoadErrorMessage(query.error, errorMessage)}
						action={{label: 'Retry', onClick: () => query.refetch()}}
					/>
				)}

				{!query.isPending && !query.isError && data && data.total === 0 && (
					<ListNotice message={hasFilters ? 'No events match these filters.' : emptyMessage} />
				)}

				{!query.isPending && !query.isError && data && data.total > 0 && data.items.length === 0 && (
					<ListNotice
						message={`Page ${page} is past the end of the results (${data.total} events).`}
						action={{label: 'Back to first page', onClick: () => setPage(1)}}
					/>
				)}

				{!query.isPending && !query.isError && data && data.items.length > 0 && (
					<>
						<p aria-live="polite" className="text-sm text-gray-600">
							Showing {pageRange(page, data.items.length).first}–
							{pageRange(page, data.items.length).last} of {data.total} events · newest first
						</p>
						<div
							className={`md:overflow-hidden md:rounded-lg md:border md:border-gray-200 ${isBusy ? 'opacity-50' : ''}`}
							aria-busy={isBusy || undefined}
						>
							<table aria-label={title} role="table" className="block w-full md:table">
								<thead role="rowgroup" className="sr-only md:not-sr-only md:table-header-group">
									<tr role="row" className="bg-gray-50">
										<th role="columnheader" scope="col" className={headerCell}>
											Action
										</th>
										<th role="columnheader" scope="col" className={headerCell}>
											Resource
										</th>
										<th role="columnheader" scope="col" className={headerCell}>
											Actor
										</th>
										<th role="columnheader" scope="col" className={`${headerCell} whitespace-nowrap md:w-px`}>
											Time
										</th>
									</tr>
								</thead>
								<tbody role="rowgroup" className="block space-y-2 md:table-row-group md:space-y-0">
									{data.items.map((event) => (
										<tr
											key={event.id}
											role="row"
											className="block rounded-lg border border-gray-200 p-4 md:table-row md:rounded-none md:border-0 md:p-0"
										>
											<td role="cell" className={`${bodyCell} font-medium text-gray-900`}>
												{event.action}
											</td>
											<td role="cell" className={`${bodyCell} text-gray-700`}>
												{event.resourceType}
												{event.resourceId ? ` ${event.resourceId}` : ''}
											</td>
											<td role="cell" className={`${bodyCell} text-gray-600`}>
												<span className="md:hidden">Actor </span>
												{event.actorUserId}
											</td>
											<td role="cell" className={`${bodyCell} text-gray-600 md:w-px md:whitespace-nowrap`}>
												{formatAuditDate(event.createdAt)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<Pagination
							label={title}
							page={page}
							total={data.total}
							disabled={isBusy}
							onPageChange={setPage}
						/>
					</>
				)}
			</CardContent>
		</Card>
	);
}

const headerCell = 'px-4 py-2 text-left text-sm font-medium text-gray-700';
const bodyCell = 'block break-words text-sm md:table-cell md:[overflow-wrap:anywhere] md:border-t md:border-gray-200 md:px-4 md:py-3';
