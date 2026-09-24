import {addDays, addMonths, addWeeks, format, startOfWeek} from 'date-fns';
import {enUS} from 'date-fns/locale';
import {Appointment} from '@/types/medical/appointment';

export const APPOINTMENT_CALENDAR_VIEWS = ['month', 'week', 'day'] as const;

export type AppointmentCalendarView = (typeof APPOINTMENT_CALENDAR_VIEWS)[number];

export type CalendarNavigateAction = 'PREV' | 'NEXT' | 'TODAY';

export interface CalendarAppointmentEvent {
	id: string;
	title: string;
	start: Date;
	end: Date;
	resource: Appointment;
}

export function parseAppointmentInstant(value: string): Date | undefined {
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return undefined;
	}
	return date;
}

export function appointmentTitle(appointment: Appointment): string {
	return `${appointment.patientName} · ${appointment.providerName}`;
}

export function appointmentEventLabel(appointment: Appointment, stateLabel: string): string {
	return `${appointmentTitle(appointment)} · ${stateLabel}`;
}

export function toCalendarEvents(appointments: readonly Appointment[]): CalendarAppointmentEvent[] {
	const events: CalendarAppointmentEvent[] = [];
	for (const appointment of appointments) {
		const start = parseAppointmentInstant(appointment.start);
		const end = parseAppointmentInstant(appointment.end);
		if (!start || !end) {
			continue;
		}
		events.push({
			id: appointment.id,
			title: appointmentTitle(appointment),
			start,
			end,
			resource: appointment,
		});
	}
	return events;
}

function earliestStart(events: readonly CalendarAppointmentEvent[]): Date | undefined {
	if (events.length === 0) {
		return undefined;
	}
	return events.reduce(
		(earliest, event) => (event.start < earliest ? event.start : earliest),
		events[0].start,
	);
}

export function initialCalendarDate(appointments: readonly Appointment[], now = new Date()): Date {
	const events = toCalendarEvents(appointments);
	const nonCancelled = events.filter((event) => event.resource.state !== 'cancelled');
	return earliestStart(nonCancelled) ?? earliestStart(events) ?? now;
}

export function navigateCalendarDate(
	date: Date,
	view: AppointmentCalendarView,
	action: CalendarNavigateAction,
	now = new Date(),
): Date {
	if (action === 'TODAY') {
		return now;
	}
	const delta = action === 'NEXT' ? 1 : -1;
	if (view === 'month') {
		return addMonths(date, delta);
	}
	if (view === 'day') {
		return addDays(date, delta);
	}
	return addWeeks(date, delta);
}

export function calendarRangeLabel(date: Date, view: AppointmentCalendarView): string {
	if (view === 'month') {
		return format(date, 'MMMM yyyy', {locale: enUS});
	}
	if (view === 'day') {
		return format(date, 'EEEE, MMM d, yyyy', {locale: enUS});
	}
	const start = startOfWeek(date, {locale: enUS, weekStartsOn: 0});
	const end = addDays(start, 6);
	return `${format(start, 'MMM d', {locale: enUS})} – ${format(end, 'MMM d, yyyy', {locale: enUS})}`;
}
