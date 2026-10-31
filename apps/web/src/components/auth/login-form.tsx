'use client';

import {useEffect, useRef, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {CircleAlert, Clock, Info, LoaderCircle} from 'lucide-react';
import {useForm, useWatch} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import Link from 'next/link';
import {Button} from '@/components/ui/button';
import {DemoAccountPanel} from '@/components/auth/demo-account-panel';
import {MfaChallengeForm} from '@/components/auth/mfa-challenge-form';
import {useLogin} from '@/lib/hooks/use-session';
import {demoPanelAccounts, showDemoAccounts, type DemoPanelAccount} from '@/lib/auth/demo-accounts';
import {DASHBOARD_PATH} from '@/lib/auth/paths';
import {ApiError, RateLimitedError, rateLimitMessage, ServiceWakingError} from '@/lib/api/http';
import {isMockMode} from '@/lib/api/mocks/runtime';
import {OAuthProviderButton} from '@/components/auth/oauth-provider-button';
import {ApiStatusIndicator} from '@/components/auth/api-status-indicator';
import {ApiStatusProvider, useApiStatusContext} from '@/components/auth/api-status-provider';
import {formControlClassName} from '@/components/forms/form-field-styles';
import {
	configuredOAuthProvider,
	LOGIN_REASON_MESSAGES,
	oauthEnabled,
	parseLoginReason,
	type LoginReason,
} from '@/lib/auth/oauth';

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

function ReasonBanner({reason}: {reason: LoginReason}) {
	const message = LOGIN_REASON_MESSAGES[reason];
	if (reason === 'oauth_failed' || reason === 'rate_limited') {
		return (
			<div className="mt-4 flex items-start gap-2 rounded-md bg-danger-subtle p-3 text-sm font-medium text-danger" role="alert">
				<CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
				<p>{message}</p>
			</div>
		);
	}
	const tone = reason === 'unauthorized' ? 'bg-warning-subtle text-warning' : 'bg-brand-subtle text-brand-strong';
	return (
		<div className={`mt-4 flex items-start gap-2 rounded-md p-3 text-sm font-medium ${tone}`} role="status">
			<Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
			<p>{message}</p>
		</div>
	);
}

/** Automatic resubmits of one queued sign-in before it gives up with the generic error. */
const MAX_QUEUED_ATTEMPTS = 3;
const WAKE_HINT_ID = 'api-wake-hint';
/** A queued sign-in older than this is dropped instead of resent. */
const QUEUE_TTL_MS = 300_000;

export function LoginForm() {
	return (
		<ApiStatusProvider>
			<LoginFormContent />
			<ApiStatusIndicator />
		</ApiStatusProvider>
	);
}

function LoginFormContent() {
	const router = useRouter();
	const status = useApiStatusContext();
	const [queued, setQueued] = useState(false);
	const queuedData = useRef<LoginFormData | null>(null);
	const queuedAttempts = useRef(0);
	const queuedAt = useRef(0);
	const inFlight = useRef(false);
	const begun = useRef(false);
	const reason = parseLoginReason(useSearchParams().get('reason'));
	const login = useLogin();
	const [formError, setFormError] = useState<string | null>(null);
	const [challenge, setChallenge] = useState<MfaChallengeState | null>(null);

	const signInRef = useRef<HTMLButtonElement | null>(null);

	const {
		register,
		handleSubmit,
		setValue,
		control,
		formState: {errors},
	} = useForm<LoginFormData>({
		resolver: zodResolver(loginSchema),
		mode: 'onChange',
		defaultValues: {
			email: '',
			password: '',
		},
	});

	const [watchedEmail, watchedPassword] = useWatch({control, name: ['email', 'password']});
	// A role reads as selected only while both fields still hold that account's credentials.
	const selectedEmail = showDemoAccounts()
		? (demoPanelAccounts().find(
				(account) => account.email === watchedEmail && account.password === watchedPassword,
			)?.email ?? null)
		: null;

	const fillDemoAccount = (account: DemoPanelAccount) => {
		setValue('email', account.email, {shouldValidate: true, shouldDirty: true});
		setValue('password', account.password, {shouldValidate: true, shouldDirty: true});
		setFormError(null);
		signInRef.current?.focus();
	};

	const clearQueue = () => {
		queuedData.current = null;
		queuedAttempts.current = 0;
		setQueued(false);
	};

	const queueSubmit = (data: LoginFormData) => {
		queuedData.current = data;
		queuedAt.current = Date.now();
		setQueued(true);
		status?.markQueued();
	};

	const attempt = async (data: LoginFormData) => {
		if (inFlight.current) {
			return;
		}
		inFlight.current = true;
		setFormError(null);
		try {
			const result = await login.mutateAsync(data);
			clearQueue();
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
			if (error instanceof ServiceWakingError && status?.enabled) {
				status.reportSubmitWake();
				// A timeout may have reached the server, and a sign-in is not idempotent: never
				// resend it by itself. Only a failure that never reached the app is queued.
				if (error.reason !== 'timeout') {
					queuedAttempts.current += 1;
					if (queuedAttempts.current <= MAX_QUEUED_ATTEMPTS) {
						// The API is asleep. Keep the credentials in memory and finish when it answers.
						queueSubmit(data);
						return;
					}
				}
			}
			clearQueue();
			if (error instanceof RateLimitedError) {
				setFormError(rateLimitMessage(error));
				return;
			}
			if (error instanceof ApiError && error.status === 401) {
				setFormError('Invalid email or password.');
				return;
			}
			setFormError('Unable to sign in. Try again.');
		} finally {
			inFlight.current = false;
		}
	};

	const phase = status?.enabled ? status.state.phase : 'idle';

	const onSubmit = async (data: LoginFormData) => {
		if (queuedData.current) {
			// Already waiting: keep the latest credentials, never send a second request.
			queueSubmit(data);
			return;
		}
		// Unreachable still sends once: the probe may be failing for a reason the sign-in is not.
		if (phase === 'waking') {
			queueSubmit(data);
			return;
		}
		await attempt(data);
	};

	useEffect(() => {
		if (queued && phase === 'ready' && queuedData.current && !inFlight.current) {
			if (Date.now() - queuedAt.current > QUEUE_TTL_MS) {
				clearQueue();
				setFormError('Unable to sign in. Try again.');
				return;
			}
			void attempt(queuedData.current);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- attempt closes over fresh refs only
	}, [queued, phase]);

	const hintVisible = queued || phase === 'waking' || phase === 'unreachable';

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
		<div className="w-full max-w-md rounded-xl border border-border bg-surface px-4 py-6 shadow-sm sm:p-8">
			<h1 className="text-2xl font-bold text-foreground">Sign in</h1>
			<p className="mt-2 text-sm text-foreground-secondary">
				Sign in to the MedConnect Pro dashboard.
			</p>
			{reason && <ReasonBanner reason={reason} />}
			<p className="mt-4 rounded-md bg-warning-subtle p-3 text-xs text-warning" role="note">
				<strong>Demo identity.</strong> Google/Fake OIDC sign-in is a demo integration, not a
				production IdP. Email sign-in uses a mock identity provider.
			</p>

			{oauthEnabled() ? (
				<>
					<div className="mt-4">
						<OAuthProviderButton provider={configuredOAuthProvider()} available={!isMockMode()} />
					</div>

					<div className="mt-4 flex items-center gap-3" aria-hidden="true">
						<span className="h-px flex-1 bg-border" />
						<span className="text-xs text-foreground-muted">or sign in with email</span>
						<span className="h-px flex-1 bg-border" />
					</div>
				</>
			) : (
				<p className="mt-4 text-sm text-foreground-secondary" role="note">
					Provider sign-in is not configured for this demo. Use a demo account.
				</p>
			)}

			{showDemoAccounts() && (
				<DemoAccountPanel
					onSelect={fillDemoAccount}
					disabled={login.isPending || queued}
					selectedEmail={selectedEmail}
				/>
			)}

			<form
					className="mt-6 space-y-4"
					onSubmit={(event) => void handleSubmit(onSubmit)(event)}
					onFocus={() => {
						if (!begun.current) {
							begun.current = true;
							status?.begin();
						}
					}}
					noValidate
				>
				<div>
					<label htmlFor="email" className="block text-sm font-medium text-foreground-label">
						Email
					</label>
					<input
						id="email"
						type="email"
						autoComplete="username"
						className={formControlClassName}
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
						className={formControlClassName}
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

				<Button
					ref={signInRef}
					type="submit"
					className="w-full"
					disabled={login.isPending && !queued}
					isLoading={login.isPending && !queued}
					aria-busy={queued || undefined}
					aria-describedby={hintVisible ? WAKE_HINT_ID : undefined}
				>
					{queued && <LoaderCircle className="mr-2 size-4 motion-safe:animate-spin" aria-hidden="true" />}
					{queued ? 'Signing in when ready' : 'Sign in'}
				</Button>

				{hintVisible && (
					<p id={WAKE_HINT_ID} className="flex items-start gap-2 text-sm text-warning">
						<Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
						<span>Server is waking up, see the status indicator</span>
					</p>
				)}

				{queued && (
					<div className="text-center">
						<Button type="button" variant="link" size="sm" className="min-h-11" onClick={clearQueue}>
							Cancel
						</Button>
					</div>
				)}
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
	);
}
