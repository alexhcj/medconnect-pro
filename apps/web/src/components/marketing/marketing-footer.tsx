import Link from 'next/link';
import {LOGIN_PATH} from '@/lib/auth/paths';
import {MARKETING_NAV} from '@/lib/navigation/marketing-nav';

export function MarketingFooter() {
	return (
		<footer className="border-t border-gray-200 bg-gray-50">
			<div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
				<p className="text-sm text-gray-600">
					MedConnect Pro is a portfolio demonstration with synthetic data. It is not a
					certified production healthcare system.
				</p>
				<nav aria-label="Footer">
					<ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
						{MARKETING_NAV.map((item) => (
							<li key={item.href}>
								<Link
									href={item.href}
									className="text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
								>
									{item.name}
								</Link>
							</li>
						))}
						<li>
							<Link
								href={LOGIN_PATH}
								className="text-sm font-medium text-blue-600 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
							>
								Sign in
							</Link>
						</li>
					</ul>
				</nav>
			</div>
		</footer>
	);
}
