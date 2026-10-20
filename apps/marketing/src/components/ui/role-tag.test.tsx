import {render, screen} from '@testing-library/react';
import {RoleTag, RoleTagList} from '@/components/ui/role-tag';

describe('RoleTag', () => {
	it('renders the Homepage tag styling', () => {
		render(
			<ul>
				<RoleTag>Provider</RoleTag>
			</ul>,
		);

		expect(screen.getByText('Provider')).toHaveClass(
			'rounded-full',
			'bg-brand-subtle',
			'text-brand-hover',
			'min-h-11',
			'px-4',
		);
	});
});

describe('RoleTagList', () => {
	it('renders one tag per role in a gap-3 list', () => {
		render(<RoleTagList roles={['Nurse', 'Patient']} />);

		const list = screen.getByRole('list');
		expect(list).toHaveClass('flex', 'flex-wrap', 'gap-3');
		expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
			'Nurse',
			'Patient',
		]);
	});
});
