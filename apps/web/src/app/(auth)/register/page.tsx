'use client'

import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {toast} from 'react-hot-toast';
import {ArrowRight, Building2, CheckCircle, Eye, EyeOff, FileText, Lock, Mail, Shield, User} from 'lucide-react';
import {clsx} from "clsx";
import Link from 'next/link';

// Validation schema
const registrationSchema = z.object({
	// Practice Information
	practiceName: z.string().min(2, 'Practice name must be at least 2 characters'),
	practiceType: z.string().min(1, 'Please select practice type'),
	npiNumber: z.string().regex(/^\d{10}$/, 'NPI must be exactly 10 digits'),
	practiceAddress: z.string().min(5, 'Please enter complete address'),
	practiceCity: z.string().min(2, 'City is required'),
	practiceState: z.string().min(2, 'State is required'),
	practiceZip: z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
	practicePhone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Invalid phone number'),

	// Admin User Information
	firstName: z.string().min(2, 'First name must be at least 2 characters'),
	lastName: z.string().min(2, 'Last name must be at least 2 characters'),
	email: z.email('Invalid email address'),
	password: z.string()
		.min(12, 'Password must be at least 12 characters')
		.regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
			'Password must contain uppercase, lowercase, number, and special character'),
	confirmPassword: z.string().min(1, 'Please confirm your password'),
	jobTitle: z.string().min(2, 'Job title is required'),
	licenseNumber: z.string().optional(),

	// Compliance & Terms
	hipaaAcknowledgment: z.boolean().refine(val => val === true, 'HIPAA acknowledgment is required'),
	termsOfService: z.boolean().refine(val => val === true, 'Terms of service acceptance is required'),
	privacyPolicy: z.boolean().refine(val => val === true, 'Privacy policy acceptance is required'),
	marketingConsent: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"],
});

const practiceTypes = [
	'General Practice',
	'Internal Medicine',
	'Pediatrics',
	'Cardiology',
	'Dermatology',
	'Orthopedics',
	'Psychiatry',
	'Radiology',
	'Emergency Medicine',
	'Other'
];

const states = [
	'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
	'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
	'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
	'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
	'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

type RegisterFormDataType = z.infer<typeof registrationSchema>;

const RegisterPage = () => {
	// TODO: mb save to localstorage or server? would it corresponds med HIPAA requirements?
	const [currentStep, setCurrentStep] = useState(1);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const {
		register,
		handleSubmit,
		formState: {errors},
		trigger,
		watch
	} = useForm({
		resolver: zodResolver(registrationSchema),
		mode: 'onChange'
	});

	const watchedFields = watch();

	const steps = [
		{id: 1, title: 'Practice Information', icon: Building2},
		{id: 2, title: 'Admin User Setup', icon: User},
		{id: 3, title: 'Compliance & Terms', icon: Shield}
	];

	const nextStep = async () => {
		let fieldsToValidate: (keyof RegisterFormDataType)[] = [];

		if (currentStep === 1) {
			fieldsToValidate = [
				'practiceName', 'practiceType', 'npiNumber', 'practiceAddress',
				'practiceCity', 'practiceState', 'practiceZip', 'practicePhone'
			];
		} else if (currentStep === 2) {
			fieldsToValidate = [
				'firstName', 'lastName', 'email', 'password', 'confirmPassword', 'jobTitle'
			];
		}

		// First trigger validation for all fields in the current step
		const isValid = await trigger(fieldsToValidate);

		// If we're on step 2, explicitly check for password match
		if (currentStep === 2 && isValid) {
			const formValues = watch();
			if (formValues.password !== formValues.confirmPassword) {
				// Force the password match validation to run by triggering confirmPassword field
				await trigger('confirmPassword', {shouldFocus: true});
				return; // Prevent moving to next step
			}
		}

		if (isValid) {
			setCurrentStep(prev => Math.min(prev + 1, 3));
		}
	};

	const prevStep = () => {
		setCurrentStep(prev => Math.max(prev - 1, 1));
	};

	const onSubmit = async (data: RegisterFormDataType) => {
		setIsSubmitting(true);
		console.log(data)
		try {
			// Simulate API call
			// TODO: add API call
			await new Promise(resolve => setTimeout(resolve, 2000));

			// In a real app, you would make an API request to register the user
			// and send a verification email

			// Redirect to verification page with email parameter
			window.location.href = `/email-verification?email=${encodeURIComponent(data.email)}`;

			toast.success('Registration successful! Please check your email for verification.', {
				duration: 5000,
				position: 'top-right'
			});

			console.log('Registration data:', data);

		} catch (error) {
			toast.error('Registration failed. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderStepIndicator = () => (
		<div className="flex items-center justify-center mb-8">
			{steps.map((step, index) => (
				<React.Fragment key={step.id}>
					<div className={`flex items-center ${
						currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
					}`}>
						<div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
							currentStep >= step.id
								? 'border-blue-600 bg-blue-50'
								: 'border-gray-300 bg-white'
						}`}>
							{currentStep > step.id ? (
								<CheckCircle className="w-6 h-6 text-blue-600"/>
							) : (
								<step.icon className="w-5 h-5"/>
							)}
						</div>
						<span className="ml-2 text-sm font-medium hidden sm:block">
              {step.title}
            </span>
					</div>
					{index < steps.length - 1 && (
						<div className={`flex-1 h-0.5 mx-4 ${
							currentStep > step.id ? 'bg-blue-600' : 'bg-gray-300'
						}`}/>
					)}
				</React.Fragment>
			))}
		</div>
	);

	const renderPracticeInformation = () => (
		<div className="space-y-6">
			<div className="text-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Practice Information</h2>
				<p className="text-gray-600 mt-2">Tell us about your healthcare practice</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="md:col-span-2">
					<label htmlFor="practiceName" className="block text-sm font-medium text-gray-700 mb-2">
						Practice Name *
					</label>
					<input
						id="practiceName"
						{...register('practiceName')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.practiceName
							? 'border-red-300 bg-red-50'
							: watchedFields.practiceName && !errors.practiceName
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="Enter practice name"
						aria-required="true"
						aria-invalid={errors.practiceName ? 'true' : 'false'}
						aria-describedby={errors.practiceName ? 'practiceName-error' : undefined}
					/>
					{errors.practiceName && (
						<p id="practiceName-error" className="text-red-500 text-sm mt-1"
							 role="alert">{errors.practiceName.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Practice Type *
					</label>
					<select
						{...register('practiceType')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.practiceType
							? 'border-red-300 bg-red-50'
							: watchedFields.practiceType && !errors.practiceType
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
					>
						<option value="">Select practice type</option>
						{practiceTypes.map(type => (
							<option key={type} value={type}>{type}</option>
						))}
					</select>
					{errors.practiceType && (
						<p className="text-red-500 text-sm mt-1">{errors.practiceType.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						NPI Number *
					</label>
					<input
						{...register('npiNumber')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.npiNumber
							? 'border-red-300 bg-red-50'
							: watchedFields.npiNumber && !errors.npiNumber
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="10-digit NPI number"
						maxLength={10}
					/>
					{errors.npiNumber && (
						<p className="text-red-500 text-sm mt-1">{errors.npiNumber.message}</p>
					)}
				</div>

				<div className="md:col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Practice Address *
					</label>
					<input
						{...register('practiceAddress')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.practiceAddress
							? 'border-red-300 bg-red-50'
							: watchedFields.practiceAddress && !errors.practiceAddress
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="Street address"
					/>
					{errors.practiceAddress && (
						<p className="text-red-500 text-sm mt-1">{errors.practiceAddress.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						City *
					</label>
					<input
						{...register('practiceCity')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.practiceCity
							? 'border-red-300 bg-red-50'
							: watchedFields.practiceCity && !errors.practiceCity
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="City"
					/>
					{errors.practiceCity && (
						<p className="text-red-500 text-sm mt-1">{errors.practiceCity.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						State *
					</label>
					<select
						{...register('practiceState')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.practiceState
							? 'border-red-300 bg-red-50'
							: watchedFields.practiceState && !errors.practiceState
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
					>
						<option value="">Select state</option>
						{states.map(state => (
							<option key={state} value={state}>{state}</option>
						))}
					</select>
					{errors.practiceState && (
						<p className="text-red-500 text-sm mt-1">{errors.practiceState.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						ZIP Code *
					</label>
					<input
						{...register('practiceZip')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.practiceZip
							? 'border-red-300 bg-red-50'
							: watchedFields.practiceZip && !errors.practiceZip
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="ZIP code"
					/>
					{errors.practiceZip && (
						<p className="text-red-500 text-sm mt-1">{errors.practiceZip.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Phone Number *
					</label>
					<input
						{...register('practicePhone')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.practicePhone
							? 'border-red-300 bg-red-50'
							: watchedFields.practicePhone && !errors.practicePhone
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="(555) 123-4567"
					/>
					{errors.practicePhone && (
						<p className="text-red-500 text-sm mt-1">{errors.practicePhone.message}</p>
					)}
				</div>
			</div>
		</div>
	);

	const renderAdminUserSetup = () => (
		<div className="space-y-6">
			<div className="text-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Admin User Setup</h2>
				<p className="text-gray-600 mt-2">Create your administrator account</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						First Name *
					</label>
					<input
						{...register('firstName')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.firstName
							? 'border-red-300 bg-red-50'
							: watchedFields.firstName && !errors.firstName
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="First name"
					/>
					{errors.firstName && (
						<p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Last Name *
					</label>
					<input
						{...register('lastName')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.lastName
							? 'border-red-300 bg-red-50'
							: watchedFields.lastName && !errors.lastName
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="Last name"
					/>
					{errors.lastName && (
						<p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
					)}
				</div>

				<div className="md:col-span-2">
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Email Address *
					</label>
					<input
						{...register('email')}
						type="email"
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.email
							? 'border-red-300 bg-red-50'
							: watchedFields.email && !errors.email
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="admin@practice.com"
					/>
					{errors.email && (
						<p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Password *
					</label>
					<div className="relative">
						<input
							{...register('password')}
							type={showPassword ? 'text' : 'password'}
							className={clsx("w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.password
								? 'border-red-300 bg-red-50'
								: watchedFields.password && !errors.password
									? 'border-green-300 bg-green-50'
									: 'border-gray-300 bg-white')}
							placeholder="Min. 12 characters"
						/>
						<button
							type="button"
							onClick={() => setShowPassword(!showPassword)}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							{showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
						</button>
					</div>
					{errors.password && (
						<p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
					)}
					<div className="mt-2 text-xs text-gray-500">
						Must contain uppercase, lowercase, number, and special character
					</div>
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Confirm Password *
					</label>
					<div className="relative">
						<input
							{...register('confirmPassword')}
							type={showConfirmPassword ? 'text' : 'password'}
							className={clsx("w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent",
								errors.confirmPassword || (watchedFields.password && watchedFields.confirmPassword && watchedFields.password !== watchedFields.confirmPassword)
									? 'border-red-300 bg-red-50'
									: watchedFields.confirmPassword && watchedFields.password === watchedFields.confirmPassword && !errors.confirmPassword
										? 'border-green-300 bg-green-50'
										: 'border-gray-300 bg-white')}
							placeholder="Confirm password"
						/>
						<button
							type="button"
							onClick={() => setShowConfirmPassword(!showConfirmPassword)}
							className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
						>
							{showConfirmPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
						</button>
					</div>
					{(errors.confirmPassword || (watchedFields.password && watchedFields.confirmPassword && watchedFields.password !== watchedFields.confirmPassword)) && (
						<p className="text-red-500 text-sm mt-1">{errors.confirmPassword?.message || "Passwords don't match"}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Job Title *
					</label>
					<input
						{...register('jobTitle')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.jobTitle
							? 'border-red-300 bg-red-50'
							: watchedFields.jobTitle && !errors.jobTitle
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="e.g., Practice Manager, Physician"
					/>
					{errors.jobTitle && (
						<p className="text-red-500 text-sm mt-1">{errors.jobTitle.message}</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						License Number (Optional)
					</label>
					<input
						{...register('licenseNumber')}
						className={clsx("w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent", errors.licenseNumber
							? 'border-red-300 bg-red-50'
							: watchedFields.licenseNumber && !errors.licenseNumber
								? 'border-green-300 bg-green-50'
								: 'border-gray-300 bg-white')}
						placeholder="Professional license number"
					/>
				</div>
			</div>
		</div>
	);

	const renderComplianceTerms = () => (
		<div className="space-y-6">
			<div className="text-center mb-6">
				<h2 className="text-2xl font-bold text-gray-900">Compliance & Terms</h2>
				<p className="text-gray-600 mt-2">Review and accept our compliance requirements</p>
			</div>

			<div className="space-y-6">

				{/* HIPAA Acknowledgment */}
				<div className={`bg-blue-50 border rounded-lg p-6 ${
					errors.hipaaAcknowledgment ? 'border-red-300 bg-red-50' : 'border-blue-200'
				}`}>
					<div className="flex items-start space-x-3">
						<Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0"/>
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-blue-900 mb-2">
								HIPAA Compliance Acknowledgment
							</h3>
							<div className="text-sm text-blue-800 mb-4 space-y-2">
								<p>By registering for this healthcare SaaS platform, you acknowledge that:</p>
								<ul className="list-disc ml-5 space-y-1">
									<li>You understand HIPAA privacy and security requirements</li>
									<li>You will implement appropriate safeguards for PHI (Protected Health Information)</li>
									<li>You will ensure proper user access controls and audit logging</li>
									<li>You will report any potential security incidents immediately</li>
									<li>You understand our platform implements HIPAA-compliant infrastructure</li>
								</ul>
							</div>
							<div className={`flex items-center space-x-2 p-2 rounded ${
								errors.hipaaAcknowledgment ? 'bg-red-100 border border-red-300' : ''
							}`}>
								<input
									{...register('hipaaAcknowledgment')}
									type="checkbox"
									className={clsx(
										"w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500",
										errors.hipaaAcknowledgment
											? 'border-red-500 focus:ring-red-500'
											: 'border-gray-300 focus:ring-blue-500'
									)}
								/>
								<span className="text-sm font-medium text-blue-900">
					I acknowledge and accept HIPAA compliance requirements *
				</span>
							</div>
							{errors.hipaaAcknowledgment && (
								<p className="text-red-500 text-sm mt-2 flex items-center">
									<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
													clipRule="evenodd"/>
									</svg>
									{errors.hipaaAcknowledgment.message}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Terms of Service */}
				<div className={`border rounded-lg p-6 ${
					errors.termsOfService ? 'border-red-300 bg-red-50' : 'border-gray-200'
				}`}>
					<div className="flex items-start space-x-3">
						<FileText className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0"/>
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Terms of Service
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								Please review our terms of service which outline your rights and responsibilities
								when using our healthcare platform, including data processing, service availability,
								and compliance obligations.
							</p>
							<div className={`flex items-center space-x-2 p-2 rounded ${
								errors.termsOfService ? 'bg-red-100 border border-red-300' : ''
							}`}>
								<input
									{...register('termsOfService')}
									type="checkbox"
									className={clsx(
										"w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500",
										errors.termsOfService
											? 'border-red-500 focus:ring-red-500'
											: 'border-gray-300 focus:ring-blue-500'
									)}
								/>
								<span className="text-sm font-medium text-gray-900">
					I have read and agree to the{' '}
									<Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link> *
				</span>
							</div>
							{errors.termsOfService && (
								<p className="text-red-500 text-sm mt-2 flex items-center">
									<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
													clipRule="evenodd"/>
									</svg>
									{errors.termsOfService.message}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Privacy Policy */}
				<div className={`border rounded-lg p-6 ${
					errors.privacyPolicy ? 'border-red-300 bg-red-50' : 'border-gray-200'
				}`}>
					<div className="flex items-start space-x-3">
						<Lock className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0"/>
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Privacy Policy
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								Our privacy policy explains how we collect, use, and protect your personal
								information and patient data in compliance with HIPAA and other privacy regulations.
							</p>
							<div className={`flex items-center space-x-2 p-2 rounded ${
								errors.privacyPolicy ? 'bg-red-100 border border-red-300' : ''
							}`}>
								<input
									{...register('privacyPolicy')}
									type="checkbox"
									className={clsx(
										"w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500",
										errors.privacyPolicy
											? 'border-red-500 focus:ring-red-500'
											: 'border-gray-300 focus:ring-blue-500'
									)}
								/>
								<span className="text-sm font-medium text-gray-900">
					I have read and agree to the{' '}
									<Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> *
				</span>
							</div>
							{errors.privacyPolicy && (
								<p className="text-red-500 text-sm mt-2 flex items-center">
									<svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
													clipRule="evenodd"/>
									</svg>
									{errors.privacyPolicy.message}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Marketing Consent */}
				<div className="border border-gray-200 rounded-lg p-6">
					<div className="flex items-start space-x-3">
						<Mail className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0"/>
						<div className="flex-1">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Marketing Communications (Optional)
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								Stay updated with product news, feature updates, and healthcare industry insights.
								You can unsubscribe at any time.
							</p>
							<label className="flex items-center space-x-2">
								<input
									{...register('marketingConsent')}
									type="checkbox"
									className={clsx("w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500",
										errors.privacyPolicy
											? 'border-red-500 focus:ring-red-500'
											: 'border-gray-300 focus:ring-blue-500'
									)}
								/>
								<span className="text-sm font-medium text-gray-900">
                  I consent to receive marketing communications
                </span>
							</label>
						</div>
					</div>
				</div>

				{/* Security Notice */}
				<div className="bg-green-50 border border-green-200 rounded-lg p-4">
					<div className="flex items-center space-x-2">
						<CheckCircle className="w-5 h-5 text-green-600"/>
						<div className="text-sm text-green-800">
							<strong>Security Notice:</strong> Your data is protected with AES-256 encryption,
							TLS 1.3 transport security, and HIPAA-compliant infrastructure hosted on secure AWS services.
						</div>
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto">
				<div className="text-center mb-8">
					<div className="flex items-center justify-center mb-4">
						<Shield className="w-12 h-12 text-blue-600"/>
					</div>
					<h1 className="text-3xl font-bold text-gray-900">Healthcare SaaS Registration</h1>
					<p className="text-gray-600 mt-2">
						Join our HIPAA-compliant healthcare platform
					</p>
				</div>

				{/* Stepper */}
				<div className="bg-white rounded-xl shadow-lg p-8">
					{/* Stepper flow */}
					{renderStepIndicator()}

					{/* Stepper forms */}
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
						{currentStep === 1 && renderPracticeInformation()}
						{currentStep === 2 && renderAdminUserSetup()}
						{currentStep === 3 && renderComplianceTerms()}
						{currentStep > 1 ? (
							<button
								type="button"
								onClick={prevStep}
								className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
							>
								Previous
							</button>
						) : (
							<div/>
						)}

						{currentStep < 3 ? (
							<button
								type="button"
								onClick={nextStep}
								className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center space-x-2 cursor-pointer"
							>
								<span>Next</span>
								<ArrowRight className="w-4 h-4"/>
							</button>
						) : (
							<button
								type="submit"
								disabled={isSubmitting}
								className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 cursor-pointer"
							>
								{isSubmitting ? (
									<>
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>
										<span>Creating Account...</span>
									</>
								) : (
									<>
										<span>Complete Registration</span>
										<CheckCircle className="w-4 h-4"/>
									</>
								)}
							</button>
						)}
					</form>
				</div>
			</div>

			{/* Footer */}
			<div className="text-center mt-8 text-sm text-gray-500">
				Already have an account?{' '}
				<a
					href="/login"
					className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
					aria-label="Sign in to your account"
				>
					Sign in here
				</a>
			</div>
		</div>
	);
}

export default RegisterPage;