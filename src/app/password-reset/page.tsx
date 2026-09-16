'use client'

import React, {useEffect, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {ArrowLeft, CircleCheck, Eye, EyeOff, Key, Loader2, Lock, Mail, ShieldCheck, TriangleAlert} from 'lucide-react';

// Separate schemas for each step
const emailSchema = z.object({
	email: z.email('Please enter a valid email address'),
});

const passwordResetSchema = z.object({
	password: z.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
		.regex(/[a-z]/, 'Password must contain at least one lowercase letter')
		.regex(/[0-9]/, 'Password must contain at least one number')
		.regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
	confirmPassword: z.string().min(1, 'Please confirm your password')
}).refine(data => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"]
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

const PasswordResetPage = () => {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get('token');

	const [currentStep, setCurrentStep] = useState('email'); // email, token-validation, new-password, success
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [resetToken, setResetToken] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);
	const [tokenValid, setTokenValid] = useState(false);
	const [userEmail, setUserEmail] = useState(''); // Store email from first step

	// Email form
	const emailForm = useForm<EmailFormData>({
		resolver: zodResolver(emailSchema),
		mode: 'onChange'
	});

	// Password form
	const passwordForm = useForm<PasswordResetFormData>({
		resolver: zodResolver(passwordResetSchema),
		mode: 'onChange'
	});

	const email = emailForm.watch('email');
	const password = passwordForm.watch('password') || '';
	const confirmPassword = passwordForm.watch('confirmPassword') || '';

	// Password strength checker
	const checkPasswordStrength = (pwd: string) => {
		let strength = 0;
		if (pwd.length >= 8) strength++;
		if (/[A-Z]/.test(pwd)) strength++;
		if (/[a-z]/.test(pwd)) strength++;
		if (/[0-9]/.test(pwd)) strength++;
		if (/[^A-Za-z0-9]/.test(pwd)) strength++;
		return strength;
	};

	useEffect(() => {
		if (password) {
			setPasswordStrength(checkPasswordStrength(password));
		} else {
			setPasswordStrength(0);
		}
	}, [password]);

	// Handle token validation on page load
	useEffect(() => {
		if (token) {
			setCurrentStep('token-validation');
			validateToken(token);
		}
	}, [token]);

	const validateToken = async (tokenValue: string) => {
		setLoading(true);
		try {
			// TODO: add validateToken API call
			await new Promise(resolve => setTimeout(resolve, 1500));
			setTokenValid(true);
			setCurrentStep('new-password');
		} catch (err) {
			setError('Invalid or expired reset token. Please request a new password reset.');
			setCurrentStep('email');
		} finally {
			setLoading(false);
		}
	};

	const handleEmailSubmit = async (data: EmailFormData) => {
		setLoading(true);
		setError('');

		try {
			// TODO: add sendResetEmail API call
			await new Promise(resolve => setTimeout(resolve, 2000));
			setUserEmail(data.email); // Store email for success message
			setCurrentStep('success');
		} catch (err) {
			setError('Unable to send reset email. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const handlePasswordReset = async (data: PasswordResetFormData) => {
		setLoading(true);
		setError('');

		try {
			// TODO: add resetPassword API call
			await new Promise(resolve => setTimeout(resolve, 2000));
			setCurrentStep('success');
		} catch (err) {
			setError('Failed to reset password. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	const getPasswordStrengthColor = () => {
		if (passwordStrength <= 2) return 'bg-red-500';
		if (passwordStrength <= 3) return 'bg-yellow-500';
		return 'bg-green-500';
	};

	const getPasswordStrengthText = () => {
		if (passwordStrength <= 2) return 'Weak';
		if (passwordStrength <= 3) return 'Medium';
		return 'Strong';
	};

	const renderEmailStep = () => (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
					<Mail className="h-6 w-6 text-blue-600"/>
				</div>
				<h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
					Reset your password
				</h2>
				<p className="mt-2 text-sm text-gray-600">
					Enter your email address and we&apos;ll send you a link to reset your password
				</p>
			</div>

			<form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
				<div>
					<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
						Email address
					</label>
					<div className="relative">
						<input
							{...emailForm.register('email')}
							id="email"
							type="email"
							autoComplete="email"
							className={`block w-full rounded-lg border px-3 py-3 pl-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 ${emailForm.formState.errors.email ? 'border-red-300 bg-red-50' : email ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
							placeholder="Enter your email address"
						/>
						<Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"/>
					</div>
					{emailForm.formState.errors.email && (
						<p className="text-sm text-red-600 mt-1">{emailForm.formState.errors.email.message}</p>
					)}
				</div>

				{error && (
					<div className="rounded-lg bg-red-50 p-4">
						<div className="flex">
							<TriangleAlert className="h-5 w-5 text-red-400"/>
							<div className="ml-3">
								<p className="text-sm font-medium text-red-800">{error}</p>
							</div>
						</div>
					</div>
				)}

				<button
					type="submit"
					disabled={loading || !email || !!emailForm.formState.errors.email}
					className="flex w-full justify-center items-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
							Sending reset link...
						</>
					) : (
						'Send reset link'
					)}
				</button>
			</form>

			<div className="text-center">
				<button
					onClick={() => router.push('/login')}
					className="flex items-center justify-center w-full text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
				>
					<ArrowLeft className="mr-2 h-4 w-4"/>
					Back to login
				</button>
			</div>
		</div>
	);

	const renderTokenValidation = () => (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
					<Loader2 className="h-6 w-6 text-blue-600 animate-spin"/>
				</div>
				<h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">
					Validating reset token
				</h2>
				<p className="mt-2 text-sm text-gray-600">
					Please wait while we verify your reset token...
				</p>
			</div>
		</div>
	);

	const renderNewPasswordStep = () => (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<Key className="h-6 w-6 text-green-600"/>
				</div>
				<h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
					Create new password
				</h2>
				<p className="mt-2 text-sm text-gray-600">
					Your new password must be different from previously used passwords
				</p>
			</div>

			<form onSubmit={passwordForm.handleSubmit(handlePasswordReset)} className="space-y-4">
				<div>
					<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
						New password
					</label>
					<div className="relative">
						<input
							{...passwordForm.register('password')}
							id="password"
							type={showPassword ? 'text' : 'password'}
							className={`block w-full rounded-lg border px-3 py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 ${passwordForm.formState.errors.password ? 'border-red-300 bg-red-50' : password ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
							placeholder="Enter new password"
						/>
						<Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-3.5"
						>
							{showPassword ? (
								<EyeOff className="h-5 w-5 text-gray-400"/>
							) : (
								<Eye className="h-5 w-5 text-gray-400"/>
							)}
						</button>
					</div>
					{passwordForm.formState.errors.password && (
						<p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.password.message}</p>
					)}

					{password && (
						<div className="mt-2">
							<div className="flex justify-between text-xs text-gray-600 mb-1">
								<span>Password strength</span>
								<span
									className={`font-medium ${passwordStrength <= 2 ? 'text-red-600' : passwordStrength <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
	                  {getPasswordStrengthText()}
	                </span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
									style={{width: `${(passwordStrength / 5) * 100}%`}}
								/>
							</div>
						</div>
					)}
				</div>

				<div>
					<label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
						Confirm new password
					</label>
					<div className="relative">
						<input
							{...passwordForm.register('confirmPassword')}
							id="confirmPassword"
							type={showConfirmPassword ? 'text' : 'password'}
							className={`block w-full rounded-lg border px-3 py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-blue-500 ${passwordForm.formState.errors.confirmPassword || (password && confirmPassword && password !== confirmPassword) ? 'border-red-300 bg-red-50' : confirmPassword && password === confirmPassword ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
							placeholder="Confirm new password"
						/>
						<Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-3 top-3.5"
						>
							{showConfirmPassword ? (
								<EyeOff className="h-5 w-5 text-gray-400"/>
							) : (
								<Eye className="h-5 w-5 text-gray-400"/>
							)}
						</button>
					</div>
					{passwordForm.formState.errors.confirmPassword && (
						<p className="text-sm text-red-600 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
					)}
				</div>

				<div className="bg-blue-50 rounded-lg p-4">
					<h4 className="text-sm font-medium text-blue-900 mb-2">Password requirements:</h4>
					<ul className="text-xs text-blue-800 space-y-1">
						<li className={`flex items-center ${password.length >= 8 ? 'text-green-700' : ''}`}>
							<CircleCheck className={`h-3 w-3 mr-2 ${password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}/>
							At least 8 characters long
						</li>
						<li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-700' : ''}`}>
							<CircleCheck
								className={`h-3 w-3 mr-2 ${/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}/>
							One uppercase letter
						</li>
						<li className={`flex items-center ${/[a-z]/.test(password) ? 'text-green-700' : ''}`}>
							<CircleCheck
								className={`h-3 w-3 mr-2 ${/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}/>
							One lowercase letter
						</li>
						<li className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-700' : ''}`}>
							<CircleCheck
								className={`h-3 w-3 mr-2 ${/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}/>
							One number
						</li>
						<li className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? 'text-green-700' : ''}`}>
							<CircleCheck
								className={`h-3 w-3 mr-2 ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-400'}`}/>
							One special character
						</li>
					</ul>
				</div>

				{error && (
					<div className="rounded-lg bg-red-50 p-4">
						<div className="flex">
							<TriangleAlert className="h-5 w-5 text-red-400"/>
							<div className="ml-3">
								<p className="text-sm font-medium text-red-800">{error}</p>
							</div>
						</div>
					</div>
				)}

				<button
					type="submit"
					disabled={loading || !password || !confirmPassword || passwordStrength < 4 || !!passwordForm.formState.errors.password || !!passwordForm.formState.errors.confirmPassword || password !== confirmPassword}
					className="flex w-full justify-center items-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
				>
					{loading ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin"/>
							Resetting password...
						</>
					) : (
						'Reset password'
					)}
				</button>
			</form>
		</div>
	);

	const renderSuccessStep = () => (
		<div className="space-y-6">
			<div className="text-center">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
					<CircleCheck className="h-6 w-6 text-green-600"/>
				</div>
				<h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
					{currentStep === 'success' && password ? 'Password reset successfully' : 'Check your email'}
				</h2>
				<p className="mt-2 text-sm text-gray-600">
					{currentStep === 'success' && password
						? 'Your password has been reset successfully. You can now sign in with your new password.'
						: `We've sent a password reset link to ${userEmail || email}. Click the link in the email to reset your password.`
					}
				</p>
			</div>

			<div className="bg-green-50 rounded-lg p-4">
				<div className="flex">
					<ShieldCheck className="h-5 w-5 text-green-400"/>
					<div className="ml-3">
						<p className="text-sm font-medium text-green-800">
							Security Notice
						</p>
						<p className="text-sm text-green-700 mt-1">
							{currentStep === 'success' && password
								? 'Your account security has been updated. If you did not make this change, please contact support immediately.'
								: 'For security reasons, this link will expire in 15 minutes. If you don\'t see the email, check your spam folder.'
							}
						</p>
					</div>
				</div>
			</div>

			<button
				onClick={() => router.push('/login')}
				className="flex w-full justify-center items-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 cursor-pointer"
			>
				{currentStep === 'success' && password ? 'Sign in now' : 'Back to login'}
			</button>

			{currentStep === 'success' && !password && (
				<div className="text-center">
					<button
						onClick={() => setCurrentStep('email')}
						className="text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
					>
						Did&apos;t receive the email? Try again
					</button>
				</div>
			)}
		</div>
	);

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div className="bg-white shadow-xl rounded-2xl p-8">
					{/* HIPAA Compliance Notice */}
					<div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
						<div className="flex items-start">
							<ShieldCheck className="h-4 w-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0"/>
							<p className="text-xs text-blue-800">
								<span className="font-semibold">HIPAA Compliant:</span> Your data is encrypted and secure. This password
								reset process follows healthcare privacy standards.
							</p>
						</div>
					</div>

					{/* Main Content */}
					{currentStep === 'email' && renderEmailStep()}
					{currentStep === 'token-validation' && renderTokenValidation()}
					{currentStep === 'new-password' && renderNewPasswordStep()}
					{currentStep === 'success' && renderSuccessStep()}
				</div>

				{/* Footer */}
				<div className="text-center">
					<p className="text-xs text-gray-500">
						Having trouble? <a href="/support" className="text-blue-600 hover:text-blue-500">Contact support</a>
					</p>
				</div>
			</div>
		</div>
	);
};

export default PasswordResetPage;