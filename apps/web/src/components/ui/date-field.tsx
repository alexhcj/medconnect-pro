'use client';

import {useEffect, useId, useState, useSyncExternalStore, type Ref} from 'react';
import {Popover, PopoverBackdrop, PopoverButton, PopoverPanel} from '@headlessui/react';
import {Calendar as CalendarIcon, CircleAlert, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Calendar, dayToDate} from '@/components/ui/calendar';
import {formControlClassName} from '@/components/forms/form-field-styles';
import {
	dateErrorMessage,
	maskUsDate,
	parseUsDate,
	todayDay,
} from '@/lib/format/date-input';
import {formatDateOnly, formatDateOnlyLong} from '@/lib/format/date';
import {cn} from '@/lib/utils/utils';

const SHEET_QUERY = '(max-width: 639px)';

function subscribeSheet(onChange: () => void) {
	if (typeof window.matchMedia !== 'function') {
		return () => {};
	}
	const query = window.matchMedia(SHEET_QUERY);
	query.addEventListener('change', onChange);
	return () => query.removeEventListener('change', onChange);
}

/** Below 640 px the calendar opens as a bottom sheet instead of a popover next to the field. */
function useSheetLayout(): boolean {
	return useSyncExternalStore(
		subscribeSheet,
		() => typeof window.matchMedia === 'function' && window.matchMedia(SHEET_QUERY).matches,
		() => false,
	);
}

export interface DateFieldProps {
	label: string;
	/** `YYYY-MM-DD`, or empty. */
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	id?: string;
	name?: string;
	/** Earliest and latest allowed day, `YYYY-MM-DD`. */
	min?: string;
	max?: string;
	required?: boolean;
	disabled?: boolean;
	/** Error from the form (for example the schema); a typing error from the field itself shows first. */
	error?: string | null;
	/** Mark the input invalid when the error text is shown elsewhere (for example by `DateTimeField`). */
	invalid?: boolean;
	/** Extra element ids that describe the input, for an error shown elsewhere. */
	describedBy?: string;
	/** Format hint, linked as the description. `null` hides it (used inside `DateTimeField`). */
	hint?: string | null;
	autoComplete?: string;
	/** Visually hide the label (it stays for screen readers). */
	hideLabel?: boolean;
	/** Accessible name prefix for the calendar button; defaults to "Choose date". */
	chooseLabel?: string;
	/** Show a Clear button in the calendar. Use on optional fields only. */
	clearable?: boolean;
	className?: string;
	controlClassName?: string;
	inputRef?: Ref<HTMLInputElement>;
}

/**
 * Accessible date field (FE-057): a masked `MM/DD/YYYY` text input plus a calendar popover. Typing
 * always works without the calendar. The value stays `YYYY-MM-DD`, so schemas and the API do not change.
 */
export function DateField({
	label,
	value,
	onChange,
	onBlur,
	id: idProp,
	name,
	min,
	max,
	required,
	disabled,
	error,
	invalid,
	describedBy,
	hint = 'MM/DD/YYYY',
	autoComplete,
	hideLabel,
	chooseLabel = 'Choose date',
	clearable,
	className,
	controlClassName,
	inputRef,
}: DateFieldProps) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const hintId = `${id}-hint`;
	const errorId = `${id}-error`;
	const isSheet = useSheetLayout();

	const [text, setText] = useState(() => (value ? formatDateOnly(value) : ''));
	const [typingError, setTypingError] = useState<string | null>(null);
	const [viewMonth, setViewMonth] = useState<Date>(() => new Date());

	// Follow outside changes (form reset, edit prefill) without clobbering half-typed text.
	useEffect(() => {
		const typed = parseUsDate(text).value ?? '';
		if (value !== typed) {
			setText(value ? formatDateOnly(value) : '');
			setTypingError(null);
		}
		// `text` is read, not a trigger: only a changed `value` should reset it.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	const limits = {min, max};
	const shownError = typingError ?? error ?? null;

	function commit(day: string) {
		setText(formatDateOnly(day));
		setTypingError(null);
		onChange(day);
	}

	function handleInput(raw: string) {
		const masked = maskUsDate(raw);
		setText(masked);
		if (!masked) {
			setTypingError(null);
			onChange('');
			return;
		}
		const parsed = parseUsDate(masked);
		if (parsed.value) {
			const checked = parseUsDate(masked, limits);
			setTypingError(checked.error ? dateErrorMessage(checked.error, limits) : null);
			onChange(parsed.value);
			return;
		}
		// A full-length entry that is not a real date is wrong now; a partial one waits for blur.
		setTypingError(masked.length === 10 ? dateErrorMessage(parsed.error ?? 'invalid', limits) : null);
		onChange('');
	}

	function handleBlur() {
		const parsed = parseUsDate(text);
		if (text && parsed.error) {
			setTypingError(dateErrorMessage(parsed.error, limits));
		}
		onBlur?.();
	}

	function openMonth() {
		const today = todayDay();
		let start = value || today;
		if (!value && max && today > max) {
			start = max;
		}
		if (!value && min && today < min) {
			start = min;
		}
		setViewMonth(dayToDate(start) ?? new Date());
	}

	const today = todayDay();
	const todayAllowed = (!min || today >= min) && (!max || today <= max);
	const buttonName = value ? `${chooseLabel}, selected date is ${formatDateOnlyLong(value)}` : chooseLabel;

	return (
		<div className={className}>
			<label
				htmlFor={id}
				className={cn('block text-sm font-medium text-foreground-label', hideLabel && 'sr-only')}
			>
				{label}
				{required && <span className="ml-1 text-danger">*</span>}
			</label>
			<Popover className={cn('relative', !hideLabel && 'mt-1')}>
				<input
					ref={inputRef}
					id={id}
					name={name}
					type="text"
					inputMode="numeric"
					autoComplete={autoComplete}
					placeholder="MM/DD/YYYY"
					maxLength={10}
					value={text}
					disabled={disabled}
					required={required}
					aria-invalid={shownError || invalid ? true : undefined}
					aria-describedby={
						[shownError ? errorId : hint ? hintId : undefined, describedBy].filter(Boolean).join(' ') || undefined
					}
					onChange={(event) => handleInput(event.target.value)}
					onBlur={handleBlur}
					className={cn(
						formControlClassName,
						'mt-0 pr-12 placeholder:text-foreground-placeholder disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-muted',
						(shownError || invalid) && 'border-danger focus-visible:ring-ring-danger',
						controlClassName,
					)}
				/>
				<PopoverButton
					disabled={disabled}
					aria-label={buttonName}
					onClick={openMonth}
					className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-foreground-secondary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-foreground-placeholder disabled:hover:bg-transparent"
				>
					<CalendarIcon aria-hidden="true" className="size-[18px]" />
				</PopoverButton>
				{isSheet && <PopoverBackdrop className="fixed inset-0 z-40 bg-overlay" />}
				<PopoverPanel
					role="dialog"
					aria-label={`Choose ${label.toLowerCase()}`}
					aria-modal={isSheet ? true : undefined}
					anchor={isSheet ? undefined : {to: 'bottom end', gap: 6, padding: 8}}
					className={cn(
						'z-50 bg-surface',
						isSheet
							? 'fixed inset-x-0 bottom-0 rounded-t-xl p-4 pb-6 shadow-xl'
							: 'w-[19.5rem] rounded-xl border border-border p-3 shadow-lg',
					)}
				>
					{({close}) => (
						<div className="space-y-3">
							{isSheet && (
								<div className="flex items-center justify-between">
									<p className="text-lg font-semibold text-foreground">{label}</p>
									<button
										type="button"
										onClick={() => close()}
										aria-label="Close calendar"
										className="flex size-11 items-center justify-center rounded-md text-foreground-secondary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
									>
										<X aria-hidden="true" className="size-5" />
									</button>
								</div>
							)}
							<Calendar
								value={value}
								min={min}
								max={max}
								month={viewMonth}
								onMonthChange={setViewMonth}
								onSelect={(day) => {
									commit(day);
									close();
								}}
							/>
							<div className={cn('flex items-center', clearable ? 'justify-between' : 'justify-start')}>
								<Button
									type="button"
									variant={isSheet ? 'outline' : 'ghost'}
									size={isSheet ? 'lg' : 'sm'}
									className={isSheet && !clearable ? 'w-full' : undefined}
									disabled={!todayAllowed}
									onClick={() => {
										commit(today);
										close();
									}}
								>
									Today
								</Button>
								{clearable && (
									<Button
										type="button"
										variant={isSheet ? 'outline' : 'ghost'}
										size={isSheet ? 'lg' : 'sm'}
										onClick={() => {
											setText('');
											setTypingError(null);
											onChange('');
											close();
										}}
									>
										Clear
									</Button>
								)}
							</div>
						</div>
					)}
				</PopoverPanel>
			</Popover>
			{shownError ? (
				<p id={errorId} role="alert" className="mt-1 flex items-center gap-1.5 text-sm text-danger">
					<CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
					{shownError}
				</p>
			) : (
				hint && (
					<p id={hintId} className="mt-1 text-xs text-foreground-muted">
						{hint}
					</p>
				)
			)}
		</div>
	);
}
