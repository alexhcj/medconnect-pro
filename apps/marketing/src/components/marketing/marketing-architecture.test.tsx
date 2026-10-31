import {act, fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {MarketingArchitecture} from '@/components/marketing/marketing-architecture';
import {
	MARKETING_ARCHITECTURE_CTA,
	MARKETING_ARCHITECTURE_FLOW,
	MARKETING_ARCHITECTURE_HERO,
	MARKETING_ARCHITECTURE_MAP,
	MARKETING_ARCHITECTURE_NODES,
	MARKETING_ARCHITECTURE_STACK,
} from '@/components/marketing/marketing-architecture-copy';

const node = (id: string) => MARKETING_ARCHITECTURE_NODES.find((item) => item.id === id)!;
const detail = () => document.getElementById('architecture-detail')!;

afterEach(() => {
	window.history.replaceState(null, '', '/');
});

describe('MarketingArchitecture', () => {
	it('renders the hero, map, flow, current vs planned and CTA sections', () => {
		render(<MarketingArchitecture />);

		expect(
			screen.getByRole('heading', {level: 1, name: MARKETING_ARCHITECTURE_HERO.heading}),
		).toBeInTheDocument();
		expect(screen.getAllByRole('heading', {level: 1})).toHaveLength(1);
		for (const heading of [
			MARKETING_ARCHITECTURE_MAP.heading,
			MARKETING_ARCHITECTURE_FLOW.heading,
			MARKETING_ARCHITECTURE_STACK.heading,
			MARKETING_ARCHITECTURE_CTA.heading,
		]) {
			expect(screen.getByRole('heading', {level: 2, name: heading})).toBeInTheDocument();
		}
		expect(document.getElementById(MARKETING_ARCHITECTURE_MAP.headingId)).toHaveTextContent(
			MARKETING_ARCHITECTURE_MAP.heading,
		);
	});

	it('gives the SVG a title and description', () => {
		render(<MarketingArchitecture />);

		const svg = screen.getByRole('img', {name: new RegExp(MARKETING_ARCHITECTURE_MAP.svgTitle)});
		expect(svg.querySelector('title')).toHaveTextContent(MARKETING_ARCHITECTURE_MAP.svgTitle);
		expect(svg.querySelector('desc')).toHaveTextContent(MARKETING_ARCHITECTURE_MAP.svgDescription);
	});

	it('renders every node as a map button in tab order, with the API selected first', () => {
		render(<MarketingArchitecture />);

		const pressable = screen
			.getAllByRole('button')
			.filter((button) => button.hasAttribute('aria-pressed'));
		expect(pressable.map((button) => button.textContent)).toEqual(
			MARKETING_ARCHITECTURE_NODES.map((item) => `${item.state}${item.name}${item.technical}`),
		);
		expect(pressable.filter((button) => button.getAttribute('aria-pressed') === 'true')).toHaveLength(1);
		expect(within(detail()).getByRole('heading', {level: 3})).toHaveTextContent('API');
		expect(detail()).toHaveAttribute('aria-live', 'polite');
		expect(within(detail()).getByText('Identity & Access')).toBeInTheDocument();
	});

	it('selects a node by mouse and by keyboard and updates the panel', async () => {
		const user = userEvent.setup();
		render(<MarketingArchitecture />);
		const pressable = () =>
			screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'));
		const byName = (name: string) => pressable().find((button) => button.textContent?.includes(name))!;

		await user.click(byName('Database'));
		expect(byName('Database')).toHaveAttribute('aria-pressed', 'true');
		expect(byName('NestJS 12')).toHaveAttribute('aria-pressed', 'false');
		expect(within(detail()).getByText(node('database').whatItDoes)).toBeInTheDocument();

		byName('Sign-in').focus();
		await user.keyboard('{Enter}');
		expect(within(detail()).getByText(node('sign-in').whatItDoes)).toBeInTheDocument();

		byName('Cache and queues').focus();
		await user.keyboard(' ');
		expect(within(detail()).getByText(node('cache').whatItDoes)).toBeInTheDocument();
	});

	it('shows the same nodes and content in the list view, one expanded at a time', async () => {
		const user = userEvent.setup();
		render(<MarketingArchitecture />);
		const expandable = () =>
			screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-expanded'));

		expect(expandable().map((button) => button.textContent)).toEqual(
			MARKETING_ARCHITECTURE_NODES.map((item) => `${item.state}${item.name}${item.technical}`),
		);
		for (const group of ['Running in the demo', 'External providers', 'Planned — not shipped']) {
			expect(screen.getByRole('list', {name: group})).toBeInTheDocument();
		}

		const api = expandable().find((button) => button.textContent?.includes('NestJS 12'))!;
		expect(api).toHaveAttribute('aria-expanded', 'true');
		expect(document.getElementById(api.getAttribute('aria-controls')!)).not.toHaveAttribute('hidden');

		const video = expandable().find((button) => button.textContent?.includes('Video calls'))!;
		await user.click(video);
		expect(video).toHaveAttribute('aria-expanded', 'true');
		expect(api).toHaveAttribute('aria-expanded', 'false');
		const panel = document.getElementById(video.getAttribute('aria-controls')!)!;
		expect(panel).not.toHaveAttribute('hidden');
		expect(panel).toHaveTextContent(node('video-calls').whatItDoes);

		await user.click(video);
		expect(video).toHaveAttribute('aria-expanded', 'false');
	});

	it('labels planned items "Planned" with a dashed warning-subtle box and external items "External"', () => {
		render(<MarketingArchitecture />);

		const buttons = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'));
		for (const item of MARKETING_ARCHITECTURE_NODES) {
			const button = buttons.find((candidate) => candidate.textContent?.includes(item.technical))!;
			expect(within(button).getByText(item.state)).toBeInTheDocument();
			if (item.state === 'Planned') {
				expect(button).toHaveClass('border-dashed', 'bg-warning-subtle');
			} else {
				expect(button).not.toHaveClass('border-dashed');
			}
		}
		expect(MARKETING_ARCHITECTURE_NODES.filter((item) => item.state === 'Planned')).toHaveLength(3);
		expect(MARKETING_ARCHITECTURE_NODES.filter((item) => item.state === 'External')).toHaveLength(3);
	});

	it('preselects a node from the URL hash and follows hash changes', async () => {
		window.history.replaceState(null, '', '/architecture#database');
		const scrollIntoView = vi.fn();
		Element.prototype.scrollIntoView = scrollIntoView;
		render(<MarketingArchitecture />);

		await waitFor(() =>
			expect(within(detail()).getByRole('heading', {level: 3})).toHaveTextContent('Database'),
		);
		expect(scrollIntoView).toHaveBeenCalled();

		act(() => {
			window.history.replaceState(null, '', '/architecture#sign-in');
			fireEvent(window, new HashChangeEvent('hashchange'));
		});
		expect(within(detail()).getByRole('heading', {level: 3})).toHaveTextContent('Sign-in');

		act(() => {
			window.history.replaceState(null, '', '/architecture#not-a-node');
			fireEvent(window, new HashChangeEvent('hashchange'));
		});
		expect(within(detail()).getByRole('heading', {level: 3})).toHaveTextContent('Sign-in');
	});

	it('draws the five-step flow with where each step is enforced', () => {
		render(<MarketingArchitecture />);

		const section = screen.getByRole('region', {name: MARKETING_ARCHITECTURE_FLOW.heading});
		const steps = within(section).getAllByRole('listitem');
		expect(steps).toHaveLength(5);
		MARKETING_ARCHITECTURE_FLOW.steps.forEach((step, index) => {
			expect(steps[index]).toHaveTextContent(step.title);
			expect(steps[index]).toHaveTextContent(`Enforced in: ${step.enforcedIn}`);
		});
	});

	it('keeps claims within the capability matrix', () => {
		render(<MarketingArchitecture />);

		expect(screen.getAllByText(/not production OAuth/).length).toBeGreaterThan(0);
		expect(screen.getAllByText(/No hosted production/).length).toBeGreaterThan(0);
		const stack = screen.getByRole('region', {name: MARKETING_ARCHITECTURE_STACK.heading});
		expect(within(stack).getByText(MARKETING_ARCHITECTURE_STACK.planned.title).parentElement).toHaveClass(
			'border-dashed',
			'bg-warning-subtle',
		);
		expect(screen.queryByText(/HIPAA compliant/i)).not.toBeInTheDocument();
		expect(document.body).not.toHaveTextContent(/\b(FE|BE|SEC|QA|DATA|INFRA)-\d+/);
	});
});
