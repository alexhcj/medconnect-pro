'use client';

import {useState} from 'react';
import {useRouter} from 'next/navigation';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {MfaChallengeForm} from '@/components/auth/mfa-challenge-form';
import {useLogin} from '@/lib/hooks/use-session';
import {DASHBOARD_PATH} from '@/lib/auth/paths';
import {fixtureDemoUsers} from '@/lib/api/mocks/fixtures';
import {ApiError} from '@/lib/api/http';

const loginSchema = z.object({
	email: z.email('Enter a valid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type MfaChallengeState = {
	email: string;
	mfaToken: string;
	expiresIn: number;
};

const demoUser = fixtureDemoUsers[0];

export function LoginForm() {
	const router = useRouter();
	const login = useLogin();
	const [formError, setFormError] = useState<string | null>(null);
	const [challenge, setChallenge] = useState<MfaChallengeState | null>(null);

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
			const result = await login.mutateAsync(data);
			if (result.kind === 'mfa') {
				setChallenge({
					email: data.email,
					mfaToken: result.mfaToken,
					expiresIn: result.expiresIn,
				});
				return;
			}
			router.push(DASHBOARD_PATH);
		} catch (error) {
			if (error instanceof ApiError && error.status === 401) {
				setFormError('Invalid email or password.');
				return;
			}
			setFormError('Unable to sign in. Try again.');
		}
	};

	if (challenge) {
		return (
			<MfaChallengeForm
				email={challenge.email}
				mfaToken={challenge.mfaToken}
				expiresIn={challenge.expiresIn}
				onBack={() => setChallenge(null)}
				onVerified={() => router.push(DASHBOARD_PATH)}
			/>
		);
	}

	return (
		<div className="flex min-h-screen items-center justify-center bg-canvas p-4">
			<div className="w-full max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
				<h1 className="text-2xl font-bold text-foreground">Sign in</h1>
				<p className="mt-2 text-sm text-foreground-secondary">
					Sign in to the MedConnect Pro dashboard.
				</p>
				<p className="mt-3 rounded-md bg-warning-subtle p-3 text-xs text-warning" role="note">
					This is a <strong>mock identity provider</strong> for the demo. It is not production
					identity infrastructure.
				</p>

				{demoUser && (
					<div className="mt-4 rounded-md border border-border bg-subtle p-3 text-xs text-foreground-secondary">
						<p className="font-medium text-foreground">Demo account</p>
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
						<label htmlFor="email" className="block text-sm font-medium text-foreground-label">
							Email
						</label>
						<input
							id="email"
							type="email"
							autoComplete="username"
							className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							{...register('email')}
						/>
						{errors.email && (
							<p className="mt-1 text-sm text-danger" role="alert">
								{errors.email.message}
							</p>
						)}
					</div>

					<div>
						<label htmlFor="password" className="block text-sm font-medium text-foreground-label">
							Password
						</label>
						<input
							id="password"
							type="password"
							autoComplete="current-password"
							className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							{...register('password')}
						/>
						{errors.password && (
							<p className="mt-1 text-sm text-danger" role="alert">
								{errors.password.message}
							</p>
						)}
					</div>

					{formError && (
						<p className="text-sm text-danger" role="alert">
							{formError}
						</p>
					)}

					<Button type="submit" className="w-full" disabled={login.isPending} isLoading={login.isPending}>
						Sign in
					</Button>
				</form>

				<p className="mt-6 text-center text-sm text-foreground-muted">
					<Link href="/password-reset" className="text-brand hover:underline">
						Password reset
					</Link>
					{' · '}
					<Link href="/register" className="text-brand hover:underline">
						Practice registration
					</Link>
				</p>
			</div>
		</div>
	);
}
