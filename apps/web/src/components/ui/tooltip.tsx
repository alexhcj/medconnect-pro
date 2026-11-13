'use client';

import {cloneElement, isValidElement, useId, useState, type KeyboardEvent, type ReactElement} from 'react';
import {cn} from '@/lib/utils/utils';

/**
 * Hover and keyboard-focus tooltip (WCAG 1.4.13): it stays while the pointer moves onto it, Escape
 * dismisses it, and it is wired to the trigger with `aria-describedby`. Hidden on small screens,
 * where there is no hover and the controls carry visible labels.
 */
export function Tooltip({
	label,
	children,
	className,
}: {
	label: string;
	children: ReactElement<{'aria-describedby'?: string}>;
	className?: string;
}) {
	const id = useId();
	const [dismissed, setDismissed] = useState(false);

	if (!isValidElement(children)) {
		return children;
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === 'Escape') {
			setDismissed(true);
		}
	};

	return (
		<span
			className={cn('group/tooltip relative inline-flex', className)}
			onKeyDown={onKeyDown}
			onMouseLeave={() => setDismissed(false)}
			onBlur={() => setDismissed(false)}
		>
			{cloneElement(children, {'aria-describedby': id})}
			<span
				className={cn(
					'absolute bottom-full left-1/2 z-10 hidden -translate-x-1/2 pb-2',
					'sm:group-hover/tooltip:block sm:group-focus-within/tooltip:block',
					dismissed && 'sm:group-hover/tooltip:hidden sm:group-focus-within/tooltip:hidden',
				)}
			>
				<span
					id={id}
					role="tooltip"
					className="block whitespace-nowrap rounded-md border border-(--color-stage-border-strong) bg-(--color-stage-bg) px-2 py-1 text-xs font-medium text-(--color-stage-text) shadow-md"
				>
					{label}
				</span>
			</span>
		</span>
	);
}
