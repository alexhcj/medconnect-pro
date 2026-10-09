'use client';

import {useState} from 'react';
import {Loader2, ShieldCheck} from 'lucide-react';
import {cn} from '@/lib/utils/utils';
import {oauthStartUrl, type OAuthProvider} from '@/lib/auth/oauth';

const PROVIDER_LABELS: Record<OAuthProvider, string> = {
	google: 'Continue with Google',
	fake: 'Continue with Fake provider (demo)',
};

const HELPER_ID = 'oauth-provider-helper';

interface OAuthProviderButtonProps {
	provider: OAuthProvider;
	available: boolean;
}

export function OAuthProviderButton({provider, available}: OAuthProviderButtonProps) {
	const [redirecting, setRedirecting] = useState(false);
	const label = PROVIDER_LABELS[provider];

	const start = () => {
		setRedirecting(true);
		window.location.assign(oauthStartUrl(provider));
	};

	return (
		<div>
			<button
				type="button"
				onClick={start}
				disabled={!available || redirecting}
				aria-busy={redirecting || undefined}
				aria-describedby={available ? undefined : HELPER_ID}
				className={cn(
					'flex h-11 w-full items-center justify-center gap-3 rounded-md border border-input px-4 text-sm font-medium',
					'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
					available
						? 'bg-surface text-foreground hover:bg-subtle disabled:cursor-wait'
						: 'cursor-not-allowed bg-subtle text-foreground-muted opacity-60',
				)}
			>
				{redirecting ? (
					<Loader2 className="size-[18px] animate-spin motion-reduce:animate-none" aria-hidden="true" />
				) : provider === 'google' ? (
					// eslint-disable-next-line @next/next/no-img-element
					<img src="/brand/google-g.svg" alt="" width={18} height={18} />
				) : (
					<ShieldCheck className="size-[18px] text-brand" aria-hidden="true" />
				)}
				<span aria-live="polite">{redirecting ? 'Redirecting…' : label}</span>
			</button>
			{!available && (
				<p id={HELPER_ID} className="mt-4 text-xs text-foreground-muted">
					Provider sign-in is unavailable in mock mode. Use email sign-in below.
				</p>
			)}
		</div>
	);
}
