'use client'

import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
	CheckCircleIcon,
	EnvelopeIcon,
	ExclamationTriangleIcon,
	EyeIcon,
	EyeSlashIcon,
	LockClosedIcon,
	ShieldCheckIcon
} from '@heroicons/react/24/outline';
import {clsx} from 'clsx';
import toast, {Toaster} from 'react-hot-toast';
import {Button} from '@/components/ui/button';

// TODO: replace?
// Validation schema
const loginSchema = z.object({
	email: z.string()
		.email('Please enter a valid email address')
		.min(3, 'Email is required'),
	password: z.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
			'Password must contain uppercase, lowercase, number and special character'),
	rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
// TODO: replace?
type MfaMethod = 'sms' | 'email' | 'app';

const LoginPage = () => {
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [showMFA, setShowMFA] = useState(false);
	const [mfaCode, setMfaCode] = useState('');
	const [mfaMethod, setMfaMethod] = useState<MfaMethod>('app');

	const {
		register,
		handleSubmit,
		formState: {errors, isValid},
		watch
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: 'onChange'
	});

	const watchedFields = watch();

	const onSubmit = async (data: LoginFormData) => {
		setIsLoading(true);

		try {
			// TODO: add API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// TODO: add MFA
			// Simulate MFA requirement
			console.log(data)
			setShowMFA(true);
			toast.success('Credentials verified. Please complete multi-factor authentication.');
		} catch (error) {
			toast.error('Login failed. Please check your credentials and try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleMFASubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (mfaCode.length !== 6) {
			toast.error('Please enter a valid 6-digit code');
			return;
		}

		setIsLoading(true);
		try {
			await new Promise(resolve => setTimeout(resolve, 1000));
			toast.success('Login successful! Redirecting to dashboard...');
			// Redirect logic would go here
			// 	TODO: add redirect
		} catch (error) {
			toast.error('Invalid verification code. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleForgotPassword = () => {
		toast.success('Password reset instructions have been sent to your email.');
	};

	if (showMFA) {
		return (
			<div
				className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
				<Toaster position="top-center"/>

				<div className="w-full max-w-md">
					<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
						<div className="text-center mb-8">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<ShieldCheckIcon className="w-8 h-8 text-blue-600"/>
							</div>
							<h2 className="text-2xl font-bold text-gray-900 mb-2">Multi-Factor Authentication</h2>
							<p className="text-gray-600">Please verify your identity to continue</p>
						</div>

						<div className="mb-6">
							<div className="flex justify-center space-x-2 mb-4">
								{['app', 'sms', 'email'].map((method) => (
									<button
										key={method}
										onClick={() => setMfaMethod(method as MfaMethod)}
										className={clsx(
											'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
											mfaMethod === method
												? 'bg-blue-600 text-white'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										)}
									>
										{method === 'app' && 'Authenticator App'}
										{method === 'sms' && 'SMS'}
										{method === 'email' && 'Email'}
									</button>
								))}
							</div>

							<p className="text-sm text-gray-600 text-center mb-4">
								{mfaMethod === 'app' && 'Enter the 6-digit code from your authenticator app'}
								{mfaMethod === 'sms' && 'Enter the 6-digit code sent to your phone'}
								{mfaMethod === 'email' && 'Enter the 6-digit code sent to your email'}
							</p>
						</div>

						<form onSubmit={handleMFASubmit}>
							<div className="mb-6">
								<input
									type="text"
									value={mfaCode}
									onChange={(e) => {
										const value = e.target.value.replace(/\D/g, '').slice(0, 6);
										setMfaCode(value);
									}}
									placeholder="000000"
									className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									maxLength={6}
								/>
							</div>

							<button
								type="submit"
								disabled={mfaCode.length !== 6 || isLoading}
								className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								{isLoading ? 'Verifying...' : 'Verify & Sign In'}
							</button>
						</form>

						<div className="mt-4 text-center">
							<button
								onClick={() => setShowMFA(false)}
								className="text-sm text-blue-600 hover:text-blue-700"
							>
								Back to login
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
			<Toaster position="top-center"/>

			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<LockClosedIcon className="w-8 h-8 text-white"/>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
					<p className="text-gray-600">Sign in to your healthcare dashboard</p>
				</div>

				{/* Login Form */}
				<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
						<div className="space-y-6">
							{/* TODO: replace to UI Input */}
							{/* Email Field */}
							<div>
								<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
									Email Address
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<EnvelopeIcon className="h-5 w-5 text-gray-400"/>
									</div>
									<input
										{...register('email')}
										type="email"
										id="email"
										autoComplete="email"
										className={clsx(
											'w-full pl-10 pr-4 py-3 border rounded-lg focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
											errors.email
												? 'border-red-300 bg-red-50'
												: watchedFields.email && !errors.email
													? 'border-green-300 bg-green-50'
													: 'border-gray-300 bg-white'
										)}
										placeholder="Enter your email"
									/>
									{watchedFields.email && !errors.email && (
										<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
											<CheckCircleIcon className="h-5 w-5 text-green-500"/>
										</div>
									)}
								</div>
								{errors.email && (
									<p className="mt-1 text-sm text-red-600 flex items-center">
										<ExclamationTriangleIcon className="w-4 h-4 mr-1"/>
										{errors.email.message}
									</p>
								)}
							</div>

							{/* TODO: replace to UI Input */}
							{/* Password Field */}
							<div>
								<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
									Password
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<LockClosedIcon className="h-5 w-5 text-gray-400"/>
									</div>
									<input
										{...register('password')}
										type={showPassword ? 'text' : 'password'}
										id="password"
										autoComplete="current-password"
										className={clsx(
											'w-full pl-10 pr-12 py-3 border rounded-lg focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
											errors.password
												? 'border-red-300 bg-red-50'
												: watchedFields.password && !errors.password
													? 'border-green-300 bg-green-50'
													: 'border-gray-300 bg-white'
										)}
										placeholder="Enter your password"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute inset-y-0 right-0 pr-3 flex items-center"
									>
										{showPassword ? (
											<EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600"/>
										) : (
											<EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600"/>
										)}
									</button>
								</div>
								{errors.password && (
									<p className="mt-1 text-sm text-red-600 flex items-center">
										<ExclamationTriangleIcon className="w-4 h-4 mr-1"/>
										{errors.password.message}
									</p>
								)}
							</div>

							{/* TODO: replace to UI Checkbox */}
							{/* Remember Me & Forgot Password */}
							<div className="flex items-center justify-between">
								<div className="flex items-center">
									<input
										{...register('rememberMe')}
										id="rememberMe"
										type="checkbox"
										className="h-4 w-4 text-blue-600 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:ring-blue-500 border-gray-300 rounded"
									/>
									<label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
										Remember me
									</label>
								</div>
								<button
									type="button"
									onClick={handleForgotPassword}
									className="text-sm text-blue-600  focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent  hover:text-blue-700 font-medium cursor-pointer"
								>
									Forgot password?
								</button>
							</div>

							{/* Submit Button */}
							<Button type="submit" disabled={!isValid || isLoading}
											variant={isValid && !isLoading ? 'default' : 'secondary'} className='w-full' size='lg'>
								{isLoading ? (
									<div className="flex items-center justify-center">
										<div
											className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
										Signing in...
									</div>
								) : (
									'Sign In'
								)}
							</Button>
						</div>
					</form>

					{/* Security Notice */}
					<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
						<div className="flex items-start">
							<ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"/>
							<div className="text-sm text-blue-800">
								<p className="font-medium mb-1">HIPAA Compliant & Secure</p>
								<p className="text-xs text-blue-600">
									Your data is protected with AES-256 encryption and TLS 1.3 security protocols.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* TODO: what should be on action "Contact your administrator"? */}
				{/* Footer */}
				<div className="mt-6 text-center text-sm text-gray-600">
					<p>Don&apos;t have an account? <a href="#"
																						className="text-blue-600 hover:text-blue-700 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium">Contact
						your
						administrator</a></p>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;