import {useId} from 'react';
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

export function DateField({label, value, onChange, disabled, error, className}: DateFieldProps) {
	const id = useId();
	const errorId = `${id}-error`;
	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<label htmlFor={id} className="text-sm font-medium text-foreground-label">
				{label}
			</label>
			<input
				id={id}
				type="date"
				value={value}
				disabled={disabled}
				aria-invalid={error ? true : undefined}
				aria-describedby={error ? errorId : undefined}
				onChange={(event) => onChange(event.target.value)}
				className={cn(controlClass, error && 'border-danger')}
			/>
			{error && (
				<p id={errorId} role="alert" className="text-sm text-danger">
					{error}
				</p>
			)}
		</div>
	);
}
