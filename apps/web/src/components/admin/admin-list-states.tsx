import {useEffect, useRef, type RefObject} from 'react';
import {Button} from '@/components/ui/button';

export function ListSkeleton({label, rows = 6}: {label: string; rows?: number}) {
	return (
		<div className="space-y-3" aria-busy="true">
			{Array.from({length: rows}, (_, index) => (
				<div key={index} className="h-12 animate-pulse rounded-md bg-gray-200" />
			))}
			<span className="sr-only">{label}</span>
		</div>
	);
}

interface ListNoticeProps {
	message: string;
	tone?: 'info' | 'error';
	action?: {label: string; onClick: () => void};
}

export function ListNotice({message, tone = 'info', action}: ListNoticeProps) {
	const isError = tone === 'error';
	return (
		<div
			className={`rounded-lg border bg-white p-4 ${isError ? 'border-red-200' : 'border-gray-200'}`}
			role={isError ? 'alert' : 'status'}
		>
			<p className={`text-sm ${isError ? 'text-gray-700' : 'text-gray-600'}`}>{message}</p>
			{action && (
				<Button type="button" className="mt-3" variant="outline" size="lg" onClick={action.onClick}>
					{action.label}
				</Button>
			)}
		</div>
	);
}

/** Returns a ref for the card heading; focus moves there when the page changes (not on first render). */
export function useFocusHeadingOnPageChange(page: number): RefObject<HTMLHeadingElement | null> {
	const ref = useRef<HTMLHeadingElement>(null);
	const previous = useRef(page);

	useEffect(() => {
		if (previous.current !== page) {
			previous.current = page;
			ref.current?.focus({preventScroll: true});
		}
	}, [page]);

	return ref;
}
