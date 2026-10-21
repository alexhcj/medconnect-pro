import {Button} from '@/components/ui/button';
import {pageCount} from '@/lib/admin/list-params';
import {cn} from '@/lib/utils/utils';

interface PaginationProps {
	/** Names the landmark, for example "Audit events" gives "Audit events pagination". */
	label: string;
	page: number;
	total: number;
	onPageChange: (page: number) => void;
	disabled?: boolean;
	/** Rows per page, for lists that do not use the administration page size. */
	pageSize?: number;
	/**
	 * Switch layout on the width of the pager's own container instead of the viewport, for lists in a
	 * card whose width does not follow the screen. Numbered pages appear once 32 rem is available.
	 */
	container?: boolean;
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
 * Numbered page controls from md up (or from 32 rem of container width with `container`),
 * "Page N of M" with equal-width Previous/Next below that.
 * Previous and Next are rendered once so assistive technology never meets duplicates.
 */
export function Pagination({
	label,
	page,
	total,
	onPageChange,
	disabled = false,
	pageSize,
	container = false,
}: PaginationProps) {
	const totalPages = pageCount(total, pageSize);
	// Full class names so Tailwind sees them: viewport (md:) or container (@lg:) breakpoints.
	const bp = container
		? {
				nav: '@lg:flex-row @lg:items-center @lg:justify-end',
				label: '@lg:hidden',
				row: '@lg:contents',
				button: '@lg:flex-none',
				pages: '@lg:flex',
			}
		: {
				nav: 'md:flex-row md:items-center md:justify-end',
				label: 'md:hidden',
				row: 'md:contents',
				button: 'md:flex-none',
				pages: 'md:flex',
			};
	const current = Math.min(page, totalPages);

	const nav = (
		<nav aria-label={`${label} pagination`} className={cn('flex flex-col gap-2', bp.nav)}>
			<p className={cn('text-center text-sm font-medium text-gray-600', bp.label)}>
				Page {current} of {totalPages}
			</p>
			<div className={cn('flex gap-2', bp.row)}>
				<Button
					type="button"
					variant="outline"
					size="lg"
					className={cn('flex-1', bp.button)}
					disabled={disabled || current <= 1}
					onClick={() => onPageChange(current - 1)}
					aria-label="Previous page"
				>
					Previous
				</Button>
				<ol className={cn('hidden items-center gap-2', bp.pages)}>
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
					className={cn('flex-1', bp.button)}
					disabled={disabled || current >= totalPages}
					onClick={() => onPageChange(current + 1)}
					aria-label="Next page"
				>
					Next
				</Button>
			</div>
		</nav>
	);

	return container ? <div className="@container">{nav}</div> : nav;
}
