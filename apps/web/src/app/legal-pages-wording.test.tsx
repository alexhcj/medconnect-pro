import {readFileSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {render, screen} from '@testing-library/react';
import PrivacyPolicyPage from '@/app/privacy-policy/page';
import TermsOfServicePage from '@/app/terms-of-service/page';

/**
 * FE-068: the legal pages describe a synthetic demo. They must not claim HIPAA compliance or
 * certification, production encryption, signed BAAs or deployed infrastructure.
 */
const here = dirname(fileURLToPath(import.meta.url));
const pages = {
	'terms-of-service': 'terms-of-service/page.tsx',
	'privacy-policy': 'privacy-policy/page.tsx',
};

const forbidden: Array<[string, RegExp]> = [
	['HIPAA compliant / HIPAA-compliant', /HIPAA[\s-]+compliant/i],
	['HIPAA certified', /HIPAA[\s-]+certified/i],
	['Covered Entity claim', /serves as a Covered Entity/i],
	['signed business associate agreements', /have signed/i],
	['certificate pinning', /certificate pinning/i],
	['AES-256', /AES-256/i],
	['VPC / private subnets', /VPC|private subnets/i],
	['SSE-KMS', /SSE-KMS/i],
];

describe('legal pages wording (FE-068)', () => {
	for (const [name, file] of Object.entries(pages)) {
		// Source text covers collapsed sections and privacy tabs that are not rendered by default.
		const source = readFileSync(resolve(here, file), 'utf8').replace(/\s+/g, ' ');
		it.each(forbidden)(`${name} has no "%s"`, (_label, pattern) => {
			expect(source).not.toMatch(pattern);
		});
	}

	it('terms of service says this is a synthetic demo with no real patient data', () => {
		render(<TermsOfServicePage />);
		const note = screen.getByRole('note');
		expect(note).toHaveTextContent(/synthetic demo/i);
		expect(note).toHaveTextContent(/no real patient data/i);
	});

	it('privacy policy says this is a synthetic demo with no real patient data', () => {
		render(<PrivacyPolicyPage />);
		expect(screen.getByText(/synthetic demo with no real patient data|synthetic portfolio demo with no real patient data/i)).toBeInTheDocument();
	});
});
