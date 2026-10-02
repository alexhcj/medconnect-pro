'use client';

import Image from 'next/image';
import {useState} from 'react';
import {cn} from '@/lib/utils/utils';

interface MarketingProductImageProps {
	src: string;
	alt: string;
	className?: string;
}

export function MarketingProductImage({src, alt, className}: MarketingProductImageProps) {
	const [failed, setFailed] = useState(false);

	if (failed) {
		return (
			<div
				role="img"
				aria-label={`${alt} unavailable`}
				className={cn(
					'flex min-h-[16rem] items-center justify-center rounded-xl border border-border bg-subtle px-6 py-16 text-center sm:min-h-[20rem]',
					className,
				)}
			>
				<p className="max-w-md text-sm text-foreground-muted">Screenshot unavailable</p>
			</div>
		);
	}

	return (
		<Image
			src={src}
			alt={alt}
			width={1440}
			height={900}
			unoptimized
			className={cn(
				'h-full w-full rounded-xl border border-border bg-subtle object-cover object-top',
				className,
			)}
			onError={() => {
				setFailed(true);
			}}
		/>
	);
}
