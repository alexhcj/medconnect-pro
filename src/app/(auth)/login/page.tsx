'use client'

import React, {useEffect, useState} from 'react';
import {useRouter} from "next/navigation";
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {
	CircleCheck,
	ChevronDown,
	ChevronUp,
	Clock,
	Copy,
	Eye,
	EyeOff,
	Info,
	Key,
	Lock,
	Mail,
	Monitor,
	ShieldCheck,
	Smartphone,
	TriangleAlert,
} from 'lucide-react';
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
type MfaMethod = 'sms' | 'email' | 'app' | 'backup';

interface MfaState {
	show: boolean;
	isFirstTime: boolean;
	methods: MfaMethod[];
	qrCode?: string;
	secret?: string;
	sessionToken?: string;
}

interface MfaAttemptState {
	attempts: number;
	maxAttempts: number;
	isLocked: boolean;
	lockoutUntil: Date | null;
	nextAttemptAllowedAt: Date | null;
	currentDelay: number; // in seconds
	message: string;
}

interface AuditLog {
	timestamp: Date;
	action: string;
	method: MfaMethod;
	success: boolean;
	ipAddress: string;
	userAgent: string;
}

const LoginPage = () => {
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// MFA state management
	const [mfaState, setMfaState] = useState<MfaState>({
		show: false,
		isFirstTime: false,
		methods: ['app', 'sms', 'email', 'backup']
	});

	// MFA attempt tracking
	const [mfaAttemptState, setMfaAttemptState] = useState<MfaAttemptState>({
		attempts: 0,
		maxAttempts: 5,
		isLocked: false,
		lockoutUntil: null,
		nextAttemptAllowedAt: null,
		currentDelay: 0,
		message: ''
	});

	const [backupAttemptState, setBackupAttemptState] = useState<MfaAttemptState>({
		attempts: 0,
		maxAttempts: 3,
		isLocked: false,
		lockoutUntil: null,
		nextAttemptAllowedAt: null,
		currentDelay: 0,
		message: ''
	});

	// Timer states for countdown display
	const [timeRemaining, setTimeRemaining] = useState<number>(0);
	const [showCountdown, setShowCountdown] = useState(false);

	// MFA-specific states
	const [mfaCode, setMfaCode] = useState('');
	const [backupCode, setBackupCode] = useState('');
	const [mfaMethod, setMfaMethod] = useState<MfaMethod>('app');
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [showBackupHelp, setShowBackupHelp] = useState(false);
	const [trustDevice, setTrustDevice] = useState(false);
	const [setupComplete, setSetupComplete] = useState(false);
	const [deviceInfo, setDeviceInfo] = useState({
		browser: 'Chrome 120.0',
		os: 'Windows 11',
		location: 'New York, NY'
	});

	// Audit logging TODO: remove when add remote audit service
	const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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

	// Progressive delay calculation (30s → 1min → 5min)
	const calculateDelay = (attempts: number): number => {
		if (attempts === 1) return 30; // 30 seconds
		if (attempts === 2) return 60; // 1 minute
		if (attempts >= 3) return 300; // 5 minutes
		return 0;
	};

	// Countdown timer effect
	useEffect(() => {
		let interval: NodeJS.Timeout;

		if (showCountdown && timeRemaining > 0) {
			interval = setInterval(() => {
				setTimeRemaining(prev => {
					if (prev <= 1) {
						setShowCountdown(false);
						// Clear the delay when countdown finishes
						const currentState = mfaMethod === 'backup' ? backupAttemptState : mfaAttemptState;
						const setter = mfaMethod === 'backup' ? setBackupAttemptState : setMfaAttemptState;
						setter(prev => ({
							...prev,
							nextAttemptAllowedAt: null,
							currentDelay: 0
						}));
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [showCountdown, timeRemaining, mfaMethod, backupAttemptState, mfaAttemptState]);

	// Format time remaining for display
	const formatTimeRemaining = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		if (minutes > 0) {
			return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
		}
		return `${remainingSeconds}s`;
	};

	// Check if attempt is allowed
	const isAttemptAllowed = (attemptState: MfaAttemptState): boolean => {
		if (attemptState.isLocked) return false;
		if (attemptState.nextAttemptAllowedAt && new Date() < attemptState.nextAttemptAllowedAt) return false;
		return true;
	};

	// Handle failed MFA attempt
	const handleFailedAttempt = (method: MfaMethod) => {
		const isBackup = method === 'backup';
		const currentState = isBackup ? backupAttemptState : mfaAttemptState;
		const setter = isBackup ? setBackupAttemptState : setMfaAttemptState;
		const newAttempts = currentState.attempts + 1;

		// Calculate delay for this attempt
		const delay = calculateDelay(newAttempts);
		const nextAttemptTime = delay > 0 ? new Date(Date.now() + delay * 1000) : null;

		// Check if account should be locked (after 5 attempts for regular, 3 for backup)
		const shouldLock = newAttempts >= currentState.maxAttempts;
		const lockoutDuration = shouldLock ? (15 + Math.random() * 15) * 60 * 1000 : 0; // 15-30 min
		const lockoutUntil = shouldLock ? new Date(Date.now() + lockoutDuration) : null;

		// Generate appropriate message
		let message = '';
		if (shouldLock) {
			const lockoutMinutes = Math.ceil(lockoutDuration / 60000);
			message = `Account temporarily locked. Try again in ${lockoutMinutes} minutes`;
		} else {
			const remaining = currentState.maxAttempts - newAttempts;
			message = `Invalid ${isBackup ? 'backup ' : ''}code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining`;
		}

		// Update state
		setter({
			attempts: newAttempts,
			maxAttempts: currentState.maxAttempts,
			isLocked: shouldLock,
			lockoutUntil,
			nextAttemptAllowedAt: nextAttemptTime,
			currentDelay: delay,
			message
		});

		// Start countdown timer if there's a delay
		if (delay > 0) {
			setTimeRemaining(delay);
			setShowCountdown(true);
		}

		// Show toast with error message
		toast.error(message);

		// Log the event
		logAuditEvent(isBackup ? 'BACKUP_CODE_VERIFICATION' : 'MFA_VERIFICATION', method, false);

		// Log account lockout separately if applicable
		if (shouldLock) {
			logAuditEvent('ACCOUNT_LOCKED', method, false);
		}
	};

	// TODO: replace to utils
	// Format backup code input
	const formatBackupCode = (value: string) => {
		const cleaned = value.replace(/[^A-Z0-9]/g, '').toUpperCase();
		if (cleaned.length <= 4) return cleaned;
		return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}`;
	};

	// TODO: replace to utils
	// Validate backup code format
	const isValidBackupCodeFormat = (code: string) => {
		return /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code);
	};

	// TODO: replace to utils
	// Constant-time comparison for backup codes
	const constantTimeCompare = (a: string, b: string) => {
		if (a.length !== b.length) return false;
		let result = 0;
		for (let i = 0; i < a.length; i++) {
			result |= a.charCodeAt(i) ^ b.charCodeAt(i);
		}
		return result === 0;
	};

	// Audit logging function with user-visible events
	const logAuditEvent = (action: string, method: MfaMethod, success: boolean) => {
		const auditEvent: AuditLog = {
			timestamp: new Date(),
			action,
			method,
			success,
			ipAddress: '192.168.1.100', // Mock IP
			userAgent: navigator.userAgent
		};
		setAuditLogs(prev => [...prev, auditEvent]);

		// Show user-visible security events
		const userVisibleEvents = [
			'LOGIN_ATTEMPT',
			'MFA_VERIFICATION',
			'BACKUP_CODE_VERIFICATION',
			'DEVICE_TRUSTED',
			'PASSWORD_RESET_REQUEST',
			'ACCOUNT_LOCKED',
			'SUSPICIOUS_ACTIVITY'
		];

		if (userVisibleEvents.includes(action)) {
			// Display security event notification
			const eventMessage = getSecurityEventMessage(action, success);
			if (eventMessage) {
				toast.custom((t) => (
					<div className={clsx(
						'bg-white border rounded-lg shadow-lg p-3 max-w-sm',
						success ? 'border-green-200' : 'border-amber-200'
					)}>
						<div className="flex items-start">
							<ShieldCheck className={clsx(
								'w-4 h-4 mt-0.5 mr-2 flex-shrink-0',
								success ? 'text-green-600' : 'text-amber-600'
							)}/>
							<div className="text-sm">
								<p className="font-medium text-gray-900">Security Event Logged</p>
								<p className="text-gray-600 text-xs mt-1">{eventMessage}</p>
								<p className="text-gray-400 text-xs mt-1">
									{new Date().toLocaleTimeString()} • Logged for compliance
								</p>
							</div>
						</div>
					</div>
				), {duration: 4000});
			}
		}

		// In production, this would be sent to a secure audit service
		console.log('Audit Log:', auditEvent);
	};

	// Get user-friendly security event messages
	const getSecurityEventMessage = (action: string, success: boolean): string | null => {
		const messages = {
			'LOGIN_ATTEMPT': success ? 'Login credentials verified' : 'Failed login attempt recorded',
			'MFA_VERIFICATION': success ? 'Multi-factor authentication verified' : 'Invalid MFA code attempt',
			'BACKUP_CODE_VERIFICATION': success ? 'Backup code successfully used' : 'Invalid backup code attempt',
			'DEVICE_TRUSTED': 'Device added to trusted list for 30 days',
			'PASSWORD_RESET_REQUEST': 'Password reset request initiated',
			'ACCOUNT_LOCKED': 'Account temporarily locked due to failed attempts',
			'SUSPICIOUS_ACTIVITY': 'Unusual activity detected and logged'
		};
		return messages[action as keyof typeof messages] || null;
	};

	const handleLoginSubmit = async (data: LoginFormData) => {
		setIsLoading(true);

		try {
			// Mock API call with enhanced security headers
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-CSRF-Token': 'csrf-token-here', // CSRF protection
					'X-Client-Version': '1.0.0'
				},
				body: JSON.stringify({
					email: data.email,
					password: data.password,
					rememberMe: data.rememberMe,
					deviceFingerprint: btoa(navigator.userAgent), // Basic device fingerprinting
					timestamp: new Date().toISOString()
				})
			});

			await new Promise(resolve => setTimeout(resolve, 1500));

			// Enhanced mock API response
			const mockApiResponse = {
				success: true,
				requiresMFA: true,
				isFirstTime: Math.random() > 0.5,
				methods: ['app', 'sms', 'email'] as MfaMethod[], // Backup not available during setup
				qrCode: mockQRCode,
				secret: mockSecret,
				sessionToken: 'temp_session_token_123',
				userProfile: {
					lastLogin: new Date(Date.now() - 86400000).toISOString(),
					loginCount: 47,
					mfaEnabled: true
				}
			};

			logAuditEvent('LOGIN_ATTEMPT', 'app', true);

			if (mockApiResponse.success && mockApiResponse.requiresMFA) {
				// Add backup method only if not first-time setup
				const availableMethods = mockApiResponse.isFirstTime
					? mockApiResponse.methods
					: [...mockApiResponse.methods, 'backup'] as MfaMethod[];

				setMfaState({
					show: true,
					isFirstTime: mockApiResponse.isFirstTime,
					methods: availableMethods,
					qrCode: mockApiResponse.qrCode,
					secret: mockApiResponse.secret,
					sessionToken: mockApiResponse.sessionToken
				});

				// Reset attempt states when starting fresh MFA flow
				setMfaAttemptState({
					attempts: 0,
					maxAttempts: 5,
					isLocked: false,
					lockoutUntil: null,
					nextAttemptAllowedAt: null,
					currentDelay: 0,
					message: ''
				});

				setBackupAttemptState({
					attempts: 0,
					maxAttempts: 3,
					isLocked: false,
					lockoutUntil: null,
					nextAttemptAllowedAt: null,
					currentDelay: 0,
					message: ''
				});

				toast.success(
					mockApiResponse.isFirstTime
						? 'Credentials verified. Please setup multi-factor authentication.'
						: 'Credentials verified. Please complete multi-factor authentication.'
				);
			} else if (mockApiResponse.success) {
				toast.success('Login successful! Redirecting to dashboard...');
				router.push('/dashboard');
			}
		} catch (error) {
			logAuditEvent('LOGIN_ATTEMPT', 'app', false);
			toast.error('Login failed. Please check your credentials and try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleMFASubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Route to appropriate verification based on method
		if (mfaMethod === 'backup') {
			return handleBackupCodeVerification(e);
		}

		if (mfaCode.length !== 6) {
			toast.error('Please enter a valid 6-digit code');
			return;
		}

		// Check if attempt is allowed
		if (!isAttemptAllowed(mfaAttemptState)) {
			if (mfaAttemptState.isLocked) {
				toast.error('Account is temporarily locked. Please wait before trying again.');
			} else {
				toast.error('Please wait before your next attempt.');
			}
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/mfa/verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Session-Token': mfaState.sessionToken || ''
				},
				body: JSON.stringify({
					code: mfaCode,
					method: mfaMethod,
					sessionToken: mfaState.sessionToken,
					trustDevice: trustDevice,
					deviceInfo: deviceInfo
				})
			});

			await new Promise(resolve => setTimeout(resolve, 1000));

			if (mfaCode === '123456') {
				logAuditEvent('MFA_VERIFICATION', mfaMethod, true);

				// Log device trust event if enabled
				if (trustDevice) {
					logAuditEvent('DEVICE_TRUSTED', mfaMethod, true);
				}

				if (mfaState.isFirstTime) {
					setSetupComplete(true);
					toast.success('MFA setup completed successfully!');
				} else {
					toast.success('Login successful! Redirecting to dashboard...');
					router.push('/dashboard');
				}
			} else {
				handleFailedAttempt(mfaMethod);
				setMfaCode('');
			}
		} catch (error) {
			handleFailedAttempt(mfaMethod);
			setMfaCode('');
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackupCodeVerification = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!isValidBackupCodeFormat(backupCode)) {
			toast.error('Please enter a valid backup code in format XXXX-XXXX');
			return;
		}

		// Check if attempt is allowed
		if (!isAttemptAllowed(backupAttemptState)) {
			if (backupAttemptState.isLocked) {
				toast.error('Account is temporarily locked. Please wait before trying again.');
			} else {
				toast.error('Please wait before your next attempt.');
			}
			return;
		}

		setIsLoading(true);

		try {
			const response = await fetch('/api/auth/mfa/backup-verify', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Session-Token': mfaState.sessionToken || ''
				},
				body: JSON.stringify({
					backupCode: backupCode,
					sessionToken: mfaState.sessionToken,
					trustDevice: trustDevice
				})
			});

			await new Promise(resolve => setTimeout(resolve, 1000));

			// Mock verification using constant-time comparison
			const isValidCode = mockBackupCodes.some(code =>
				constantTimeCompare(code, backupCode)
			);

			if (isValidCode) {
				logAuditEvent('BACKUP_CODE_VERIFICATION', 'backup', true);

				// Log device trust event if enabled
				if (trustDevice) {
					logAuditEvent('DEVICE_TRUSTED', 'backup', true);
				}

				toast.success('Backup code verified! Redirecting to dashboard...');
				router.push('/dashboard');
			} else {
				handleFailedAttempt('backup');
				setBackupCode('');
			}
		} catch (error) {
			handleFailedAttempt('backup');
			setBackupCode('');
		} finally {
			setIsLoading(false);
		}
	};

	const handleBackupCodeDownload = () => {
		const content = `Healthcare App - Backup Codes\nGenerated: ${new Date().toLocaleDateString()}\nUser: ${watchedFields.email}\n\n${mockBackupCodes.join('\n')}\n\nSecurity Instructions:\n- Keep these codes secure and accessible\n- Each code can only be used once\n- Store in a secure password manager\n- Do not share these codes with anyone\n\nFor support: security@healthcare-app.com`;

		const blob = new Blob([content], {type: 'text/plain'});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
		a.click();
		URL.revokeObjectURL(url);

		logAuditEvent('BACKUP_CODES_DOWNLOADED', 'backup', true);
		toast.success('Backup codes downloaded securely');
	};

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success('Copied to clipboard!');
	};

	const handleForgotPassword = () => {
		logAuditEvent('PASSWORD_RESET_REQUEST', 'email', true);
		router.push('/password-reset');
		toast.success('Password reset instructions have been sent to your email.');
	};

	const handleMethodSwitch = (newMethod: MfaMethod) => {
		// Reset states when switching methods
		setMfaMethod(newMethod);
		setMfaCode('');
		setBackupCode('');
		// Note: We keep attempt counters when switching methods as they should persist
	};

	// Get current attempt state based on method
	const getCurrentAttemptState = () => {
		return mfaMethod === 'backup' ? backupAttemptState : mfaAttemptState;
	};

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
								<CircleCheck className="w-8 h-8 text-green-600"/>
							</div>
							<h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Complete!</h2>
							<p className="text-gray-600">Your account is now secured with multi-factor authentication</p>
						</div>

						{/* Enhanced Security Notice */}
						<div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
							<div className="flex items-start">
								<ShieldCheck className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0"/>
								<div className="text-sm text-green-800">
									<p className="font-medium mb-1">HIPAA Compliant Security Active</p>
									<p>Your healthcare data is now protected with:</p>
									<ul className="mt-1 text-xs space-y-1">
										<li>• AES-256 encryption at rest</li>
										<li>• TLS 1.3 encryption in transit</li>
										<li>• Multi-factor authentication</li>
										<li>• Audit trail logging</li>
									</ul>
								</div>
							</div>
						</div>

						<div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
							<div className="flex items-start">
								<TriangleAlert className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0"/>
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
											 className="bg-gray-50 border border-gray-200 rounded p-2 text-center font-mono text-sm select-all">
										{code}
									</div>
								))}
							</div>

							<button
								onClick={handleBackupCodeDownload}
								className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
							>
								<Copy className="w-4 h-4 mr-2"/>
								Download Backup Codes
							</button>
						</div>

						{/* Device Trust Information */}
						{trustDevice && (
							<div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
								<div className="flex items-start">
									<Monitor className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0"/>
									<div className="text-sm text-blue-800">
										<p className="font-medium">Trusted Device Registered</p>
										<p className="text-xs mt-1">
											{deviceInfo.browser} on {deviceInfo.os}<br/>
											Location: {deviceInfo.location}<br/>
											Valid for 30 days
										</p>
									</div>
								</div>
							</div>
						)}

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
		const currentAttemptState = getCurrentAttemptState();

		return (
			<div
				className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
				<Toaster position="top-center"/>
				<div className="w-full max-w-md">
					<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
						<div className="text-center mb-8">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<ShieldCheck className="w-8 h-8 text-blue-600"/>
							</div>
							<h2 className="text-2xl font-bold text-gray-900 mb-2">
								{mfaState.isFirstTime ? 'Setup Multi-Factor Authentication' : 'Multi-Factor Authentication'}
							</h2>
							<p className="text-gray-600">
								{mfaState.isFirstTime
									? 'Secure your account with an additional verification method'
									: 'Please verify your identity to continue'}
							</p>
						</div>

						{/* Enhanced Security Context */}
						<div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<div className="flex items-start">
								<ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0"/>
								<div className="text-xs text-blue-800">
									<p className="font-medium">HIPAA Compliant Security</p>
									<p>Additional verification protects patient data and ensures regulatory compliance.
										{trustDevice && ' This device will be remembered for 30 days.'}</p>
								</div>
							</div>
						</div>

						{/* Status Indicators */}
						{currentAttemptState.attempts > 0 && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<div className="flex items-center">
									<TriangleAlert className="w-4 h-4 text-red-600 mr-2"/>
									<div className="text-sm text-red-800 flex-1">
										<p className="font-medium">{currentAttemptState.message}</p>
										{currentAttemptState.attempts <= 2 && (
											<p className="text-xs mt-1">
												Account will be temporarily locked after {currentAttemptState.maxAttempts} failed attempts
											</p>
										)}
									</div>
								</div>
							</div>
						)}

						{/* Account Lockout Warning */}
						{currentAttemptState.isLocked && (
							<div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
								<div className="flex items-center">
									<Lock className="w-4 h-4 text-red-700 mr-2"/>
									<div className="text-sm text-red-800">
										<p className="font-medium">Account Temporarily Locked</p>
										<p className="text-xs mt-1">
											{currentAttemptState.lockoutUntil &&
												`Try again after ${currentAttemptState.lockoutUntil.toLocaleTimeString()}`
											}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Progressive Delay Warning */}
						{showCountdown && timeRemaining > 0 && (
							<div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
								<div className="flex items-center">
									<Clock className="w-4 h-4 text-amber-600 mr-2"/>
									<div className="text-sm text-amber-800 flex-1">
										<p className="font-medium">Please wait before your next attempt</p>
										<p className="text-xs mt-1">
											Next attempt allowed in: <span
											className="font-mono font-bold">{formatTimeRemaining(timeRemaining)}</span>
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Method Selection */}
						<div className="mb-6">
							<div className="flex justify-center flex-wrap gap-2 mb-4">
								{mfaState.methods.map((method) => (
									<button
										key={method}
										onClick={() => handleMethodSwitch(method)}
										disabled={currentAttemptState.isLocked}
										className={clsx(
											'px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
											mfaMethod === method
												? 'bg-blue-600 text-white'
												: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
										)}
									>
										{method === 'app' && (
											<>
												<Smartphone className="w-4 h-4 inline mr-1"/>
												Authenticator
											</>
										)}
										{method === 'sms' && 'SMS'}
										{method === 'email' && 'Email'}
										{method === 'backup' && (
											<>
												<Key className="w-4 h-4 inline mr-1"/>
												Backup Code
											</>
										)}
									</button>
								))}
							</div>

							{/* QR Code for App Setup */}
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
													aria-label="Copy secret key to clipboard"
												>
													<Copy className="w-4 h-4"/>
												</button>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Method-specific instructions */}
							<p className="text-sm text-gray-600 text-center mb-4">
								{mfaMethod === 'app' && (
									mfaState.isFirstTime
										? 'Enter the 6-digit code from your authenticator app after scanning'
										: 'Enter the 6-digit code from your authenticator app'
								)}
								{mfaMethod === 'sms' && 'Enter the 6-digit code sent to your phone'}
								{mfaMethod === 'email' && 'Enter the 6-digit code sent to your email'}
								{mfaMethod === 'backup' && 'Enter one of your saved backup codes'}
							</p>
						</div>

						{/* Code Input */}
						<div className="mb-6">
							{mfaMethod === 'backup' ? (
								<div>
									<input
										type="text"
										value={backupCode}
										onChange={(e) => {
											const formatted = formatBackupCode(e.target.value);
											setBackupCode(formatted);
										}}
										placeholder="XXXX-XXXX"
										className={clsx(
											"w-full px-4 py-3 border rounded-lg text-center text-xl font-mono tracking-widest focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
											isValidBackupCodeFormat(backupCode) && backupCode.length === 9
												? 'border-green-300 bg-green-50'
												: backupCode.length > 0 && !isValidBackupCodeFormat(backupCode)
													? 'border-red-300 bg-red-50'
													: 'border-gray-300 bg-white'
										)}
										maxLength={9}
										disabled={!isAttemptAllowed(backupAttemptState)}
										aria-label="Enter backup code"
										aria-describedby="backup-code-help"
									/>
									{backupCode.length > 0 && !isValidBackupCodeFormat(backupCode) && (
										<p className="mt-1 text-sm text-red-600 flex items-center">
											<TriangleAlert className="w-4 h-4 mr-1"/>
											Backup code must be in format XXXX-XXXX
										</p>
									)}
								</div>
							) : (
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
									disabled={!isAttemptAllowed(mfaAttemptState)}
									aria-label="Enter verification code"
								/>
							)}
						</div>

						{/* Backup Code Help */}
						{mfaMethod === 'backup' && (
							<div className="mb-6">
								<button
									type="button"
									onClick={() => setShowBackupHelp(!showBackupHelp)}
									className="w-full flex items-center justify-between text-sm text-blue-600 hover:text-blue-800 transition-colors"
									aria-expanded={showBackupHelp}
									id="backup-code-help"
								>
									<span>What are backup codes?</span>
									{showBackupHelp ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
								</button>

								{showBackupHelp && (
									<div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
										<div className="space-y-2">
											<p className="font-medium">Backup codes are emergency access codes that:</p>
											<ul className="space-y-1 text-xs ml-2">
												<li>• Can be used when you don&apos;t have access to your primary MFA method</li>
												<li>• Are single-use only (each code works once)</li>
												<li>• Should be stored securely in a password manager or safe location</li>
												<li>• Were provided to you during initial MFA setup</li>
											</ul>
											<div className="pt-2 border-t border-blue-200">
												<p className="font-medium text-xs">Need help? Contact your administrator.</p>
											</div>
										</div>
									</div>
								)}
							</div>
						)}

						{/* Advanced Options (Progressive Disclosure) */}
						<div className="mb-6">
							<button
								type="button"
								onClick={() => setShowAdvanced(!showAdvanced)}
								className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-800 transition-colors"
								aria-expanded={showAdvanced}
							>
								<span>Advanced Options</span>
								{showAdvanced ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
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

									{/* Additional security info */}
									{trustDevice && (
										<div className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-200">
											<div className="flex items-start">
												<Info className="w-3 h-3 text-blue-600 mt-0.5 mr-1 flex-shrink-0"/>
												<div>
													<p className="font-medium">Device Trust Information:</p>
													<p>{deviceInfo.browser} • {deviceInfo.os}</p>
													<p>Location: {deviceInfo.location}</p>
													<p className="mt-1 text-blue-700">You won&apos;t need MFA on this device for 30 days</p>
												</div>
											</div>
										</div>
									)}
								</div>
							)}
						</div>

						{/* MFA Submit Button */}
						<button
							onClick={handleMFASubmit}
							disabled={
								isLoading ||
								!isAttemptAllowed(currentAttemptState) ||
								(mfaMethod === 'backup' ?
										!isValidBackupCodeFormat(backupCode) :
										mfaCode.length !== 6
								)
							}
							className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{isLoading ? (
								<div className="flex items-center justify-center">
									<div
										className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
									Verifying...
								</div>
							) : !isAttemptAllowed(currentAttemptState) ? (
								currentAttemptState.isLocked ? 'Account Locked' : `Wait ${formatTimeRemaining(timeRemaining)}`
							) : (
								mfaState.isFirstTime ? 'Complete Setup' : 'Verify & Sign In'
							)}
						</button>

						{/* Back to login */}
						<div className="mt-4 text-center">
							<button
								onClick={() => setMfaState(prev => ({...prev, show: false}))}
								className="text-sm text-blue-600 hover:text-blue-700 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							>
								Back to login
							</button>
						</div>

						{/* Security Footer */}
						<div className="mt-6 pt-4 border-t border-gray-200">
							<div className="text-xs text-gray-500 text-center space-y-1">
								<p>🔒 All authentication attempts are logged for security</p>
								<p>Having trouble? Contact support: security@healthcare-app.com</p>
								{/* Display attempt information */}
								{currentAttemptState.attempts > 0 && (
									<p className="text-red-600 font-medium">
										{currentAttemptState.attempts}/{currentAttemptState.maxAttempts} failed attempts
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Main Login Form
	return (
		<div
			className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
			<Toaster position="top-center"/>

			<div className="w-full max-w-md">
				{/* Header */}
				<div className="text-center mb-8">
					<div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
						<Lock className="w-8 h-8 text-white"/>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
					<p className="text-gray-600">Sign in to your secure healthcare dashboard</p>

					{/* Trust indicators */}
					<div className="flex items-center justify-center mt-3 space-x-4 text-xs text-gray-500">
						<div className="flex items-center">
							<ShieldCheck className="w-3 h-3 mr-1"/>
							HIPAA Compliant
						</div>
						<div className="flex items-center">
							<Lock className="w-3 h-3 mr-1"/>
							AES-256 Encrypted
						</div>
					</div>
				</div>

				{/* Login Form */}
				<div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
					<form onSubmit={handleSubmit(handleLoginSubmit)} className="space-y-6">
						<div className="space-y-6">
							{/* TODO: replace to UI Input */}
							{/* Email Field */}
							<div>
								<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
									Email Address *
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<Mail className="h-5 w-5 text-gray-400" aria-hidden="true"/>
									</div>
									<input
										{...register('email')}
										type="email"
										id="email"
										autoComplete="email"
										aria-describedby={errors.email ? "email-error" : undefined}
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
											<CircleCheck className="h-5 w-5 text-green-500" aria-hidden="true"/>
										</div>
									)}
								</div>
								{errors.email && (
									<p id="email-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
										<TriangleAlert className="w-4 h-4 mr-1" aria-hidden="true"/>
										{errors.email.message}
									</p>
								)}
							</div>

							{/* TODO: replace to UI Input */}
							{/* Password Field */}
							<div>
								<label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
									Password *
								</label>
								<div className="relative">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<Lock className="h-5 w-5 text-gray-400" aria-hidden="true"/>
									</div>
									<input
										{...register('password')}
										type={showPassword ? 'text' : 'password'}
										id="password"
										autoComplete="current-password"
										aria-describedby={errors.password ? "password-error" : "password-requirements"}
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
										className="absolute inset-y-0 right-0 pr-3 flex items-center focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
										aria-label={showPassword ? "Hide password" : "Show password"}
									>
										{showPassword ? (
											<EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600"/>
										) : (
											<Eye className="h-5 w-5 text-gray-400 hover:text-gray-600"/>
										)}
									</button>
								</div>
								{errors.password && (
									<p id="password-error" className="mt-1 text-sm text-red-600 flex items-center" role="alert">
										<TriangleAlert className="w-4 h-4 mr-1" aria-hidden="true"/>
										{errors.password.message}
									</p>
								)}
								{!errors.password && watchedFields.password && watchedFields.password.length > 0 && (
									<div id="password-requirements" className="mt-1 text-xs text-gray-500">
										<div className="flex items-center space-x-2">
											<div className={clsx("w-2 h-2 rounded-full",
												watchedFields.password.length >= 8 ? "bg-green-500" : "bg-gray-300"
											)}></div>
											<span>8+ characters</span>
										</div>
									</div>
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
										Remember me for 30 days
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

							{/* Login Submit Button */}
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
									'Sign In Securely'
								)}
							</Button>
						</div>
					</form>

					{/* Security Notice */}
					<div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
						<div className="flex items-start">
							<ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"/>
							<div className="text-sm text-blue-800">
								<p className="font-medium mb-1">HIPAA Compliant & Secure</p>
								<div className="text-xs text-blue-600 space-y-1">
									<p>🔒 AES-256 encryption and TLS 1.3 security protocols</p>
									<p>📊 All access attempts are logged and monitored</p>
									<p>🛡️ Multi-factor authentication required</p>
									<p>⏰ Sessions auto-expire for enhanced security</p>
								</div>
							</div>
						</div>
					</div>

					{/* Compliance Footer */}
					<div className="mt-4 text-center">
						<div className="text-xs text-gray-500 space-y-1">
							<p>By signing in, you acknowledge compliance with HIPAA regulations</p>
							<p>and agree to our <a href="/privacy-policy" className="text-blue-600 hover:text-blue-700">Privacy
								Policy</a>
								{' '}and <a href="/terms-of-service" className="text-blue-600 hover:text-blue-700">Terms of Service</a>
							</p>
						</div>
					</div>
				</div>

				{/* TODO: what should be on action "Contact your administrator"? */}
				{/* Footer */}
				<div className="mt-6 text-center text-sm text-gray-600">
					<p>Need access? <a href="/contact"
														 className="text-blue-600 hover:text-blue-700 focus-visible:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium">
						Contact your administrator
					</a></p>
					<div className="mt-2 space-x-4 text-xs text-gray-500">
						<span>24/7 Support Available</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginPage;