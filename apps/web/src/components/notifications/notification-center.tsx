'use client';

import {Dialog, DialogPanel, DialogTitle, Popover, PopoverButton, PopoverPanel} from '@headlessui/react';
import {Bell, X} from 'lucide-react';
import {useId, useState, useSyncExternalStore} from 'react';
import {Button, buttonVariants} from '@/components/ui/button';
import {NotificationInbox} from '@/components/notifications/notification-inbox';
import {
	notificationBadgeText,
	notificationBellLabel,
	unreadCount,
} from '@/components/notifications/notification-format';
import {NotificationPreferences} from '@/components/notifications/notification-preferences';
import {
	useMarkNotificationRead,
	useNotificationInbox,
} from '@/lib/hooks/use-notifications';
import {cn} from '@/lib/utils/utils';

const LG_QUERY = '(min-width: 1024px)';

function subscribeLg(onStoreChange: () => void) {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return () => {};
	}
	const media = window.matchMedia(LG_QUERY);
	media.addEventListener('change', onStoreChange);
	return () => media.removeEventListener('change', onStoreChange);
}

function getLgSnapshot() {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return false;
	}
	return window.matchMedia(LG_QUERY).matches;
}

function useIsLgUp() {
	return useSyncExternalStore(subscribeLg, getLgSnapshot, () => false);
}

type PanelView = 'inbox' | 'preferences';

interface PanelBodyProps {
	view: PanelView;
	titleId: string;
	onViewInbox: () => void;
	onViewPreferences: () => void;
	onClose: () => void;
	heading: 'title' | 'dialog';
}

function NotificationPanelBody({
	view,
	titleId,
	onViewInbox,
	onViewPreferences,
	onClose,
	heading,
}: PanelBodyProps) {
	const inbox = useNotificationInbox();
	const markRead = useMarkNotificationRead();
	const [statusMessage, setStatusMessage] = useState('');

	const TitleTag = heading === 'dialog' ? DialogTitle : 'h2';

	const handleMarkRead = (id: string) => {
		markRead.mutate(id, {
			onSuccess: () => {
				setStatusMessage('Notification marked as read');
			},
		});
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="sr-only" aria-live="polite" aria-atomic="true">
				{statusMessage}
			</div>
			{view === 'preferences' ? (
				<NotificationPreferences titleId={titleId} onBack={onViewInbox} onClose={onClose} />
			) : (
				<>
					<div className="flex items-center justify-between border-b border-border py-3 pl-4 pr-2">
						<TitleTag id={titleId} className="text-lg font-semibold leading-7 text-foreground">
							Notifications
						</TitleTag>
						<div className="flex items-center gap-2">
							<Button type="button" variant="link" className="h-10 px-0" onClick={onViewPreferences}>
								Preferences
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								aria-label="Close notifications"
								onClick={onClose}
							>
								<X className="h-5 w-5" aria-hidden />
							</Button>
						</div>
					</div>
					<NotificationInbox
						notifications={inbox.data}
						isPending={inbox.isPending}
						isError={inbox.isError}
						onRetry={() => {
							void inbox.refetch();
						}}
						onMarkRead={handleMarkRead}
						isMarking={markRead.isPending}
					/>
				</>
			)}
		</div>
	);
}

function BellGlyph({badge}: {badge: string | null}) {
	return (
		<span className="relative inline-flex">
			<Bell className="h-5 w-5" aria-hidden />
			{badge ? (
				<span
					aria-hidden
					className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-inverse"
				>
					{badge}
				</span>
			) : null}
		</span>
	);
}

export function NotificationCenter() {
	const inbox = useNotificationInbox();
	const isLgUp = useIsLgUp();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [view, setView] = useState<PanelView>('inbox');
	const titleId = useId();
	const panelId = useId();

	const count = inbox.isSuccess ? unreadCount(inbox.data) : 0;
	const label = notificationBellLabel(count);
	const badge = notificationBadgeText(count);

	const reset = () => {
		setView('inbox');
	};

	const closeMobile = () => {
		setMobileOpen(false);
		reset();
	};

	if (isLgUp) {
		return (
			<Popover className="relative">
				{({close}) => (
					<>
						<PopoverButton
							aria-label={label}
							aria-haspopup="dialog"
							className={cn(buttonVariants({variant: 'ghost', size: 'icon'}), 'relative')}
						>
							<BellGlyph badge={badge} />
						</PopoverButton>
						<PopoverPanel
							id={panelId}
							anchor="bottom end"
							className="z-50 w-[380px] overflow-hidden rounded-lg border border-border bg-surface shadow-lg"
						>
							<NotificationPanelBody
								view={view}
								titleId={titleId}
								heading="title"
								onViewInbox={() => setView('inbox')}
								onViewPreferences={() => setView('preferences')}
								onClose={() => {
									close();
									reset();
								}}
							/>
						</PopoverPanel>
					</>
				)}
			</Popover>
		);
	}

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="relative"
				aria-label={label}
				aria-haspopup="dialog"
				aria-expanded={mobileOpen}
				aria-controls={panelId}
				onClick={() => setMobileOpen(true)}
			>
				<BellGlyph badge={badge} />
			</Button>
			<Dialog open={mobileOpen} onClose={closeMobile} className="relative z-50">
				<div className="fixed inset-0 bg-black/25" aria-hidden />
				<div className="fixed inset-0 flex">
					<DialogPanel
						id={panelId}
						className="flex h-full w-full flex-col bg-surface"
						aria-labelledby={titleId}
					>
						<NotificationPanelBody
							view={view}
							titleId={titleId}
							heading="dialog"
							onViewInbox={() => setView('inbox')}
							onViewPreferences={() => setView('preferences')}
							onClose={closeMobile}
						/>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	);
}
