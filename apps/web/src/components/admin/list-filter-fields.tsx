import {DateField as UiDateField} from '@/components/ui/date-field';
import {SelectField as UiSelectField} from '@/components/ui/select-field';

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

/** Admin list filter: the shared `SelectField` with an "All …" first choice (empty value). */
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
	// A value from the URL that is not in the curated list still shows as selected.
	const shown = value && !options.includes(value) ? [value, ...options] : options;
	return (
		<UiSelectField
			label={label}
			value={value}
			options={[
				{value: '', label: allLabel},
				...shown.map((option) => ({value: option, label: optionLabels?.[option] ?? option})),
			]}
			onChange={onChange}
			disabled={disabled}
			className={className}
		/>
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

/** Admin list date filter: the shared `DateField` (typed `MM/DD/YYYY` or calendar). */
export function DateField({label, value, onChange, disabled, error, className}: DateFieldProps) {
	return (
		<UiDateField
			label={label}
			value={value}
			onChange={onChange}
			disabled={disabled}
			error={error}
			className={className}
		/>
	);
}
