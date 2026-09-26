'use client';

import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';

export function PaymentClaimsBoundaries() {
	return (
		<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Payment boundary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-gray-700">
						Stripe/ACH is not connected. This demo does not process payments or collect card numbers.
					</p>
					<Button type="button" disabled>
						Record payment
					</Button>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Claims boundary</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-700">
						Claims / EDI 837 is not connected. Claim status and denial workflow are out of this demo.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
