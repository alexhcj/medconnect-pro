'use client';

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {DEMO_MFA_CODE, demoPanelAccounts} from '@/lib/auth/demo-accounts';

type CopyKind = 'email' | 'password';

const COPY_ANNOUNCEMENT: Record<CopyKind, string> = {
	email: 'Email copied',
	password: 'Password copied',
};

export function DemoAccountPanel() {
	const accounts = demoPanelAccounts();
	const [announcement, setAnnouncement] = useState('');

	async function copyValue(value: string, kind: CopyKind) {
		try {
			await navigator.clipboard.writeText(value);
			setAnnouncement(COPY_ANNOUNCEMENT[kind]);
		} catch {
			setAnnouncement('');
		}
	}

	return (
		<div className="mt-4 min-w-0 space-y-3 rounded-md border border-border bg-subtle p-3 text-xs text-foreground-secondary">
			<p className="text-sm font-medium text-foreground">Demo accounts</p>
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{announcement}
			</div>
			{accounts.map((account) => (
				<div key={account.email} className="min-w-0 space-y-1">
					<p className="text-sm font-medium text-foreground">{account.label}</p>
					<p className="break-all">
						Email: <span className="font-mono">{account.email}</span>
					</p>
					<p className="break-all">
						Password: <span className="font-mono">{account.password}</span>
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-label={`Copy email for ${account.label}`}
							onClick={() => {
								void copyValue(account.email, 'email');
							}}
						>
							Copy email
						</Button>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							aria-label={`Copy password for ${account.label}`}
							onClick={() => {
								void copyValue(account.password, 'password');
							}}
						>
							Copy password
						</Button>
					</div>
				</div>
			))}
			<p>
				MFA nurse code: <span className="font-mono">{DEMO_MFA_CODE}</span>
			</p>
		</div>
	);
}
