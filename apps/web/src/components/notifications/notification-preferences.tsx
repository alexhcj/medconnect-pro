'use client';

import {Switch} from '@headlessui/react';
import {Check, ChevronLeft, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
	useNotificationPreferences,
	useUpdateNotificationPreferences,
} from '@/lib/hooks/use-notifications';
import {cn} from '@/lib/utils/utils';
import type {NotificationPreference, NotificationPreferencePatch} from '@/types/notifications/inbox';

const CHANNELS: Array<{
	key: keyof NotificationPreference;
	label: string;
	help: string;
}> = [
	{
		key: 'inAppEnabled',
		label: 'In-app',
		help: 'Show items in this inbox.',
	},
	{
		key: 'emailEnabled',
		label: 'Email',
		help: 'Saves a preference only. Email is a demo adapter, not a live carrier.',
	},
	{
		key: 'smsEnabled',
		label: 'SMS',
		help: 'Saves a preference only. SMS is a demo adapter, not a live carrier. Not push.',
	},
];

interface NotificationPreferencesProps {
	titleId: string;
	onBack: () => void;
	onClose: () => void;
}

export function NotificationPreferences({titleId, onBack, onClose}: NotificationPreferencesProps) {
	const preferences = useNotificationPreferences(true);
	const update = useUpdateNotificationPreferences();

	const toggle = (key: keyof NotificationPreference, enabled: boolean) => {
		const patch: NotificationPreferencePatch = {[key]: enabled};
		update.mutate(patch);
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex items-center justify-between border-b border-border px-2 py-2">
				<div className="flex items-center">
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label="Back to inbox"
						onClick={onBack}
					>
						<ChevronLeft className="h-5 w-5" aria-hidden />
					</Button>
					<h2 id={titleId} className="text-lg font-semibold leading-7 text-foreground">
						Preferences
					</h2>
				</div>
				<Button type="button" variant="ghost" size="icon" aria-label="Close notifications" onClick={onClose}>
					<X className="h-5 w-5" aria-hidden />
				</Button>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				{preferences.isPending ? (
					<div aria-busy="true">
						<p className="text-xs text-foreground-muted">Loading preferences</p>
						<span className="sr-only">Loading preferences</span>
					</div>
				) : null}
				{preferences.isError ? (
					<div className="mb-4 rounded-md border border-danger bg-surface p-3" role="alert">
						<p className="text-sm text-foreground">Unable to load preferences.</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => preferences.refetch()}
						>
							Retry
						</Button>
					</div>
				) : null}
				{update.isError ? (
					<div className="mb-4 rounded-md border border-danger bg-surface p-3" role="alert">
						<p className="text-sm text-foreground">Unable to save preferences.</p>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mt-3"
							onClick={() => {
								if (update.variables) {
									update.mutate(update.variables);
								}
							}}
						>
							Retry
						</Button>
					</div>
				) : null}
				{update.isSuccess ? (
					<div className="mb-4 flex items-center gap-2 rounded-md bg-subtle px-2 py-2 text-xs text-foreground">
						<Check className="h-4 w-4 text-success" aria-hidden />
						Preferences saved
					</div>
				) : null}
				{preferences.data
					? CHANNELS.map((channel) => {
							const enabled = preferences.data[channel.key];
							const labelId = `notification-pref-${channel.key}-label`;
							const helpId = `notification-pref-${channel.key}-help`;
							return (
								<div key={channel.key} className="flex items-start justify-between gap-3 py-3">
									<div className="min-w-0 flex-1">
										<p id={labelId} className="text-sm font-medium text-foreground">
											{channel.label}
										</p>
										<p id={helpId} className="mt-1 text-xs text-foreground-muted">
											{channel.help}
										</p>
									</div>
									<Switch
										checked={enabled}
										onChange={(next) => toggle(channel.key, next)}
										disabled={update.isPending}
										aria-label={channel.label}
										aria-describedby={helpId}
										className={cn(
											enabled ? 'bg-brand' : 'bg-subtle',
											'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
										)}
									>
										<span
											aria-hidden
											className={cn(
												enabled ? 'translate-x-5' : 'translate-x-0',
												'pointer-events-none inline-block size-5 rounded-full bg-surface shadow transition',
											)}
										/>
									</Switch>
								</div>
							);
						})
					: null}
			</div>
		</div>
	);
}
