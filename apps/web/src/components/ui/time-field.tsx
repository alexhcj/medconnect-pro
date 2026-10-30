'use client';

import {useId, useMemo, useState, type Ref} from 'react';
import {Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions} from '@headlessui/react';
import {Check, Clock} from 'lucide-react';
import {formControlClassName} from '@/components/forms/form-field-styles';
import {formatTimeValue, parseTime, timeOptions} from '@/lib/format/date-input';
import {cn} from '@/lib/utils/utils';

const OPTIONS = timeOptions(15);

export interface TimeFieldProps {
	/** Accessible name, for example "Start time". The visible label is the parent's legend. */
	label: string;
	/** `HH:mm` (24-hour), or empty. */
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	/** Earlier times are shown but cannot be chosen (for example an end before its start). */
	minTime?: string;
	disabled?: boolean;
	invalid?: boolean;
	describedBy?: string;
	id?: string;
	className?: string;
	inputRef?: Ref<HTMLInputElement>;
}

function compact(text: string): string {
	return text.toLowerCase().replace(/[\s.]/g, '');
}

/**
 * Typeable time combobox (FE-057): 15-minute steps in `h:mm AM/PM`. Typing `7p` or `7:30 pm` works
 * without opening the list; the list filters as you type and the value commits on Enter or blur.
 */
export function TimeField({
	label,
	value,
	onChange,
	onBlur,
	minTime,
	disabled,
	invalid,
	describedBy,
	id: idProp,
	className,
	inputRef,
}: TimeFieldProps) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const [query, setQuery] = useState<string | null>(null);

	const options = useMemo(() => {
		const typed = query === null ? '' : compact(query);
		if (!typed) {
			return OPTIONS;
		}
		// Headless UI picks the first listed option on Tab, so a complete entry such as `7p` or
		// `7:30pm` lists only the step it means, and a partial one (`7`, `7:3`) lists the steps it starts.
		const parsed = /[^0-9]/.test(typed) ? parseTime(typed) : null;
		if (parsed) {
			return OPTIONS.filter((option) => option.value === parsed);
		}
		return OPTIONS.filter((option) => compact(option.label).startsWith(typed));
	}, [query]);

	function commitTyped() {
		if (query === null) {
			return;
		}
		const typed = query.trim();
		setQuery(null);
		if (!typed) {
			onChange('');
			return;
		}
		const parsed = parseTime(typed);
		if (parsed) {
			// Snap to the list only when it is a listed step; any valid minute is kept as typed.
			onChange(parsed);
		}
	}

	return (
		<Combobox
			value={value}
			onChange={(next: string | null) => {
				setQuery(null);
				onChange(next ?? '');
			}}
			disabled={disabled}
			immediate
		>
			<div className={cn('relative', className)}>
				<ComboboxInput
					id={id}
					ref={inputRef}
					aria-label={label}
					aria-invalid={invalid ? true : undefined}
					aria-describedby={describedBy}
					autoComplete="off"
					placeholder="h:mm AM/PM"
					displayValue={(selected: string) => (selected ? formatTimeValue(selected) : '')}
					onChange={(event) => setQuery(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === 'Enter' && query !== null && options.length === 0) {
							commitTyped();
						}
					}}
					onBlur={() => {
						commitTyped();
						onBlur?.();
					}}
					className={cn(
						formControlClassName,
						'mt-0 pr-10 placeholder:text-foreground-placeholder disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-muted',
						invalid && 'border-danger focus-visible:ring-ring-danger',
					)}
				/>
				<ComboboxButton
					aria-label={`Show ${label.toLowerCase()} list`}
					className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-foreground-secondary hover:bg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:text-foreground-placeholder disabled:hover:bg-transparent max-sm:size-11"
				>
					<Clock aria-hidden="true" className="size-[18px]" />
				</ComboboxButton>
			</div>
			<ComboboxOptions
				anchor={{to: 'bottom end', gap: 6, padding: 8}}
				className="z-50 max-h-60 w-40 overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg empty:invisible"
			>
				{options.map((option) => {
					const earlier = Boolean(minTime && option.value < minTime);
					return (
						<ComboboxOption
							key={option.value}
							value={option.value}
							disabled={earlier}
							className="group flex min-h-9 cursor-pointer items-center justify-between rounded-md px-3 text-sm text-foreground data-disabled:cursor-not-allowed data-disabled:text-foreground-placeholder data-disabled:line-through data-focus:bg-subtle data-selected:bg-brand-subtle data-selected:font-medium data-selected:text-brand-strong"
						>
							{option.label}
							<Check aria-hidden="true" className="hidden size-4 group-data-selected:block" />
						</ComboboxOption>
					);
				})}
			</ComboboxOptions>
		</Combobox>
	);
}
