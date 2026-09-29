import {render, screen} from '@testing-library/react';
import {Button, buttonVariants} from '@/components/ui/button';

describe('Button', () => {
	it('uses shared brand tokens for the default variant and control heights', () => {
		expect(buttonVariants({variant: 'default'})).toContain('bg-brand');
		expect(buttonVariants({variant: 'default'})).toContain('text-inverse');
		expect(buttonVariants({variant: 'destructive'})).toContain('bg-destructive');
		expect(buttonVariants({variant: 'outline'})).toContain('border-input');
		expect(buttonVariants({variant: 'secondary'})).toContain('bg-secondary');
		expect(buttonVariants({variant: 'ghost'})).toContain('hover:bg-subtle');
		expect(buttonVariants({variant: 'link'})).toContain('text-brand');
		expect(buttonVariants({size: 'sm'})).toContain('h-9');
		expect(buttonVariants({size: 'default'})).toContain('h-10');
		expect(buttonVariants({size: 'lg'})).toContain('h-11');
	});

	it('renders a labelled control and exposes the loading state as disabled', () => {
		const {rerender} = render(<Button>Save</Button>);
		expect(screen.getByRole('button', {name: 'Save'})).toBeEnabled();

		rerender(<Button isLoading>Save</Button>);
		expect(screen.getByRole('button', {name: 'Save'})).toBeDisabled();
	});
});
