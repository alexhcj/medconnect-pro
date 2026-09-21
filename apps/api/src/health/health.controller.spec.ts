import {ServiceUnavailableException} from '@nestjs/common';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import type {DataSource} from 'typeorm';
import {HealthController} from './health.controller.js';

describe('HealthController readiness', () => {
	let query: ReturnType<typeof vi.fn>;
	let controller: HealthController;

	beforeEach(() => {
		query = vi.fn();
		controller = new HealthController({query} as unknown as DataSource);
	});

	it('returns ready when PostgreSQL accepts a query', async () => {
		query.mockResolvedValue([{'?column?': 1}]);
		await expect(controller.readiness()).resolves.toEqual({status: 'ready'});
	});

	it('does not depend on the database for liveness', () => {
		expect(controller.liveness()).toEqual({status: 'ok'});
		expect(query).not.toHaveBeenCalled();
	});

	it('signals not ready when PostgreSQL is unreachable', async () => {
		query.mockRejectedValue(new Error('connect ECONNREFUSED'));
		await expect(controller.readiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
	});
});
