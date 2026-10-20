import type {ReactNode} from 'react';

export function RoleTag({children}: {children: ReactNode}) {
	return (
		<li className="inline-flex min-h-11 items-center rounded-full bg-brand-subtle px-4 text-sm font-medium text-brand-hover">
			{children}
		</li>
	);
}

interface RoleTagListProps {
	roles: readonly string[];
}

export function RoleTagList({roles}: RoleTagListProps) {
	return (
		<ul className="flex flex-wrap gap-3">
			{roles.map((role) => (
				<RoleTag key={role}>{role}</RoleTag>
			))}
		</ul>
	);
}
