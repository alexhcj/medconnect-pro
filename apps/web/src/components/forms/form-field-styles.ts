/**
 * Shared control styles: white field on the white form card (FE-056), one token set for every text
 * input (FE-058). Hover, placeholder and disabled match the `SelectField` trigger.
 */
export const formControlBaseClassName =
	'mt-1 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground placeholder:text-foreground-placeholder hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground-muted';

// `block`, not `flex`: a flex date input packs its value and calendar icon together on the left.
// `h-10` (40 px, Figma `size/control`) is the one height for every input type (FE-058).
export const formControlClassName = `block h-10 ${formControlBaseClassName}`;

/** Padding for the single card that holds a dashboard form. */
export const formCardContentClassName = 'space-y-8 p-4 sm:p-6';
