/** Exact `pr-preview` only. Any other value, including unset, is not a PR preview (FE-048). */
export function isPrPreview(): boolean {
	return process.env.NEXT_PUBLIC_DEPLOY_CONTEXT === 'pr-preview';
}

/**
 * One-line banner height: py-2 (8 + 8) + 20 px line + 1 px border. The root layout publishes it as
 * `--preview-banner-h` so the fixed dashboard sidebar starts below the banner. Unset otherwise.
 */
export const PREVIEW_BANNER_HEIGHT = '2.3125rem';
