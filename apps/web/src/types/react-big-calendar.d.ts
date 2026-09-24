declare module 'react-big-calendar' {
	import type {CSSProperties, ComponentType, ReactElement, ReactNode} from 'react';

	export type View = 'month' | 'week' | 'work_week' | 'day' | 'agenda';
	export type NavigateAction = 'PREV' | 'NEXT' | 'TODAY' | 'DATE';

	export const Views: {
		MONTH: 'month';
		WEEK: 'week';
		WORK_WEEK: 'work_week';
		DAY: 'day';
		AGENDA: 'agenda';
	};

	export const Navigate: {
		PREVIOUS: 'PREV';
		NEXT: 'NEXT';
		TODAY: 'TODAY';
		DATE: 'DATE';
	};

	export function dateFnsLocalizer(config: {
		format: (date: Date, formatStr: string, options?: object) => string;
		parse: (value: string, formatStr: string, backupDate: Date, options?: object) => Date;
		startOfWeek: (date: Date, options?: object) => Date;
		getDay: (date: Date) => number;
		locales: Record<string, unknown>;
	}): unknown;

	export interface Event {
		title?: ReactNode;
		start?: Date;
		end?: Date;
		allDay?: boolean;
		resource?: unknown;
	}

	export interface CalendarProps<TEvent extends object = Event> {
		localizer: unknown;
		events?: TEvent[];
		date?: Date;
		view?: View;
		views?: View[];
		toolbar?: boolean;
		selectable?: boolean;
		className?: string;
		culture?: string;
		startAccessor?: keyof TEvent | ((event: TEvent) => Date);
		endAccessor?: keyof TEvent | ((event: TEvent) => Date);
		titleAccessor?: keyof TEvent | ((event: TEvent) => string);
		tooltipAccessor?: keyof TEvent | ((event: TEvent) => string);
		onNavigate?: (newDate: Date, view: View, action: NavigateAction) => void;
		onView?: (view: View) => void;
		onSelectEvent?: (event: TEvent, e?: {stopPropagation: () => void; preventDefault: () => void}) => void;
		components?: {
			event?: ComponentType<{event: TEvent}>;
			toolbar?: ComponentType<unknown>;
		};
		eventPropGetter?: (event: TEvent) => {className?: string; style?: CSSProperties};
	}

	export function Calendar<TEvent extends object = Event>(props: CalendarProps<TEvent>): ReactElement;
}
