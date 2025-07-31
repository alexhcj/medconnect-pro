'use client'

import React, {useState} from 'react';
import {useRouter} from "next/navigation";
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
	CheckCircleIcon,
	ChevronDownIcon,
	ChevronUpIcon,
	DocumentDuplicateIcon,
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

// Validation schema
const loginSchema = z.object({
	email: z
		.email('Please enter a valid email address')
		.min(3, 'Email is required'),
	password: z.string()
		.min(8, 'Password must be at least 8 characters')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
			'Password must contain uppercase, lowercase, number and special character'),
	rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
type MfaMethod = 'sms' | 'email' | 'app';

interface MfaState {
	show: boolean;
	isFirstTime: boolean;
	methods: MfaMethod[];
	qrCode?: string;
	secret?: string;
	sessionToken?: string;
}

const LoginPage = () => {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// MFA state management
	const [mfaState, setMfaState] = useState<MfaState>({
		show: false,
		isFirstTime: false,
		methods: ['app', 'sms', 'email']
	});

	// MFA-specific states
	const [mfaCode, setMfaCode] = useState('');
	const [mfaMethod, setMfaMethod] = useState<MfaMethod>('app');
	const [mfaAttempts, setMfaAttempts] = useState(0);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [trustDevice, setTrustDevice] = useState(false);
	const [setupComplete, setSetupComplete] = useState(false);

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

	// TODO: replace with API calls
	const mockQRCode = "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23f0f0f0'/%3e%3ctext x='50' y='50' text-anchor='middle' dy='.3em' font-family='monospace' font-size='8'%3eQR CODE%3c/text%3e%3c/svg%3e";
	const mockBackupCodes = [
		'8B2C-4E9F', '1A7D-3K8M', '9P5Q-2R6S', '4T8U-7V1W',
		'3X9Y-5Z2A', '6B4C-8D1E', '2F7G-9H3I', '5J8K-1L4M'
	];
	const mockSecret = 'JBSWY3DPEHPK3PXP';

	const handleLoginSubmit = async (data: LoginFormData) => {
		setIsLoading(true);

		try {
			// TODO: Replace with real API call
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					email: data.email,
					password: data.password,
					rememberMe: data.rememberMe
				})
			});

			// TODO: add login API call
			await new Promise(resolve => setTimeout(resolve, 1500));

			// TODO: Mock API response - replace with real response handling
			const mockApiResponse = {
				success: true,
				requiresMFA: true,
				isFirstTime: Math.random() > 0.5, // Random for demo
				methods: ['app', 'sms', 'email'] as MfaMethod[],
				qrCode: mockQRCode,
				secret: mockSecret,
				sessionToken: 'temp_session_token_123'
			};

			// TODO: use login response data to determine if first-time setup needed (apiResponse.requiresMfaSetup || false)
			if (mockApiResponse.success && mockApiResponse.requiresMFA) {
				// Set MFA state based on API response
				setMfaState({
					show: true,
					isFirstTime: mockApiResponse.isFirstTime,
					methods: mockApiResponse.methods,
					qrCode: mockApiResponse.qrCode,
					secret: mockApiResponse.secret,
					sessionToken: mockApiResponse.sessionToken
				});

				toast.success(
					mockApiResponse.isFirstTime
						? 'Credentials verified. Please setup multi-factor authentication.'
						: 'Credentials verified. Please complete multi-factor authentication.'
				);
			} else if (mockApiResponse.success) {
				// Direct login without MFA
				toast.success('Login successful! Redirecting to dashboard...');
				router.push('/dashboard');
			}
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
			// TODO: Replace with real API call
			const response = await fetch('/api/auth/mfa/verify', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({
					code: mfaCode,
					method: mfaMethod,
					sessionToken: mfaState.sessionToken,
					trustDevice: trustDevice
				})
			});

			// Mock verification
			await new Promise(resolve => setTimeout(resolve, 1000));

			if (mfaCode === '123456') {
				if (mfaState.isFirstTime) {
					setSetupComplete(true);
					toast.success('MFA setup completed successfully!');
				} else {
					toast.success('Login successful! Redirecting to dashboard...');
					router.push('/dashboard');
				}
			} else {
				setMfaAttempts(prev => prev + 1);
				setMfaCode('');
				throw new Error('Invalid code');
			}
		} catch (error) {
			toast.error('Invalid verification code. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackupCodeDownload = () => {
		const content = `Healthcare App - Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\n\n${mockBackupCodes.join('\n')}\n\nKeep these codes secure and accessible.`;
		const blob = new Blob([content], {type: 'text/plain'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'mfa-backup-codes.txt';
		a.click();
		URL.revokeObjectURL(url);
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard!');
	};

	const handleForgotPassword = () => {
		router.push('/password-reset');
		toast.success('Password reset instructions have been sent to your email.');
	};

	const maxAttempts = 5;
	const remainingAttempts = maxAttempts - mfaAttempts;

	// MFA Setup Complete Screen
	if (mfaState.show && mfaState.isFirstTime && setupComplete) {
		return (
			<div
				className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
				<Toaster position="top-center"/>
				<div className="w-full max-w-md">
					<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
						<div className="text-center mb-6">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<CheckCircleIcon className="w-8 h-8 text-green-600"/>
							</div>
							<h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
							<p className="text-gray-600">Your account is now secured with multi-factor authentication</p>
						</div>

						<div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
							<div className="flex items-start">
								<ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0"/>
								<div className="text-sm text-amber-800">
									<p className="font-medium mb-1">Save Your Backup Codes</p>
									<p>These codes can be used if you lose access to your primary authentication method.</p>
								</div>
							</div>
						</div>

						<div className="mb-6">
							<div className="grid grid-cols-2 gap-2 mb-4">
								{mockBackupCodes.map((code, index) => (
									<div key={index}
											 className="bg-gray-50 border border-gray-200 rounded p-2 text-center font-mono text-sm">
										{code}
									</div>
								))}
							</div>

							<button
								onClick={handleBackupCodeDownload}
								className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
							>
								<DocumentDuplicateIcon className="w-4 h-4 mr-2"/>
								Download Backup Codes
							</button>
						</div>

						<button
							onClick={() => {
								toast.success('Redirecting to dashboard...');
								router.push('/dashboard');
							}}
							className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
						>
							Continue to Dashboard
						</button>
					</div>
				</div>
			</div>
		);
	}

	// MFA Verification/Setup Screen
	if (mfaState.show) {
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
							<h2 className="text-2xl font-bold text-gray-900 mb-2">
								{mfaState.isFirstTime ? 'Setup Multi-Factor Authentication' : 'Multi-Factor Authentication'}
							</h2>
							<p className="text-gray-600">
								{mfaState.isFirstTime ? 'Secure your account with an additional verification method' : 'Please verify your identity to continue'}
							</p>
						</div>

						{/* Enhanced MFA Context Notice */}
						<div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-start">
								<ShieldCheckIcon className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0"/>
								<div className="text-xs text-blue-800">
									<p className="font-medium">Enhanced Security Active</p>
									<p>Additional verification protects patient
										data. {trustDevice && 'This device will be remembered for 30 days.'}</p>
								</div>
							</div>
						</div>

						{/* Status Indicators */}
						{mfaAttempts > 0 && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<div className="flex items-center">
									<ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-2"/>
									<div className="text-sm text-red-800">
										<p>Invalid code. {remainingAttempts} attempts remaining</p>
										{remainingAttempts <= 2 && (
											<p className="text-xs mt-1">Account will be temporarily locked after 5 failed attempts</p>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Method Selection */}
						<div className="mb-6">
							<div className="flex justify-center space-x-2 mb-4">
								{mfaState.methods.map((method) => (
									<button
										key={method}
										onClick={() => setMfaMethod(method)}
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

							{/* QR Code Generation for Setup */}
							{mfaState.isFirstTime && mfaMethod === 'app' && (
								<div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
									<div className="text-center">
										<div className="bg-white p-4 rounded-lg inline-block mb-4">
											<img src={mfaState.qrCode} alt="QR Code" className="w-32 h-32 mx-auto"/>
										</div>
										<p className="text-sm text-gray-600 mb-2">
											Scan this QR code with your authenticator app
										</p>
										<div className="text-xs text-gray-500">
											<p className="mb-1">Manual entry key:</p>
											<div
												className="bg-white border border-gray-200 rounded px-2 py-1 font-mono flex items-center justify-between">
												<span>{mfaState.secret}</span>
												<button
													onClick={() => copyToClipboard(mfaState.secret || '')}
													className="text-blue-600 hover:text-blue-700"
												>
													<DocumentDuplicateIcon className="w-4 h-4"/>
												</button>
											</div>
										</div>
									</div>
								</div>
							)}

							<p className="text-sm text-gray-600 text-center mb-4">
								{mfaMethod === 'app' && (mfaState.isFirstTime ? 'Enter the 6-digit code from your authenticator app after scanning' : 'Enter the 6-digit code from your authenticator app')}
								{mfaMethod === 'sms' && 'Enter the 6-digit code sent to your phone'}
								{mfaMethod === 'email' && 'Enter the 6-digit code sent to your email'}
							</p>
						</div>

						{/* Code Input */}
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
								disabled={remainingAttempts === 0}
							/>
						</div>

						{/* Progressive Disclosure - Advanced Options */}
						<div className="mb-6">
							<button
								type="button"
								onClick={() => setShowAdvanced(!showAdvanced)}
								className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
							>
								<span>Advanced Options</span>
								{showAdvanced ? <ChevronUpIcon className="w-4 h-4"/> : <ChevronDownIcon className="w-4 h-4"/>}
							</button>

							{showAdvanced && (
								<div className="mt-3 space-y-3 p-3 bg-gray-50 rounded-lg">
									<div className="flex items-center">
										<input
											type="checkbox"
											id="trustDevice"
											checked={trustDevice}
											onChange={(e) => setTrustDevice(e.target.checked)}
											className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-gray-300 rounded"
										/>
										<label htmlFor="trustDevice" className="ml-2 text-sm text-gray-700">
											Trust this device for 30 days
										</label>
									</div>

									{!mfaState.isFirstTime && (
										<button
											type="button"
											onClick={() => toast.custom('Backup code functionality would be implemented here')} // TODO: it must be info type color, theme
											className="text-sm text-blue-600 hover:text-blue-700"
										>
											Use backup code instead
										</button>
									)}
								</div>
							)}
						</div>

						<button
							onClick={handleMFASubmit}
							disabled={mfaCode.length !== 6 || isLoading || remainingAttempts === 0}
							className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? 'Verifying...' : mfaState.isFirstTime ? 'Complete Setup' : 'Verify & Sign In'}
						</button>

						<div className="mt-4 text-center">
							<button
								onClick={() => setMfaState(prev => ({...prev, show: false}))}
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

	// Original Login Form
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
					<form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-6">
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
										className="h-4 w-4 text-blue-600 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 rounded"
									/>
									<label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
										Remember me
									</label>
								</div>
								<button
									type="button"
									onClick={handleForgotPassword}
									className="text-sm text-blue-600 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:text-blue-700 font-medium cursor-pointer"
								>
									Forgot password?
								</button>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={!isValid || isLoading}
								variant={isValid && !isLoading ? 'default' : 'secondary'}
								className='w-full'
								size='lg'
							>
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