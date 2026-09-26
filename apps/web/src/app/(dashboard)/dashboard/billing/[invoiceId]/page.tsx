'use client';

import {useParams} from 'next/navigation';
import {InvoiceDetail} from '@/components/billing/invoice-detail';

export default function InvoiceDetailPage() {
	const params = useParams<{invoiceId: string}>();
	const invoiceId = typeof params.invoiceId === 'string' ? params.invoiceId : '';

	return <InvoiceDetail invoiceId={invoiceId} />;
}
