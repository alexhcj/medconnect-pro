import {apiErrorFromBody, apiFetch, ApiError} from '@/lib/api/http';

describe('apiErrorFromBody', () => {
	it('reads the documented error envelope', () => {
		const error = apiErrorFromBody(
			{
				error: {
					code: 'VALIDATION_ERROR',
					message: 'Request validation failed',
					details: [{path: 'email', message: 'Taken'}],
				},
				correlationId: 'abc',
			},
			400,
		);

		expect(error).toBeInstanceOf(ApiError);
		expect(error.message).toBe('Request validation failed');
		expect(error.status).toBe(400);
		expect(error.code).toBe('VALIDATION_ERROR');
		expect(error.details).toEqual([{path: 'email', message: 'Taken'}]);
	});

	it('keeps a string error body as the message', () => {
		const error = apiErrorFromBody({error: 'nope'}, 500);
		expect(error.message).toBe('nope');
		expect(error.details).toBeUndefined();
	});

	it('falls back when the body has no message', () => {
		expect(apiErrorFromBody({}, 502).message).toBe('Request failed');
	});
});

describe('apiFetch', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('throws the parsed envelope from a failed response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 400,
				json: async () => ({
					error: {
						code: 'VALIDATION_ERROR',
						message: 'Request validation failed',
						details: [{path: 'phone', message: 'Phone is required'}],
					},
				}),
			}),
		);

		await expect(apiFetch('/api/patients')).rejects.toMatchObject({
			message: 'Request validation failed',
			status: 400,
			code: 'VALIDATION_ERROR',
			details: [{path: 'phone', message: 'Phone is required'}],
		});
	});
});