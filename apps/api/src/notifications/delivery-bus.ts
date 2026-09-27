export type DeliveryJob = {
	notificationId: string;
};

export interface DeliveryBus {
	enqueue(job: DeliveryJob): Promise<void>;
}

export const DELIVERY_BUS = Symbol('DELIVERY_BUS');

export const DELIVERY_MAX_ATTEMPTS = 3;
export const DELIVERY_BACKOFF_MS = [1000, 4000, 16000] as const;

export type DeliverySleep = (ms: number) => Promise<void>;
export const DELIVERY_SLEEP = Symbol('DELIVERY_SLEEP');

export const defaultDeliverySleep: DeliverySleep = (ms) =>
	new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
