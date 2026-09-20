'use client';

import React, {Fragment, useEffect, useState} from 'react';
import {Dialog, DialogPanel, DialogTitle, Transition, TransitionChild} from '@headlessui/react';
import {Clock, ShieldCheck, TriangleAlert} from 'lucide-react';
import {useSessionStatus} from '@/lib/hooks/use-session';
import {useUISelectors} from '@/lib/stores/ui-store';

export function SessionExtensionModal() {
	const {isExpiringNow, remainingTime, extendSession, isExtending} = useSessionStatus();
	const addNotification = useUISelectors.useAddNotification();
	const [countdownTime, setCountdownTime] = useState(0);

	// Update countdown every second when modal is visible
	useEffect(() => {
		if (!isExpiringNow) return;

		setCountdownTime(remainingTime);

		const interval = setInterval(() => {
			setCountdownTime(prev => {
				const newTime = Math.max(0, prev - 1000);

				// Auto-logout when time reaches 0
				if (newTime <= 0) {
					window.location.href = '/auth/logout?reason=timeout';
				}

				return newTime;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isExpiringNow, remainingTime]);

	// Trigger auto-save when modal appears
	useEffect(() => {
		if (isExpiringNow) {
			window.dispatchEvent(new CustomEvent('session-auto-save-urgent'));
			addNotification({
				type: 'warning',
				title: 'Session Expiring',
				message: 'Auto-save has been triggered to protect your work.',
			});
		}
	}, [isExpiringNow, addNotification]);

	const handleExtend = async () => {
		try {
			await extendSession();
		} catch (error) {
			// Error handling is done in the query hook
		}
	};

	const handleLogout = () => {
		window.location.href = '/auth/logout?reason=manual';
	};

	// Keyboard shortcuts
	useEffect(() => {
		if (!isExpiringNow) return;

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.code === 'Space') {
				event.preventDefault();
				handleExtend();
			} else if (event.code === 'Escape') {
				event.preventDefault();
				handleLogout();
			}
		};

		document.addEventListener('keydown', handleKeyDown);
		return () => document.removeEventListener('keydown', handleKeyDown);
	}, [isExpiringNow]);

	if (!isExpiringNow) {
		return null;
	}

	const minutes = Math.floor(countdownTime / (60 * 1000));
	const seconds = Math.floor((countdownTime % (60 * 1000)) / 1000);
	const isVeryUrgent = countdownTime <= 30000; // 30 seconds

	return (
		<Transition appear show={isExpiringNow} as={Fragment}>
			<Dialog as="div" className="relative z-50" onClose={() => {
			}}>
				<TransitionChild
					as={Fragment}
					enter="ease-out duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="ease-in duration-200"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 bg-black bg-opacity-75"/>
				</TransitionChild>

				<div className="fixed inset-0 overflow-y-auto">
					<div className="flex min-h-full items-center justify-center p-4 text-center">
						<TransitionChild
							as={Fragment}
							enter="ease-out duration-300"
							enterFrom="opacity-0 scale-95"
							enterTo="opacity-100 scale-100"
							leave="ease-in duration-200"
							leaveFrom="opacity-100 scale-100"
							leaveTo="opacity-0 scale-95"
						>
							<DialogPanel
								className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
								<div className="flex items-center space-x-3 mb-4">
									<div className={`flex-shrink-0 rounded-full p-2 ${isVeryUrgent ? 'bg-red-100' : 'bg-amber-100'}`}>
										{isVeryUrgent ? (
											<TriangleAlert className="h-6 w-6 text-red-600"/>
										) : (
											<Clock className="h-6 w-6 text-amber-600"/>
										)}
									</div>

									<div>
										<DialogTitle
											as="h3"
											className={`text-lg font-medium leading-6 ${isVeryUrgent ? 'text-red-900' : 'text-amber-900'}`}
										>
											{isVeryUrgent ? 'Session Expiring Now!' : 'Session About to Expire'}
										</DialogTitle>
									</div>
								</div>

								<div className="mb-6">
									<div className={`text-center p-4 rounded-lg ${isVeryUrgent ? 'bg-red-50' : 'bg-amber-50'}`}>
										<div className={`text-3xl font-bold ${isVeryUrgent ? 'text-red-600' : 'text-amber-600'}`}>
											{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
										</div>
										<p className={`text-sm mt-1 ${isVeryUrgent ? 'text-red-700' : 'text-amber-700'}`}>
											Time remaining
										</p>
									</div>

									<div className="mt-4 text-sm text-gray-600">
										{isVeryUrgent ? (
											<p>
												<strong>Your session is expiring in seconds!</strong> Your work has been automatically saved.
												Choose to extend your session or you will be logged out automatically.
											</p>
										) : (
											<p>
												For your security, you will be automatically logged out soon.
												Any unsaved work will be lost unless you extend your session.
											</p>
										)}
									</div>
								</div>

								{/* Security notice */}
								<div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
									<div className="flex items-start space-x-2">
										<ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0"/>
										<div className="text-sm text-blue-800">
											<p className="font-medium">Security Notice</p>
											<p className="mt-1">
												This timeout helps protect patient information. If you&apos;re actively working,
												please extend your session. Otherwise, you&apos;ll be safely logged out.
											</p>
										</div>
									</div>
								</div>

								<div className="flex space-x-3">
									<button
										type="button"
										className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
										onClick={handleLogout}
										disabled={isExtending}
									>
										Log Out Now
									</button>

									<button
										type="button"
										className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${
											isVeryUrgent
												? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
												: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
										} ${isExtending ? 'opacity-50 cursor-not-allowed' : ''}`}
										onClick={handleExtend}
										disabled={isExtending}
									>
										{isExtending ? (
											<>
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
														 fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
																	strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor"
																d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												Extending...
											</>
										) : (
											'Extend Session'
										)}
									</button>
								</div>

								{/* Progress bar */}
								<div className="mt-4">
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
												isVeryUrgent ? 'bg-red-600' : 'bg-amber-600'
											}`}
											style={{
												width: `${Math.max(0, (countdownTime / (2 * 60 * 1000)) * 100)}%`
											}}
										/>
									</div>
								</div>

								{/* Keyboard shortcuts hint */}
								<div className="mt-4 text-xs text-gray-500 text-center">
									<p>Press <kbd className="px-1 py-0.5 bg-gray-100 rounded">Space</kbd> to extend or <kbd
										className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to logout</p>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}