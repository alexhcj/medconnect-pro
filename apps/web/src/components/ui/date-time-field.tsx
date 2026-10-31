'use client';

import {useEffect, useId, useState, type Ref} from 'react';
import {CircleAlert} from 'lucide-react';
import {DateField} from '@/components/ui/date-field';
import {TimeField} from '@/components/ui/time-field';
import {formatZone, formatZoneLong} from '@/lib/format/date';
import {combineLocal, splitLocal} from '@/lib/format/date-input';
import {cn} from '@/lib/utils/utils';

export interface DateTimeFieldProps {
	/** Visible legend, for example "Start". */
	legend: string;
	/** Local `YYYY-MM-DDTHH:mm`, or empty until both the date and the time are set. */
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	name?: string;
	id?: string;
	/** Earliest allowed local date-time. Earlier times on that day are disabled in the list. */
	minValue?: string;
	disabled?: boolean;
	required?: boolean;
	error?: string | null;
	className?: string;
	/** Focus target for form libraries (the date input). */
	inputRef?: Ref<HTMLInputElement>;
}

/**
 * Date and time of an appointment (FE-057): a `DateField`, a `TimeField` and the viewer's zone. The
 * value stays the local ISO string the appointment schema expects, and is empty until both halves are set.
 */
export function DateTimeField({
	legend,
	value,
	onChange,
	onBlur,
	name,
	id: idProp,
	minValue,
	disabled,
	required,
	error,
	className,
	inputRef,
}: DateTimeFieldProps) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const hintId = `${id}-hint`;
	const errorId = `${id}-error`;

	const initial = splitLocal(value);
	const [day, setDay] = useState(initial?.day ?? '');
	const [time, setTime] = useState(initial?.time ?? '');

	// Follow outside changes (form reset, prefill, end auto-fill) but keep a half-entered value.
	useEffect(() => {
		const parts = splitLocal(value);
		if (parts) {
			setDay(parts.day);
			setTime(parts.time);
		} else if (!value && day && time) {
			setDay('');
			setTime('');
		}
		// Only a changed `value` should reset the halves.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value]);

	function update(nextDay: string, nextTime: string) {
		setDay(nextDay);
		setTime(nextTime);
		onChange(nextDay && nextTime ? combineLocal(nextDay, nextTime) : '');
	}

	const min = splitLocal(minValue ?? '');
	const minTime = min && day === min.day ? min.time : undefined;
	const zoneSource = day && time ? new Date(`${day}T${time}`) : new Date();
	const zoneIso = Number.isNaN(zoneSource.getTime()) ? new Date().toISOString() : zoneSource.toISOString();
	const zone = formatZone(zoneIso);

	return (
		<fieldset
			className={cn('min-w-0 border-0 p-0', className)}
			disabled={disabled}
			aria-describedby={error ? errorId : hintId}
		>
			<legend className="p-0 text-sm font-medium text-foreground-label">
				{legend}
				{required && <span className="ml-1 text-danger">*</span>}
			</legend>
			<div className="mt-1 flex flex-wrap items-start gap-x-2 gap-y-2">
				<DateField
					label={`${legend} date`}
					chooseLabel={`Choose ${legend.toLowerCase()} date`}
					hideLabel
					hint={null}
					name={name}
					min={min?.day}
					value={day}
					inputRef={inputRef}
					onChange={(next) => update(next, time)}
					onBlur={onBlur}
					invalid={Boolean(error)}
					describedBy={error ? errorId : hintId}
					className="min-w-44 flex-1"
				/>
				<TimeField
					label={`${legend} time`}
					value={time}
					minTime={minTime}
					invalid={Boolean(error)}
					describedBy={error ? errorId : hintId}
					onChange={(next) => update(day, next)}
					onBlur={onBlur}
					className="w-36"
				/>
				<span className="self-center text-xs font-medium text-foreground-muted">{zone}</span>
			</div>
			{error ? (
				<p id={errorId} role="alert" className="mt-1 flex items-center gap-1.5 text-sm text-danger">
					<CircleAlert aria-hidden="true" className="size-3.5 shrink-0" />
					{error}
				</p>
			) : (
				<p id={hintId} className="mt-1 text-xs text-foreground-muted">
					MM/DD/YYYY · h:mm AM/PM · {formatZoneLong(zoneIso)}
				</p>
			)}
		</fieldset>
	);
}
