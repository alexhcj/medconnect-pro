import {describe, expect, it} from 'vitest';
import {DEFAULT_JOIN_CHOICES, dailyJoinOptions} from '@/lib/telehealth/join-choices';
import {BACKGROUND_IMAGES, dailyProcessorFor} from '@/lib/telehealth/prejoin-backgrounds';

const ORIGIN = 'https://demo.example.test';

describe('dailyJoinOptions', () => {
	it('adds nothing for the default choices', () => {
		expect(dailyJoinOptions(DEFAULT_JOIN_CHOICES, ORIGIN)).toEqual({});
	});

	it('joins without video for audio only, whatever else was chosen', () => {
		const options = dailyJoinOptions(
			{audioOnly: true, cameraId: 'cam-1', microphoneId: 'mic-1', background: {kind: 'blur'}},
			ORIGIN,
		);
		expect(options).toEqual({startVideoOff: true, videoSource: false, audioSource: 'mic-1'});
	});

	it('passes the chosen devices and background', () => {
		const options = dailyJoinOptions(
			{
				audioOnly: false,
				cameraId: 'cam-1',
				microphoneId: 'mic-1',
				background: {kind: 'image', imageId: 'nurse-station'},
			},
			ORIGIN,
		);
		expect(options.videoSource).toBe('cam-1');
		expect(options.audioSource).toBe('mic-1');
		expect(options.startVideoOff).toBeUndefined();
		expect(options.inputSettings).toEqual({
			video: {processor: {type: 'background-image', config: {url: `${ORIGIN}/telehealth/backgrounds/nurse-station.webp`}}},
		});
	});

	it('leaves a slot for a custom video source (FE-065)', () => {
		const track = {kind: 'video'} as MediaStreamTrack;
		expect(dailyJoinOptions({...DEFAULT_JOIN_CHOICES, cameraId: 'cam-1', videoSource: track}, ORIGIN).videoSource).toBe(track);
	});

	it('carries no names, room, token or appointment data', () => {
		const text = JSON.stringify(dailyJoinOptions({...DEFAULT_JOIN_CHOICES, cameraId: 'cam-1'}, ORIGIN));
		expect(text).not.toMatch(/token|user_name|room|appointment/i);
	});
});

describe('dailyProcessorFor', () => {
	it('maps each choice and uses only the built-in images', () => {
		expect(dailyProcessorFor({kind: 'none'}, ORIGIN)).toEqual({type: 'none'});
		expect(dailyProcessorFor({kind: 'blur'}, ORIGIN)).toMatchObject({type: 'background-blur'});
		expect(BACKGROUND_IMAGES.map((image) => image.label)).toEqual([
			'Clinic exam room',
			'Nurse station',
			'Home living room',
		]);
		for (const image of BACKGROUND_IMAGES) {
			expect(image.src.startsWith('/telehealth/backgrounds/')).toBe(true);
		}
	});
});
