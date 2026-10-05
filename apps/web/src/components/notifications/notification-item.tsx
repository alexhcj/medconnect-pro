'use client';

import {Calendar, Info} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
	formatInboxTimestamp,
	notificationTypeLabel,
} from '@/components/notifications/notification-format';
import {cn} from '@/lib/utils/utils';
import {isInboxUnread, type InboxNotification} from '@/types/notifications/inbox';

interface NotificationItemProps {
	notification: InboxNotification;
	onMarkRead: (id: string) => void;
	isMarking: boolean;
}

export function NotificationItem({notification, onMarkRead, isMarking}: NotificationItemProps) {
	const unread = isInboxUnread(notification);
	const TypeIcon = notification.type === 'appointment_changed' ? Calendar : Info;

	return (
		<li
			className={cn(
				'flex flex-col gap-2 rounded-md p-3',
				unread ? 'bg-brand-subtle' : 'bg-surface',
			)}
		>
			<div className="flex items-center gap-2">
				<span
					className={cn('size-2 shrink-0 rounded-full', unread ? 'bg-brand' : 'bg-transparent')}
					aria-hidden
				/>
				<p className={cn('min-w-0 flex-1 text-sm text-foreground', unread ? 'font-medium' : 'font-normal')}>
					{notification.title}
				</p>
			</div>
			<p className="text-sm text-foreground-secondary">{notification.body}</p>
			<div className="flex flex-wrap items-center gap-3">
				<span
					className={cn(
						'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
						notification.type === 'appointment_changed'
							? 'bg-brand-subtle text-brand'
							: 'bg-subtle text-foreground-muted',
					)}
				>
					<TypeIcon className="size-3.5" aria-hidden />
					<span className="text-xs">{notificationTypeLabel(notification.type)}</span>
				</span>
				<span className="text-xs text-foreground-muted">
					{formatInboxTimestamp(notification.createdAt)}
				</span>
				<span className={cn('text-xs', unread ? 'text-brand' : 'text-foreground-muted')}>
					{unread ? 'Unread' : 'Read'}
				</span>
			</div>
			{unread ? (
				<Button
					type="button"
					variant="link"
					className="h-auto justify-start p-0"
					onClick={() => onMarkRead(notification.id)}
					disabled={isMarking}
				>
					Mark as read
				</Button>
			) : null}
		</li>
	);
}
