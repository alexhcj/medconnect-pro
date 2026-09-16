'use client';

import React, {Fragment, useEffect, useState} from 'react';
import {Dialog, DialogPanel, DialogTitle, Transition, TransitionChild} from '@headlessui/react';
import {ComputerDesktopIcon, DevicePhoneMobileIcon, ExclamationTriangleIcon} from '@heroicons/react/24/outline';
import {useConcurrentSessions, useTerminateSessions} from '@/lib/hooks/use-session';
import {useUISelectors} from '@/lib/stores/ui-store';

export function ConcurrentSessionDialog() {
	const {data: sessions = [], isLoading} = useConcurrentSessions();
	const terminateSessions = useTerminateSessions();
	const {addNotification} = useUISelectors.useNotificationActions();
	const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
	const [isOpen, setIsOpen] = useState(false);

	// Show dialog when multiple sessions detected
	useEffect(() => {
		if (sessions.length > 1) {
			setIsOpen(true);
			// Auto-select non-current sessions
			const nonCurrentSessions = sessions
				.filter(session => !session.isCurrentSession)
				.map(session => session.sessionId);
			setSelectedSessions(nonCurrentSessions);

			addNotification({
				type: 'warning',
				title: 'Multiple Sessions Detected',
				message: `${sessions.length} active sessions found. Please review them for security.`,
			});
		} else {
			setIsOpen(false);
		}
	}, [sessions, addNotification]);

	const handleTerminateSessions = async () => {
		if (selectedSessions.length === 0) return;

		try {
			await terminateSessions.mutateAsync(selectedSessions);
			setIsOpen(false);
			addNotification({
				type: 'success',
				title: 'Sessions Terminated',
				message: `${selectedSessions.length} session(s) terminated successfully.`,
			});
		} catch (error) {
			addNotification({
				type: 'error',
				title: 'Termination Failed',
				message: 'Failed to terminate some sessions. Please try again.',
			});
		}
	};

	const handleContinueHere = async () => {
		try {
			// Terminate all other sessions
			const otherSessions = sessions
				.filter(session => !session.isCurrentSession)
				.map(session => session.sessionId);

			if (otherSessions.length > 0) {
				await terminateSessions.mutateAsync(otherSessions);
			}

			setIsOpen(false);
			addNotification({
				type: 'success',
				title: 'Other Sessions Terminated',
				message: 'All other sessions have been terminated. You can continue working here.',
			});
		} catch (error) {
			addNotification({
				type: 'error',
				title: 'Termination Failed',
				message: 'Failed to terminate other sessions.',
			});
		}
	};

	const handleLogoutEverywhere = () => {
		addNotification({
			type: 'info',
			title: 'Logging Out',
			message: 'Terminating all sessions and logging out...',
		});

		// Logout everywhere
		window.location.href = '/auth/logout?reason=concurrent&action=logout_all';
	};

	const toggleSession = (sessionId: string) => {
		setSelectedSessions(prev =>
			prev.includes(sessionId)
				? prev.filter(id => id !== sessionId)
				: [...prev, sessionId]
		);
	};

	const getDeviceIcon = (device: string) => {
		if (device.toLowerCase().includes('mobile') || device.toLowerCase().includes('phone')) {
			return <DevicePhoneMobileIcon className="h-5 w-5"/>;
		}
		return <ComputerDesktopIcon className="h-5 w-5"/>;
	};

	const formatLastActivity = (timestamp: number) => {
		const now = Date.now();
		const diff = now - timestamp;
		const minutes = Math.floor(diff / (60 * 1000));
		const hours = Math.floor(minutes / 60);

		if (minutes < 1) return 'Just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		return new Date(timestamp).toLocaleDateString();
	};

	if (isLoading || sessions.length <= 1) {
		return null;
	}

	return (
		<Transition appear show={isOpen} as={Fragment}>
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
								className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
								<div className="flex items-center space-x-3 mb-4">
									<div className="flex-shrink-0 rounded-full bg-amber-100 p-2">
										<ExclamationTriangleIcon className="h-6 w-6 text-amber-600"/>
									</div>

									<div>
										<DialogTitle as="h3" className="text-lg font-medium leading-6 text-gray-900">
											Multiple Sessions Detected
										</DialogTitle>
									</div>
								</div>

								<div className="mb-6">
									<p className="text-sm text-gray-600 mb-4">
										We detected that you&apos;re logged in from multiple locations. For security reasons,
										please review these sessions and terminate any that you don&apos;t recognize.
									</p>

									<div className="space-y-3 max-h-64 overflow-y-auto">
										{sessions.map((session) => (
											<div
												key={session.sessionId}
												className={`p-3 rounded-lg border transition-colors ${
													session.isCurrentSession
														? 'bg-blue-50 border-blue-200'
														: selectedSessions.includes(session.sessionId)
															? 'bg-red-50 border-red-200'
															: 'bg-gray-50 border-gray-200'
												}`}
											>
												<div className="flex items-start justify-between">
													<div className="flex items-start space-x-3">
														<div className="text-gray-600 mt-1">
															{getDeviceIcon(session.device)}
														</div>

														<div className="flex-1 min-w-0">
															<div className="flex items-center space-x-2">
																<p className="text-sm font-medium text-gray-900">
																	{session.device}
																</p>
																{session.isCurrentSession && (
																	<span
																		className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Current Session
                                  </span>
																)}
															</div>

															<p className="text-xs text-gray-500 mt-1">
																{session.browser} • {session.location}
															</p>

															<p className="text-xs text-gray-500">
																Last active: {formatLastActivity(session.lastActivity)}
															</p>

															<p className="text-xs text-gray-400">
																IP: {session.ipAddress}
															</p>
														</div>
													</div>

													{!session.isCurrentSession && (
														<label className="flex items-center">
															<input
																type="checkbox"
																checked={selectedSessions.includes(session.sessionId)}
																onChange={() => toggleSession(session.sessionId)}
																className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
															/>
															<span className="ml-2 text-xs text-gray-600">Terminate</span>
														</label>
													)}
												</div>
											</div>
										))}
									</div>
								</div>

								{/* Security recommendations */}
								<div className="mb-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
									<p className="text-sm text-yellow-800 font-medium">Security Recommendation</p>
									<p className="text-xs text-yellow-700 mt-1">
										If you don&apos;t recognize any of these sessions, terminate them immediately and consider changing
										your
										password.
									</p>
								</div>

								<div className="flex flex-col space-y-3">
									<div className="flex space-x-3">
										<button
											type="button"
											className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
											onClick={handleContinueHere}
											disabled={terminateSessions.isPending}
										>
											Continue Here Only
										</button>

										<button
											type="button"
											className={`flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${
												selectedSessions.length === 0 || terminateSessions.isPending
													? 'bg-gray-400 cursor-not-allowed'
													: 'bg-red-600 hover:bg-red-700'
											}`}
											onClick={handleTerminateSessions}
											disabled={selectedSessions.length === 0 || terminateSessions.isPending}
										>
											{terminateSessions.isPending ? (
												<>
													<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg"
															 fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
																		strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor"
																	d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													Terminating...
												</>
											) : (
												`Terminate Selected (${selectedSessions.length})`
											)}
										</button>
									</div>

									<button
										type="button"
										className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
										onClick={handleLogoutEverywhere}
									>
										Log Out Everywhere
									</button>
								</div>
							</DialogPanel>
						</TransitionChild>
					</div>
				</div>
			</Dialog>
		</Transition>
	);
}