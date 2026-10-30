/** Shared control styles for dashboard forms: white field on the white form card (FE-056). */
export const formControlBaseClassName =
	'mt-1 w-full rounded-md border border-input bg-surface px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

// `block`, not `flex`: a flex date input packs its value and calendar icon together on the left.
export const formControlClassName = `block h-10 ${formControlBaseClassName}`;

/** Padding for the single card that holds a dashboard form. */
export const formCardContentClassName = 'space-y-8 p-4 sm:p-6';
