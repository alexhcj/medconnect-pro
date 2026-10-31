'use client';

import {useEffect, useRef} from 'react';
import {DayPicker, type ChevronProps, type DayButtonProps} from 'react-day-picker';
import {enUS} from 'react-day-picker/locale';
import {ChevronLeft, ChevronRight} from 'lucide-react';
import {cn} from '@/lib/utils/utils';

/** Local calendar date for a `YYYY-MM-DD` day (no UTC conversion). */
export function dayToDate(day: string): Date | undefined {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
	if (!match) {
		return undefined;
	}
	return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/** `YYYY-MM-DD` for a local calendar date. */
export function dateToDay(date: Date): string {
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${String(date.getFullYear()).padStart(4, '0')}-${month}-${day}`;
}

/**
 * Lets the grid's roving focus (arrows, PageUp/PageDown, Home/End) move DOM focus to the day.
 * `preventScroll`: on open the panel is focused before its anchor position is applied, so a plain
 * `focus()` scrolls the page to where the panel briefly sits (the top of a long page).
 */
function CalendarDayButton({day, modifiers, className, ...props}: DayButtonProps) {
	const ref = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (modifiers.focused) {
			ref.current?.focus({preventScroll: true});
		}
	}, [modifiers.focused]);
	return (
		<button
			ref={ref}
			{...props}
			data-day={dateToDay(day.date)}
			className={cn(
				'relative flex size-10 items-center justify-center rounded-full text-sm text-foreground max-sm:size-11',
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
				!modifiers.selected && !modifiers.disabled && 'hover:bg-subtle',
				modifiers.today && !modifiers.selected && 'border border-border-brand font-semibold text-brand',
				// Outside days stay clickable, so they need 4.5:1 text (muted), not the placeholder grey.
				modifiers.outside && !modifiers.selected && 'text-foreground-muted',
				modifiers.selected && 'bg-brand font-semibold text-inverse hover:bg-brand-hover',
				modifiers.disabled && 'cursor-not-allowed text-foreground-placeholder line-through',
				className,
			)}
		>
			{props.children}
			{modifiers.today && !modifiers.selected && (
				<span aria-hidden="true" className="absolute bottom-1 size-1 rounded-full bg-brand" />
			)}
		</button>
	);
}

function CalendarChevron({orientation}: ChevronProps) {
	const Icon = orientation === 'left' ? ChevronLeft : ChevronRight;
	return <Icon aria-hidden="true" className="size-4" />;
}

const navButton =
	'flex size-9 items-center justify-center rounded-md border border-border bg-surface text-foreground-secondary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:cursor-not-allowed aria-disabled:opacity-40 max-sm:size-11';

interface CalendarProps {
	/** Selected day, `YYYY-MM-DD`; empty for none. */
	value: string;
	onSelect: (day: string) => void;
	month: Date;
	onMonthChange: (month: Date) => void;
	/** Earliest and latest selectable day, `YYYY-MM-DD`. */
	min?: string;
	max?: string;
}

/**
 * Month grid for `DateField` (react-day-picker v9, bundled, styled with design tokens). Keyboard:
 * arrows move by day/week, PageUp/PageDown by month (Shift: year), Home/End to the week edge.
 */
export function Calendar({value, onSelect, month, onMonthChange, min, max}: CalendarProps) {
	const selected = dayToDate(value);
	const minDate = min ? dayToDate(min) : undefined;
	const maxDate = max ? dayToDate(max) : undefined;
	return (
		<DayPicker
			mode="single"
			required
			autoFocus
			locale={enUS}
			weekStartsOn={0}
			fixedWeeks
			showOutsideDays
			navLayout="around"
			selected={selected}
			onSelect={(date) => date && onSelect(dateToDay(date))}
			month={month}
			onMonthChange={onMonthChange}
			startMonth={minDate ?? new Date(1900, 0)}
			endMonth={maxDate ?? new Date(2100, 11)}
			disabled={[...(minDate ? [{before: minDate}] : []), ...(maxDate ? [{after: maxDate}] : [])]}
			labels={{
				labelPrevious: () => 'Previous month',
				labelNext: () => 'Next month',
			}}
			components={{DayButton: CalendarDayButton, Chevron: CalendarChevron}}
			classNames={{
				root: 'w-full',
				months: 'w-full',
				month: 'grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-2',
				month_caption: 'flex items-center justify-center',
				caption_label: 'text-sm font-semibold text-foreground',
				button_previous: navButton,
				button_next: navButton,
				month_grid: 'col-span-3 w-full border-collapse',
				weekday: 'h-6 text-center text-xs font-medium text-foreground-muted',
				week: '',
				day: 'p-0 text-center',
				day_button: '',
			}}
		/>
	);
}
