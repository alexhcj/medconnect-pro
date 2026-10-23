import {render, screen} from '@testing-library/react';
import {PreviewBanner} from '@/components/marketing/preview-banner';

describe('PreviewBanner', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('shows a status note without mock-data wording on a PR preview build', () => {
		vi.stubEnv('NEXT_PUBLIC_DEPLOY_CONTEXT', 'pr-preview');
		render(<PreviewBanner />);

		const banner = screen.getByRole('status');
		expect(banner).toHaveTextContent('PR preview · not the live demo');
		expect(banner).not.toHaveTextContent(/mock data/i);
		expect(banner).toHaveClass('bg-warning-subtle', 'text-warning');
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
		expect(screen.queryByRole('button')).not.toBeInTheDocument();
		expect(screen.queryByRole('link')).not.toBeInTheDocument();
	});

	it('renders no DOM when the variable is unset', () => {
		vi.stubEnv('NEXT_PUBLIC_DEPLOY_CONTEXT', '');
		const {container} = render(<PreviewBanner />);
		expect(container).toBeEmptyDOMElement();
	});

	it('renders no DOM for any other value', () => {
		vi.stubEnv('NEXT_PUBLIC_DEPLOY_CONTEXT', 'production');
		const {container} = render(<PreviewBanner />);
		expect(container).toBeEmptyDOMElement();
	});
});
