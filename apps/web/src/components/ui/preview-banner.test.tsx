import {render, screen} from '@testing-library/react';
import {PreviewBanner} from '@/components/ui/preview-banner';

describe('PreviewBanner', () => {
	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('shows a status note on a PR preview build', () => {
		vi.stubEnv('NEXT_PUBLIC_DEPLOY_CONTEXT', 'pr-preview');
		render(<PreviewBanner />);

		const banner = screen.getByRole('status');
		expect(banner).toHaveTextContent('PR preview · mock data · not the live demo');
		expect(banner).toHaveClass('bg-warning-subtle', 'text-warning', 'sticky', 'top-0');
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
