import {render, screen} from '@testing-library/react';
import {Input} from '@/components/ui/input';

describe('Input', () => {
	it('uses shared input tokens and keeps helper text when there is no error', () => {
		const {container} = render(
			<Input label="Email" helperText="Use the demo account." />,
		);

		expect(screen.getByText('Email')).toBeInTheDocument();
		expect(container.querySelector('input')).toHaveClass('border-input', 'h-10', 'rounded-md');
		expect(screen.getByText('Use the demo account.')).toHaveClass('text-foreground-muted');
	});

	it('marks the field invalid and shows the error instead of helper text', () => {
		render(<Input label="Email" error="Enter a valid email address" helperText="Hidden" />);

		expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
		expect(screen.getByText('Enter a valid email address')).toHaveClass('text-danger');
		expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
	});
});
