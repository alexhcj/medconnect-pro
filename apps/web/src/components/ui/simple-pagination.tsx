import {Button} from '@/components/ui/button';

interface SimplePaginationProps {
	/** Names the landmark, for example "Patients" gives "Patients pagination". */
	label: string;
	page: number;
	hasNext: boolean;
	/** Rows shown on this page, used for the "Showing X–Y" range. */
	range: {first: number; last: number};
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

/**
 * Previous/Next controls for lists whose API returns no total, so there is no page count to show.
 * Full-width buttons below md, one row with the range on the left from md up.
 */
export function SimplePagination({
	label,
	page,
	hasNext,
	range,
	onPageChange,
	disabled = false,
}: SimplePaginationProps) {
	return (
		<nav
			aria-label={`${label} pagination`}
			className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
		>
			<p
				className="text-center text-sm text-gray-600 md:text-left"
				aria-live="polite"
				data-testid="pagination-status"
			>
				Showing {range.first}–{range.last}
				<span className="md:hidden"> · Page {page}</span>
			</p>
			<div className="flex items-center gap-2 md:gap-3">
				<span className="hidden text-sm font-medium text-gray-600 md:inline">Page {page}</span>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="flex-1 px-4 md:flex-none md:px-8"
					disabled={disabled || page <= 1}
					onClick={() => onPageChange(page - 1)}
					aria-label="Previous page"
				>
					Previous
				</Button>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="flex-1 px-4 md:flex-none md:px-8"
					disabled={disabled || !hasNext}
					onClick={() => onPageChange(page + 1)}
					aria-label="Next page"
				>
					Next
				</Button>
			</div>
		</nav>
	);
}
