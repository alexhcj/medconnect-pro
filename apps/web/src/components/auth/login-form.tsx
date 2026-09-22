'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {useLogin} from '@/lib/hooks/use-session';
import {DASHBOARD_PATH} from '@/lib/auth/paths';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {ApiError} from '@/lib/api/http';

const loginSchema = z.object({
	email: z.email('Enter a valid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const demoUser = fixtureDemoUsers[0];

export function LoginForm() {
	const router = useRouter();
	const login = useLogin();
	const [formError, setFormError] = useState<string | null>(null);

	const {
		register,
		handleSubmit,
		formState: {errors},
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: 'onChange',
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const onSubmit = async (data: LoginFormData) => {
		setFormError(null);
		try {
			await login.mutateAsync(data);
			router.push(DASHBOARD_PATH);
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				setFormError('Invalid email or password.');
				return;
			}
			setFormError('Unable to sign in. Try again.');
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
				<h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
				<p className="mt-2 text-sm text-gray-600">Sign in to the MedConnect Pro dashboard.</p>
				<p className="mt-3 rounded-md bg-amber-50 p-3 text-xs text-amber-900" role="note">
					This is a <strong>mock identity provider</strong> for the demo. It is not production
					identity infrastructure.
				</p>

				{demoUser && (
					<div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
						<p className="font-medium text-gray-900">Demo account</p>
						<p className="mt-1">
							Email: <span className="font-mono">{demoUser.email}</span>
						</p>
						<p>
							Password: <span className="font-mono">{demoUser.password}</span>
						</p>
					</div>
				)}

				<form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
					<div>
						<label htmlFor="email" className="block text-sm font-medium text-gray-700">
							Email
						</label>
						<input
							id="email"
							type="email"
							autoComplete="username"
							className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							{...register('email')}
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-red-600" role="alert">
								{errors.email.message}
							</p>
						)}
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium text-gray-700">
							Password
						</label>
						<input
							id="password"
							type="password"
							autoComplete="current-password"
							className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							{...register('password')}
						/>
						{errors.password && (
							<p className="mt-1 text-sm text-red-600" role="alert">
								{errors.password.message}
							</p>
						)}
					</div>

					{formError && (
						<p className="text-sm text-red-600" role="alert">
							{formError}
						</p>
					)}

					<Button type="submit" className="w-full" disabled={login.isPending} isLoading={login.isPending}>
						Sign in
					</Button>
				</form>

				<p className="mt-6 text-center text-sm text-gray-500">
					<Link href="/password-reset" className="text-blue-600 hover:underline">
						Password reset
					</Link>
					{' · '}
					<Link href="/register" className="text-blue-600 hover:underline">
						Practice registration
					</Link>
				</p>
			</div>
		</div>
	);
}
