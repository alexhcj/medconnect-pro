'use client';

import React from 'react';
import {Clock, TriangleAlert} from 'lucide-react';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {useUISelectors} from '@/lib/stores/ui-store';
import {clsx} from 'clsx';

export function SessionWarningBanner() {
	const {isExpiringSoon, isExpiringNow, remainingTime, extendSession, isExtending} = useSessionStatus();
	const addNotification = useUISelectors.useAddNotification();

	// Don't show banner if not expiring soon or if modal should be shown
	if (!isExpiringSoon || isExpiringNow) {
		return null;
	}

	const remainingMinutes = Math.ceil(remainingTime / (60 * 1000));
	const isUrgent = remainingMinutes <= 5;

	const handleExtend = async () => {
		try {
			await extendSession();
			addNotification({
				type: 'success',
				title: 'Session Extended',
				message: 'Your session has been extended successfully.',
			});
		} catch (error) {
			addNotification({
				type: 'error',
				title: 'Extension Failed',
				message: 'Failed to extend session. Please save your work.',
			});
		}
	};

	const handleSaveWork = () => {
		// Trigger auto-save functionality
		window.dispatchEvent(new CustomEvent('session-auto-save'));
		addNotification({
			type: 'info',
			title: 'Auto-save Triggered',
			message: 'Attempting to save your current work.',
		});
	};

	return (
		<div
			className={clsx(
				'fixed top-0 left-0 right-0 z-50 px-4 py-3 shadow-lg border-b-2 transition-colors duration-300',
				isUrgent
					? 'bg-red-50 border-red-500 text-red-800'
					: 'bg-amber-50 border-amber-500 text-amber-800'
			)}
			role="alert"
			aria-live="polite"
		>
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<div className="flex items-center space-x-3">
					<div className="flex-shrink-0">
						{isUrgent ? (
							<TriangleAlert className="h-5 w-5 text-red-500"/>
						) : (
							<Clock className="h-5 w-5 text-amber-500"/>
						)}
					</div>

					<div className="flex-1">
						<p className="text-sm font-medium">
							{isUrgent ? (
								<>
									<span className="font-semibold">Session Expiring Soon!</span>
									{' '}Your session will expire in {remainingMinutes} minute{remainingMinutes !== 1 ? 's' : ''}.
								</>
							) : (
								<>
									<span className="font-semibold">Session Warning:</span>
									{' '}Your session will expire in {remainingMinutes} minutes. Please save your work.
								</>
							)}
						</p>
					</div>
				</div>

				<div className="flex items-center space-x-3">
					<button
						type="button"
						className={clsx(
							'inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded transition-colors',
							isUrgent
								? 'text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500'
								: 'text-amber-700 bg-amber-100 hover:bg-amber-200 focus:ring-amber-500',
							'focus:outline-none focus:ring-2 focus:ring-offset-2'
						)}
						onClick={handleSaveWork}
					>
						Save Work
					</button>

					<button
						type="button"
						className={clsx(
							'inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white transition-colors',
							isUrgent
								? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
								: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
							'focus:outline-none focus:ring-2 focus:ring-offset-2',
							isExtending && 'opacity-50 cursor-not-allowed'
						)}
						onClick={handleExtend}
						disabled={isExtending}
					>
						{isExtending ? (
							<>
								<svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg"
										 fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
									<path className="opacity-75" fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
								</svg>
								Extending...
							</>
						) : (
							"I'm Still Here"
						)}
					</button>
				</div>
			</div>

			{/* Progress bar showing time remaining */}
			<div className="mt-2">
				<div className="w-full bg-white bg-opacity-50 rounded-full h-1">
					<div
						className={clsx(
							'h-1 rounded-full transition-all duration-1000 ease-linear',
							isUrgent ? 'bg-red-600' : 'bg-amber-600'
						)}
						style={{
							width: `${Math.max(0, Math.min(100, (remainingMinutes / 10) * 100))}%`
						}}
					/>
				</div>
			</div>
		</div>
	);
}