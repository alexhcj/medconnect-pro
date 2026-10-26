import {render, screen} from '@testing-library/react';
import {AuthBackHomeLink, AuthBrandLink} from '@/components/auth/auth-brand-link';

const HREF = 'https://marketing.example.test/';

describe('AuthBrandLink', () => {
	it('links the logo to the marketing site in the same tab', () => {
		render(<AuthBrandLink href={HREF} />);
		const link = screen.getByRole('link', {name: 'MedConnect Pro, back to home'});
		expect(link).toHaveAttribute('href', HREF);
		expect(link).not.toHaveAttribute('target');
		expect(link).toHaveClass('min-h-11', 'focus-visible:ring-2');
	});

	it('renders plain branding with no link when the URL is missing', () => {
		render(<AuthBrandLink href={null} />);
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
		expect(screen.getByText('MedConnect Pro')).toBeInTheDocument();
	});
});

describe('AuthBackHomeLink', () => {
	it('links back to the same marketing URL', () => {
		render(<AuthBackHomeLink href={HREF} />);
		const link = screen.getByRole('link', {name: /back to home/i});
		expect(link).toHaveAttribute('href', HREF);
		expect(link).not.toHaveAttribute('target');
	});

	it('renders nothing when the URL is missing', () => {
		const {container} = render(<AuthBackHomeLink href={null} />);
		expect(container).toBeEmptyDOMElement();
	});
});
