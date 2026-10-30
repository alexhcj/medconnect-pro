import {useId} from 'react';
import {DateField as UiDateField} from '@/components/ui/date-field';
import {cn} from '@/lib/utils/utils';

const controlClass =
	'h-11 w-full rounded-md border border-input bg-surface px-3 text-sm text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50';

interface SelectFieldProps {
	label: string;
	value: string;
	options: readonly string[];
	allLabel: string;
	/** Display text for option values that should not show as-is, for example `overdue` as "Overdue". */
	optionLabels?: Readonly<Record<string, string>>;
	onChange: (value: string) => void;
	disabled?: boolean;
	className?: string;
}

export function SelectField({
	label,
	value,
	options,
	allLabel,
	optionLabels,
	onChange,
	disabled,
	className,
}: SelectFieldProps) {
	const id = useId();
	// A value from the URL that is not in the curated list still shows as selected.
	const shown = value && !options.includes(value) ? [value, ...options] : options;
	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<label htmlFor={id} className="text-sm font-medium text-foreground-label">
				{label}
			</label>
			<select
				id={id}
				value={value}
				disabled={disabled}
				onChange={(event) => onChange(event.target.value)}
				className={controlClass}
			>
				<option value="">{allLabel}</option>
				{shown.map((option) => (
					<option key={option} value={option}>
						{optionLabels?.[option] ?? option}
					</option>
				))}
			</select>
		</div>
	);
}

interface DateFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	error?: string | null;
	className?: string;
}

/** Admin list date filter: the shared `DateField` (typed `MM/DD/YYYY` or calendar), at the filter-bar height. */
export function DateField({label, value, onChange, disabled, error, className}: DateFieldProps) {
	return (
		<UiDateField
			label={label}
			value={value}
			onChange={onChange}
			disabled={disabled}
			error={error}
			className={className}
			controlClassName="h-11"
		/>
	);
}
