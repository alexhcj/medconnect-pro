'use client';

import {Dialog, DialogBackdrop, DialogPanel, DialogTitle, Description} from '@headlessui/react';
import {PhoneMissed} from 'lucide-react';
import {Button} from '@/components/ui/button';

/**
 * End visit is the only red action and it ends the visit for everyone (SEC-013 scope 1), so it asks
 * first. Focus starts on the safe "Keep visit open" button. Leave call needs no confirmation.
 */
export function EndVisitDialog({
	open,
	onClose,
	onConfirm,
	isEnding,
}: {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	isEnding: boolean;
}) {
	return (
		<Dialog open={open} onClose={isEnding ? () => undefined : onClose} className="relative z-[60]">
			<DialogBackdrop className="fixed inset-0 bg-black/60" />
			<div className="fixed inset-0 flex items-center justify-center p-4">
				<DialogPanel className="w-full max-w-[480px] rounded-2xl bg-white p-7 text-gray-900 shadow-xl">
					<span
						aria-hidden="true"
						className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-100 text-red-600"
					>
						<PhoneMissed className="size-6" />
					</span>
					<DialogTitle className="text-xl font-semibold">End this visit for everyone?</DialogTitle>
					<Description className="mt-3 text-[15px] leading-relaxed text-gray-600">
						Everyone is disconnected from the call and the visit is marked as ended. Only the host can do this. Use
						Leave call if you only want to step out.
					</Description>
					<div className="mt-6 flex flex-wrap justify-end gap-3">
						<Button type="button" variant="outline" data-autofocus className="h-12 px-5" onClick={onClose} disabled={isEnding}>
							Keep visit open
						</Button>
						<Button type="button" variant="destructive" className="h-12 px-5" isLoading={isEnding} onClick={onConfirm}>
							End visit
						</Button>
					</div>
				</DialogPanel>
			</div>
		</Dialog>
	);
}
