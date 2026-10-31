'use client';

import {useId, type KeyboardEvent, type Ref} from 'react';
import {Description, Field, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions} from '@headlessui/react';
import {Check, ChevronDown, CircleAlert} from 'lucide-react';
import {cn} from '@/lib/utils/utils';

export interface SelectOption {
	value: string;
	label: string;
	disabled?: boolean;
}

export interface SelectFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
	options: readonly SelectOption[];
	/**
	 * Shown in the placeholder colour while `value` is empty, and listed as the first (empty) choice.
	 * Leave it out when `options` already holds an empty-value choice such as "All statuses".
	 */
	placeholder?: string;
	onBlur?: () => void;
	error?: string | null;
	/** A short live status linked to the trigger, for example "Role updated" after a save. */
	status?: string | null;
	disabled?: boolean;
	required?: boolean;
	/** `compact` is the narrower table-row select; the height is the shared 40 px either way. */
	size?: 'default' | 'compact';
	/** Hide the visible label from sighted users on some widths, for example `md:sr-only`. */
	labelClassName?: string;
	id?: string;
	className?: string;
	buttonRef?: Ref<HTMLButtonElement>;
	'aria-busy'?: boolean;
}

/**
 * Design-system select list (FE-058): replaces the native `<select>`. A 40 px trigger in the shared
 * field style with a chevron that turns when the list is open, and an anchored option list styled
 * like the FE-057 `TimeField` list. Keyboard behaviour (Enter, Space, Alt+Down, arrows, Home/End,
 * type-ahead, Escape returning focus) comes from the Headless UI listbox.
 */
export function SelectField({
	label,
	value,
	onChange,
	options,
	placeholder,
	onBlur,
	error,
	status,
	disabled,
	required,
	size = 'default',
	labelClassName,
	id: idProp,
	className,
	buttonRef,
	'aria-busy': ariaBusy,
}: SelectFieldProps) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const errorId = `${id}-error`;
	const statusId = `${id}-status`;

	const listed: readonly SelectOption[] = placeholder ? [{value: '', label: placeholder}, ...options] : options;
	const selected = listed.find((option) => option.value === value);
	const showPlaceholder = Boolean(placeholder) && value === '';

	// Headless UI submits the form on Enter (it opens on Space and the arrow keys). A select list is
	// opened with Enter too (FE-058), and Enter must not submit the surrounding form from a closed list.
	function openOnEnter(event: KeyboardEvent<HTMLButtonElement>) {
		if (event.key === 'Enter' && event.currentTarget.getAttribute('aria-expanded') !== 'true') {
			event.preventDefault();
			event.currentTarget.click();
		}
	}

	return (
		<Field disabled={disabled} className={cn('flex flex-col gap-1', className)}>
			<Label className={cn('block text-sm font-medium text-foreground-label', labelClassName)}>
				{label}
				{required && <span className="ml-1 text-danger">*</span>}
			</Label>
			<Listbox value={value} onChange={onChange}>
				<ListboxButton
					id={id}
					ref={buttonRef}
					onBlur={onBlur}
					onKeyDown={openOnEnter}
					aria-invalid={error ? true : undefined}
					aria-busy={ariaBusy}
					className={cn(
						'group flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm text-foreground',
						'hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
						'data-open:ring-2 data-open:ring-ring',
						'disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-muted',
						error && 'border-danger focus-visible:ring-ring-danger data-open:ring-ring-danger',
						size === 'compact' && 'font-medium',
					)}
				>
					{/* Real text, not an input placeholder, so it needs 4.5:1: muted, not the placeholder grey (axe). */}
					<span className={cn('truncate', showPlaceholder && 'text-foreground-muted')}>
						{selected?.label ?? value}
					</span>
					<ChevronDown
						aria-hidden="true"
						className="size-4 shrink-0 text-foreground-secondary transition-transform group-data-open:rotate-180 group-disabled:text-foreground-placeholder"
					/>
				</ListboxButton>
				<ListboxOptions
					anchor={{to: 'bottom start', gap: 4, padding: 8}}
					className="z-50 max-h-60 min-w-40 w-(--button-width) overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg focus-visible:outline-none empty:invisible"
				>
					{listed.map((option) => (
						<ListboxOption
							key={option.value}
							value={option.value}
							disabled={option.disabled}
							className="group flex min-h-9 cursor-pointer items-center justify-between gap-2 rounded-md px-3 text-sm text-foreground data-disabled:cursor-not-allowed data-disabled:text-foreground-placeholder data-focus:bg-subtle data-selected:bg-brand-subtle data-selected:font-medium data-selected:text-brand-strong max-sm:min-h-11"
						>
							<span className="truncate">{option.label}</span>
							<Check aria-hidden="true" className="hidden size-4 shrink-0 group-data-selected:block" />
						</ListboxOption>
					))}
				</ListboxOptions>
			</Listbox>
			{error && (
				<Description id={errorId} as="p" className="flex items-start gap-1.5 text-sm text-danger" role="alert">
					<CircleAlert aria-hidden="true" className="mt-[3px] size-3.5 shrink-0" />
					{error}
				</Description>
			)}
			{status && !error && (
				<Description id={statusId} as="p" className="text-sm text-foreground-secondary" role="status">
					{status}
				</Description>
			)}
		</Field>
	);
}
