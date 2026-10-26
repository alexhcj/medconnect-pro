import {render, screen} from '@testing-library/react';
import AuthLayout from '@/app/(auth)/layout';
import OAuthLayout from '@/app/(oauth)/layout';

describe('auth layouts (FE-050)', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('wraps auth pages with the brand link above and the back link below', () => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://marketing.example.test');
		render(
			<AuthLayout>
				<h1>Page card</h1>
			</AuthLayout>,
		);

		const brand = screen.getByRole('link', {name: 'MedConnect Pro, back to home'});
		const back = screen.getAllByRole('link')[1];
		const card = screen.getByRole('heading', {name: 'Page card'});
		expect(brand).toHaveAttribute('href', 'https://marketing.example.test/');
		expect(screen.getAllByRole('link')).toHaveLength(2);
		expect(brand.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
		expect(card.compareDocumentPosition(back) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
	});

	it('falls back to plain branding with no link when the URL is unset', () => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', '');
		render(
			<AuthLayout>
				<h1>Page card</h1>
			</AuthLayout>,
		);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText('MedConnect Pro')).toBeInTheDocument();
	});

	it('leaves the OAuth landing group without a brand header', () => {
		vi.stubEnv('NEXT_PUBLIC_MARKETING_URL', 'https://marketing.example.test');
		render(
			<OAuthLayout>
				<h1>Signing you in</h1>
			</OAuthLayout>,
		);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.queryByText('MedConnect Pro')).not.toBeInTheDocument();
	});
});
