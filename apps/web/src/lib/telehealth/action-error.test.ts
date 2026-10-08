import {describe, expect, it} from 'vitest';
import {ApiError} from '@/lib/api/http';
import {telehealthActionErrorMessage} from '@/lib/telehealth/action-error';

describe('telehealthActionErrorMessage', () => {
	it('surfaces Nest 409 conflict messages', () => {
		expect(
			telehealthActionErrorMessage(
				new ApiError('This telehealth session cannot be joined.', 409, {code: 'SESSION_NOT_JOINABLE'}),
				'Unable to join this session.',
			),
		).toBe('This telehealth session cannot be joined.');
		expect(
			telehealthActionErrorMessage(
				new ApiError('A telehealth session for this appointment has already ended.', 409, {
					code: 'SESSION_ENDED',
				}),
				'Unable to start this telehealth visit.',
			),
		).toBe('A telehealth session for this appointment has already ended.');
	});

	it('surfaces 400 validation details for ineligible appointments', () => {
		expect(
			telehealthActionErrorMessage(
				new ApiError('Request validation failed', 400, {
					code: 'VALIDATION_ERROR',
					details: [
						{
							path: 'appointmentId',
							message: 'Appointment is not eligible for a telehealth session',
						},
					],
				}),
				'Unable to start this telehealth visit.',
			),
		).toBe('Appointment is not eligible for a telehealth session');
	});

	it('surfaces Nest 502 media-unavailable messages', () => {
		expect(
			telehealthActionErrorMessage(
				new ApiError('Live media is currently unavailable.', 502, {code: 'MEDIA_UNAVAILABLE'}),
				'Unable to start live media.',
			),
		).toBe('Live media is currently unavailable.');
	});

	it('keeps the fallback for other errors', () => {
		expect(telehealthActionErrorMessage(new ApiError('Resource not found', 404), 'Unable to load this telehealth session.')).toBe(
			'Unable to load this telehealth session.',
		);
		expect(telehealthActionErrorMessage(new Error('network'), 'Unable to join this session.')).toBe(
			'Unable to join this session.',
		);
	});
});
