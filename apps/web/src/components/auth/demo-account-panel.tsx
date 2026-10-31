'use client';

import {useEffect, useRef, useState} from 'react';
import {Check, CircleAlert, Copy} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {DEMO_MFA_CODE, demoPanelAccounts, type DemoPanelAccount} from '@/lib/auth/demo-accounts';
import {cn} from '@/lib/utils/utils';

type CopyKind = 'email' | 'password';

type CopyFeedback = {
	email: string;
	kind: CopyKind;
	result: 'copied' | 'blocked';
};

const COPY_ANNOUNCEMENT: Record<CopyKind, string> = {
	email: 'Email copied',
	password: 'Password copied',
};

const COPY_BLOCKED = 'Copy blocked. Select the text instead.';
/** How long the visible "Copied" state stays before the icon reverts. */
const COPIED_MS = 2000;

export function DemoAccountPanel({
	onSelect,
	disabled = false,
	selectedEmail = null,
}: {
	onSelect: (account: DemoPanelAccount) => void;
	disabled?: boolean;
	/** Email of the account whose credentials both form fields currently hold. */
	selectedEmail?: string | null;
}) {
	const accounts = demoPanelAccounts();
	const selected = accounts.find((account) => account.email === selectedEmail) ?? null;
	// Practice admin is previewed, without filling, until a role is picked.
	const shown = selected ?? accounts[0];
	const [feedback, setFeedback] = useState<CopyFeedback | null>(null);
	const timer = useRef<number | undefined>(undefined);

	useEffect(() => () => window.clearTimeout(timer.current), []);

	// Feedback belongs to one account; switching account hides it.
	const current = feedback?.email === shown.email ? feedback : null;
	const announcement = current
		? current.result === 'copied'
			? COPY_ANNOUNCEMENT[current.kind]
			: COPY_BLOCKED
		: '';

	async function copyValue(value: string, kind: CopyKind) {
		window.clearTimeout(timer.current);
		try {
			// Undefined on a non-secure origin, for example a phone on a LAN IP over plain HTTP.
			if (typeof navigator.clipboard?.writeText !== 'function') {
				throw new Error('Clipboard unavailable');
			}
			await navigator.clipboard.writeText(value);
			setFeedback({email: shown.email, kind, result: 'copied'});
			timer.current = window.setTimeout(() => setFeedback(null), COPIED_MS);
		} catch {
			setFeedback({email: shown.email, kind, result: 'blocked'});
		}
	}

	const credentials: {kind: CopyKind; label: string; value: string}[] = [
		{kind: 'email', label: 'Email', value: shown.email},
		{kind: 'password', label: 'Password', value: shown.password},
	];

	return (
		<div className="mt-4 min-w-0 space-y-2 rounded-md border border-border bg-subtle p-3 text-xs text-foreground-secondary">
			<div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
				<p className="text-sm font-medium text-foreground">Demo accounts</p>
				<p>
					MFA nurse code: <span className="font-mono">{DEMO_MFA_CODE}</span>
				</p>
			</div>
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{announcement}
			</div>

			<div className="grid grid-cols-2 gap-2">
				{accounts.map((account) => {
					const pressed = account.email === selected?.email;
					return (
						<Button
							key={account.email}
							type="button"
							variant="outline"
							aria-pressed={pressed}
							aria-label={`Fill sign-in as ${account.label}`}
							disabled={disabled}
							onClick={() => onSelect(account)}
							className={cn(
								'h-auto min-h-11 gap-1.5 px-3 whitespace-normal',
								pressed && 'border-border-brand bg-brand-subtle text-brand-strong hover:bg-brand-subtle',
							)}
						>
							{pressed && <Check className="size-4 shrink-0" aria-hidden="true" />}
							{account.label}
						</Button>
					);
				})}
			</div>

			<p aria-live="polite" className={selected ? 'font-medium text-brand-strong' : 'text-foreground-muted'}>
				{selected
					? `Filled as ${selected.label}. Press Sign in.`
					: `Preview: ${shown.label}. Tap a role to fill the sign-in form.`}
			</p>

			<dl className="space-y-2">
				{credentials.map(({kind, label, value}) => {
					const copied = current?.kind === kind && current.result === 'copied';
					const blocked = current?.kind === kind && current.result === 'blocked';
					return (
						<div key={kind} className="flex min-w-0 items-center gap-2">
							<dt className="w-15 shrink-0 font-medium text-foreground-muted">{label}</dt>
							<dd
								className={cn(
									'min-w-0 flex-1 rounded-sm px-1 py-0.5 font-mono break-all text-foreground select-all',
									blocked && 'bg-brand-subtle',
								)}
							>
								{value}
							</dd>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								aria-label={`Copy ${kind} for ${shown.label}`}
								onClick={() => {
									void copyValue(value, kind);
								}}
								className={cn(
									'min-w-9 shrink-0 gap-1 hover:bg-surface',
									copied ? 'px-2 text-success-strong' : 'w-9 px-0',
								)}
							>
								{copied ? (
									<>
										<Check className="size-4" aria-hidden="true" />
										<span>Copied</span>
									</>
								) : (
									<Copy className="size-4" aria-hidden="true" />
								)}
							</Button>
						</div>
					);
				})}
			</dl>

			{current?.result === 'blocked' && (
				<p className="flex items-center gap-1.5 font-medium text-danger">
					<CircleAlert className="size-4 shrink-0" aria-hidden="true" />
					{COPY_BLOCKED}
				</p>
			)}
		</div>
	);
}
