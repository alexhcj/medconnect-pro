'use client';

import {useEffect, useRef, useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button} from '@/components/ui/button';
import {useVerifyMfa} from '@/lib/hooks/use-session';
import {ApiError, RateLimitedError, rateLimitMessage} from '@/lib/api/http';
import {DEMO_MFA_CODE, showDemoAccounts} from '@/lib/auth/demo-accounts';
import {formControlClassName} from '@/components/forms/form-field-styles';

const mfaCodeSchema = z.object({
	code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit demo code'),
});

type MfaCodeFormData = z.infer<typeof mfaCodeSchema>;

function formatCountdown(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function MfaChallengeForm({
	email,
	mfaToken,
	expiresIn,
	onBack,
	onVerified,
}: {
	email: string;
	mfaToken: string;
	expiresIn: number;
	onBack: () => void;
	onVerified: () => void;
}) {
	const verifyMfa = useVerifyMfa();
	const [formError, setFormError] = useState<string | null>(null);
	const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor(expiresIn)));
	const expiresAtRef = useRef(Date.now() + expiresIn * 1000);
	const codeInputRef = useRef<HTMLInputElement | null>(null);
	const verifyRef = useRef<HTMLButtonElement | null>(null);
	const expired = remaining === 0;

	const {
		register,
		handleSubmit,
		setValue,
		formState: {errors},
	} = useForm<MfaCodeFormData>({
		resolver: zodResolver(mfaCodeSchema),
		mode: 'onChange',
		defaultValues: {
			code: '',
		},
	});

	const codeField = register('code');

	useEffect(() => {
		codeInputRef.current?.focus();
	}, []);

	useEffect(() => {
		const tick = () => {
			setRemaining(Math.max(0, Math.ceil((expiresAtRef.current - Date.now()) / 1000)));
		};
		tick();
		const id = window.setInterval(tick, 1000);
		return () => window.clearInterval(id);
	}, []);

	const onSubmit = async (data: MfaCodeFormData) => {
		if (expired) {
			setFormError('This mock MFA challenge has expired. Go back and sign in again.');
			return;
		}
		setFormError(null);
		try {
			await verifyMfa.mutateAsync({email, code: data.code, mfaToken});
			onVerified();
		} catch (error) {
			if (error instanceof RateLimitedError) {
				setFormError(rateLimitMessage(error));
				return;
			}
			if (error instanceof ApiError && error.status === 401) {
				setFormError('Verification failed. Check the demo code and try again.');
				return;
			}
			setFormError('Unable to verify. Try again.');
		}
	};

	return (
		<div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface px-4 py-6 shadow-sm sm:p-8">
			<h1 className="text-2xl font-bold text-foreground">Verify mock MFA</h1>
			<p className="text-sm text-foreground-secondary">
				Enter the demo verification code to finish signing in as the MFA nurse.
			</p>
			<p className="rounded-md bg-warning-subtle p-3 text-xs text-warning" role="note">
				This is a <strong>mock MFA challenge</strong> for the demo. It is not production TOTP or
				WebAuthn.
			</p>
			<div className="rounded-md border border-border bg-subtle p-3 text-xs text-foreground-secondary">
				<p className="text-sm font-medium text-foreground">Demo verification code</p>
				<p className="mt-1">
					Code: <span className="font-mono">{DEMO_MFA_CODE}</span>
				</p>
				<p className="mt-1 text-foreground-muted">Theater only. Not a production secret.</p>
			</div>

			<form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
				<div className="flex flex-col gap-2 sm:flex-row sm:items-start">
					<div className="min-w-0 flex-1">
						<label htmlFor="mfa-code" className="block text-sm font-medium text-foreground-label">
							Verification code
						</label>
						<input
							id="mfa-code"
							type="text"
							inputMode="numeric"
							autoComplete="one-time-code"
							autoFocus
							disabled={verifyMfa.isPending || expired}
							className={formControlClassName}
							{...codeField}
							ref={(element) => {
								codeField.ref(element);
								codeInputRef.current = element;
							}}
						/>
						{errors.code ? (
							<p className="mt-1 text-sm text-danger" role="alert">
								{errors.code.message}
							</p>
						) : (
							<p className="mt-1 text-sm text-foreground-muted">6-digit demo code</p>
						)}
					</div>
					{showDemoAccounts() && (
						<Button
							type="button"
							variant="outline"
							className="min-h-11 w-full sm:mt-6 sm:min-h-0 sm:w-auto"
							disabled={verifyMfa.isPending || expired}
							onClick={() => {
								setValue('code', DEMO_MFA_CODE, {shouldValidate: true, shouldDirty: true});
								verifyRef.current?.focus();
							}}
						>
							Fill code
						</Button>
					)}
				</div>

				{!expired && (
					<p className="text-xs text-foreground-muted">
						Challenge expires in {formatCountdown(remaining)}
					</p>
				)}

				{(formError || expired) && (
					<p className="text-sm text-danger" role="alert">
						{formError ??
							'This mock MFA challenge has expired. Go back and sign in again.'}
					</p>
				)}

				<Button
					ref={verifyRef}
					type="submit"
					className="w-full"
					disabled={verifyMfa.isPending || expired}
					isLoading={verifyMfa.isPending}
				>
					Verify
				</Button>
				<Button
					type="button"
					variant="ghost"
					className="w-full"
					disabled={verifyMfa.isPending}
					onClick={onBack}
				>
					Back to sign in
				</Button>
			</form>
		</div>
	);
}
