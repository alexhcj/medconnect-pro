import {Button} from '@/components/ui/button';
import {pageCount} from '@/lib/admin/list-params';

interface PaginationProps {
	/** Names the landmark, for example "Audit events" gives "Audit events pagination". */
	label: string;
	page: number;
	total: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
}

type PageItem = number | 'ellipsis-start' | 'ellipsis-end';

export function pageItems(page: number, totalPages: number): PageItem[] {
	if (totalPages <= 7) {
		return Array.from({length: totalPages}, (_, index) => index + 1);
	}
	const middle = [page - 1, page, page + 1].filter((n) => n > 1 && n < totalPages);
	const items: PageItem[] = [1];
	if (middle[0] > 2) {
		items.push('ellipsis-start');
	}
	items.push(...middle);
	if (middle[middle.length - 1] < totalPages - 1) {
		items.push('ellipsis-end');
	}
	items.push(totalPages);
	return items;
}

/**
 * Numbered page controls from md up, "Page N of M" with equal-width Previous/Next below md.
 * Previous and Next are rendered once so assistive technology never meets duplicates.
 */
export function Pagination({label, page, total, onPageChange, disabled = false}: PaginationProps) {
	const totalPages = pageCount(total);
	const current = Math.min(page, totalPages);

	return (
		<nav
			aria-label={`${label} pagination`}
			className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end"
		>
			<p className="text-center text-sm font-medium text-gray-600 md:hidden">
				Page {current} of {totalPages}
			</p>
			<div className="flex gap-2 md:contents">
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="flex-1 md:flex-none"
					disabled={disabled || current <= 1}
					onClick={() => onPageChange(current - 1)}
					aria-label="Previous page"
				>
					Previous
				</Button>
				<ol className="hidden items-center gap-2 md:flex">
					{pageItems(current, totalPages).map((item) =>
						typeof item === 'number' ? (
							<li key={item}>
								<Button
									type="button"
									variant={item === current ? 'default' : 'outline'}
									className="h-11 w-11 px-0"
									disabled={disabled}
									aria-label={`Page ${item}`}
									aria-current={item === current ? 'page' : undefined}
									onClick={() => item !== current && onPageChange(item)}
								>
									{item}
								</Button>
							</li>
						) : (
							<li key={item} aria-hidden="true" className="px-2 text-sm text-gray-500">
								…
							</li>
						),
					)}
				</ol>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className="flex-1 md:flex-none"
					disabled={disabled || current >= totalPages}
					onClick={() => onPageChange(current + 1)}
					aria-label="Next page"
				>
					Next
				</Button>
			</div>
		</nav>
	);
}
