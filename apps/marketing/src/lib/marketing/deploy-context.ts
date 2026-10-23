/** Exact `pr-preview` only. Any other value, including unset, is not a PR preview (FE-048). */
export function isPrPreview(): boolean {
	return process.env.NEXT_PUBLIC_DEPLOY_CONTEXT === 'pr-preview';
}
