'use client';

import {useState} from 'react';
import {Calendar, dateFnsLocalizer} from 'react-big-calendar';
import {format, getDay, parse, startOfWeek} from 'date-fns';
import {enUS} from 'date-fns/locale';
import Link from 'next/link';
import {AppointmentEventDialog} from '@/components/appointments/appointment-event-dialog';
import {APPOINTMENT_STATE_LABELS} from '@/components/forms/appointment-form-schema';
import {Button} from '@/components/ui/button';
import {Card, CardContent} from '@/components/ui/card';
import {
	appointmentEventLabel,
	APPOINTMENT_CALENDAR_VIEWS,
	calendarRangeLabel,
	initialCalendarDate,
	navigateCalendarDate,
	toCalendarEvents,
	type AppointmentCalendarView,
	type CalendarAppointmentEvent,
	type CalendarNavigateAction,
} from '@/lib/appointments/calendar-events';
import {canWriteAppointments} from '@/lib/auth/appointment-access';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {useAppointments} from '@/lib/hooks/use-medical';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {Appointment} from '@/types/medical/appointment';

const calendarLocalizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales: {'en-US': enUS},
});

function AppointmentEvent({event}: {event: CalendarAppointmentEvent}) {
	const cancelled = event.resource.state === 'cancelled';
	const stateLabel = APPOINTMENT_STATE_LABELS[event.resource.state] ?? event.resource.state;

	return (
		<span className={`block truncate text-xs font-medium ${cancelled ? 'text-gray-600' : 'text-gray-900'}`}>
			{appointmentEventLabel(event.resource, stateLabel)}
		</span>
	);
}

function CalendarToolbar({
	date,
	view,
	onView,
	onNavigate,
}: {
	date: Date;
	view: AppointmentCalendarView;
	onView: (next: AppointmentCalendarView) => void;
	onNavigate: (action: CalendarNavigateAction) => void;
}) {
	return (
		<div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex flex-wrap gap-2">
				<Button type="button" variant="outline" aria-label="Previous period" onClick={() => onNavigate('PREV')}>
					Previous
				</Button>
				<Button type="button" variant="outline" onClick={() => onNavigate('TODAY')}>
					Today
				</Button>
				<Button type="button" variant="outline" aria-label="Next period" onClick={() => onNavigate('NEXT')}>
					Next
				</Button>
			</div>
			<p className="text-sm font-medium text-gray-900" aria-live="polite">
				{calendarRangeLabel(date, view)}
			</p>
			<div className="flex flex-wrap gap-2" role="group" aria-label="Calendar views">
				{APPOINTMENT_CALENDAR_VIEWS.map((name) => (
					<Button
						key={name}
						type="button"
						variant={view === name ? 'default' : 'outline'}
						aria-pressed={view === name}
						aria-label={name === 'month' ? 'Month view' : name === 'week' ? 'Week view' : 'Day view'}
						onClick={() => onView(name)}
					>
						{name === 'month' ? 'Month' : name === 'week' ? 'Week' : 'Day'}
					</Button>
				))}
			</div>
		</div>
	);
}

const AppointmentCalendar = () => {
	const mockMode = isMockMode();
	const {session, isLoading: isSessionLoading} = useSessionStatus();
	const canWrite = !isSessionLoading && canWriteAppointments(session?.permissions);
	const appointments = useAppointments(mockMode);
	const [view, setView] = useState<AppointmentCalendarView>('week');
	const [date, setDate] = useState<Date | undefined>(undefined);
	const [selected, setSelected] = useState<Appointment | null>(null);

	if (!mockMode) {
		return (
			<div className="rounded-lg border border-gray-200 bg-white p-4" role="status">
				<p className="text-sm text-gray-700">
					Appointment scheduling is mock-only until the appointment API is available.
				</p>
			</div>
		);
	}

	if (appointments.isPending) {
		return (
			<div className="space-y-3" aria-busy="true">
				<div className="h-72 animate-pulse rounded-lg bg-gray-200" />
				<span className="sr-only">Loading appointments</span>
			</div>
		);
	}

	if (appointments.isError) {
		return (
			<div className="rounded-lg border border-red-200 bg-white p-4" role="alert">
				<p className="text-sm text-gray-700">Unable to load appointments.</p>
				<Button type="button" className="mt-3" variant="outline" onClick={() => appointments.refetch()}>
					Retry
				</Button>
			</div>
		);
	}

	const events = toCalendarEvents(appointments.data ?? []);
	const calendarDate = date ?? initialCalendarDate(appointments.data ?? []);

	return (
		<Card>
			<CardContent className="pt-6">
				{canWrite && (
					<div className="mb-4 flex justify-end">
						<Link
							href="/dashboard/appointments/new"
							className="inline-flex h-10 items-center text-sm font-medium text-blue-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
						>
							Schedule appointment
						</Link>
					</div>
				)}
				<CalendarToolbar
					date={calendarDate}
					view={view}
					onView={setView}
					onNavigate={(action) => setDate(navigateCalendarDate(calendarDate, view, action))}
				/>
				{events.length === 0 ? (
					<p className="text-sm text-gray-600">No appointments scheduled.</p>
				) : (
					<div className="appointment-calendar overflow-x-auto" role="region" aria-label="Appointment calendar">
						<Calendar
							localizer={calendarLocalizer}
							events={events}
							date={calendarDate}
							view={view}
							views={[...APPOINTMENT_CALENDAR_VIEWS]}
							toolbar={false}
							selectable={false}
							culture="en-US"
							startAccessor="start"
							endAccessor="end"
							titleAccessor={(event) =>
								appointmentEventLabel(
									event.resource,
									APPOINTMENT_STATE_LABELS[event.resource.state] ?? event.resource.state,
								)
							}
							tooltipAccessor={(event) => {
								const stateLabel = APPOINTMENT_STATE_LABELS[event.resource.state] ?? event.resource.state;
								return `${event.title}, ${stateLabel}`;
							}}
							onNavigate={(nextDate) => setDate(nextDate)}
							onView={(nextView) => {
								if (APPOINTMENT_CALENDAR_VIEWS.includes(nextView as AppointmentCalendarView)) {
									setView(nextView as AppointmentCalendarView);
								}
							}}
							onSelectEvent={(event, nativeEvent) => {
								nativeEvent?.stopPropagation();
								setSelected(event.resource);
							}}
							components={{event: AppointmentEvent}}
							eventPropGetter={(event) => ({
								className:
									event.resource.state === 'cancelled' ? 'appointment-calendar-event--cancelled' : undefined,
							})}
						/>
					</div>
				)}
			</CardContent>
			<AppointmentEventDialog
				appointment={selected}
				permissions={session?.permissions}
				onClose={() => setSelected(null)}
			/>
		</Card>
	);
};

export {AppointmentCalendar};
