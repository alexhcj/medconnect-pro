'use client';

import React, {useEffect, useState} from 'react';
import {AlertCircle, CheckCircle, Mail, RefreshCw} from 'lucide-react';
import {toast, Toaster} from 'react-hot-toast';
import Link from 'next/link';

export default function EmailVerification() {
	const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'expired'>('pending');
	const [isResending, setIsResending] = useState(false);
	const [email, setEmail] = useState<string>('');
	// TODO: mb save to localstorage | use server timeout?
	const [countdown, setCountdown] = useState(0);

	// Simulate getting the email from URL params or local storage
	useEffect(() => {
		// In a real app, you'd get this from search params or context
		const searchParams = new URLSearchParams(window.location.search);
		const emailParam = searchParams.get('email');
		if (emailParam) {
			setEmail(emailParam);
		}

		// Check token validity - this would be an API call in production
		// TODO: add validateToken API call
		const token = searchParams.get('token');
		if (token === 'verified') {
			setVerificationStatus('success');
		} else if (token === 'expired') {
			setVerificationStatus('expired');
		}
	}, []);

	const handleResendVerification = async () => {
		setIsResending(true);
		try {
			// Simulate API call
			// TODO: add resendVerificationCode API call
			await new Promise(resolve => setTimeout(resolve, 1500));
			toast.success('Verification email resent successfully!');

			// Set countdown for resend button
			setCountdown(60);
			const timer = setInterval(() => {
				setCountdown(prev => {
					if (prev <= 1) {
						clearInterval(timer);
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} catch (error) {
			toast.error('Failed to resend verification email. Please try again.');
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<Toaster position="top-center"/>

			<div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
				<div className="text-center mb-6">
					{verificationStatus === 'success' ? (
						<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<CheckCircle className="w-8 h-8 text-green-600"/>
						</div>
					) : verificationStatus === 'expired' ? (
						<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<AlertCircle className="w-8 h-8 text-red-600"/>
						</div>
					) : (
						<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
							<Mail className="w-8 h-8 text-blue-600"/>
						</div>
					)}

					<h1 className="text-2xl font-bold text-gray-900">
						{verificationStatus === 'success'
							? 'Email Verified!'
							: verificationStatus === 'expired'
								? 'Verification Link Expired'
								: 'Verify Your Email'}
					</h1>

					<p className="text-gray-600 mt-2">
						{verificationStatus === 'success'
							? 'Your email has been successfully verified.'
							: verificationStatus === 'expired'
								? 'The verification link has expired or is invalid.'
								: `We've sent a verification link to ${email || 'your email address'}.`}
					</p>
				</div>

				{verificationStatus === 'success' ? (
					<div className="space-y-6">
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<div className="flex items-start">
								<CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0"/>
								<div>
									<p className="text-green-800 font-medium">Your account is now active</p>
									<p className="text-green-700 text-sm mt-1">You can now sign in to your healthcare account and access
										all features.</p>
								</div>
							</div>
						</div>

						<Link
							href="/login"
							className="block w-full py-3 px-4 bg-blue-600 text-white text-center font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
						>
							Sign In to Your Account
						</Link>
					</div>
				) : (
					<div className="space-y-6">
						{verificationStatus === 'pending' && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<div className="flex items-start">
									<Mail className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"/>
									<div className="text-sm text-blue-800">
										<p>Please check your inbox and click the verification link to complete your registration.</p>
										<p className="mt-1">If you don&apos;t see the email, check your spam folder.</p>
									</div>
								</div>
							</div>
						)}

						{verificationStatus === 'expired' && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4">
								<div className="flex items-start">
									<AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"/>
									<div className="text-sm text-red-800">
										<p>The verification link has expired or is invalid.</p>
										<p className="mt-1">Please request a new verification link to continue.</p>
									</div>
								</div>
							</div>
						)}

						<button
							onClick={handleResendVerification}
							disabled={isResending || countdown > 0}
							className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
							aria-label="Resend verification email"
						>
							{isResending ? (
								<>
									<RefreshCw className="w-5 h-5 mr-2 animate-spin"/>
									Sending...
								</>
							) : countdown > 0 ? (
								`Resend in ${countdown}s`
							) : (
								'Resend Verification Email'
							)}
						</button>

						<div className="text-center">
							<Link
								href="/login"
								className="text-sm text-blue-600 hover:text-blue-700 font-medium"
								aria-label="Return to login page"
							>
								Return to Sign In
							</Link>
						</div>
					</div>
				)}

				{/* HIPAA Compliance Notice */}
				<div className="mt-8 pt-6 border-t border-gray-200">
					<div className="flex items-center justify-center text-xs text-gray-500">
						<div className="flex items-center">
							<p>HIPAA compliant & secure</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
