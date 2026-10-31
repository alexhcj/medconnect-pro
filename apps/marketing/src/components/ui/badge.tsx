import type {HTMLAttributes} from 'react';
import {cva, type VariantProps} from 'class-variance-authority';
import {cn} from '@/lib/utils/utils';

const badgeVariants = cva(
	'inline-flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-medium leading-4',
	{
		variants: {
			tone: {
				success: 'bg-subtle text-success-strong',
				accent: 'bg-brand-subtle text-brand-hover',
				neutral: 'bg-subtle text-foreground-secondary',
				warning: 'bg-warning-subtle text-warning',
			},
		},
		defaultVariants: {tone: 'neutral'},
	},
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
	tone?: BadgeTone;
	dot?: boolean;
}

/** Static status label. Never interactive: no hover, focus or link styling. */
export function Badge({tone, dot = false, className, children, ...props}: BadgeProps) {
	return (
		<span className={cn(badgeVariants({tone}), className)} {...props}>
			{dot ? <span aria-hidden className="size-1.5 rounded-full bg-current" /> : null}
			{children}
		</span>
	);
}
