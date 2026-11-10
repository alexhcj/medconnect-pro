import {existsSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {describe, expect, it} from 'vitest';
import {
	DEMO_PERSONAS,
	DEMO_PERSONA_KEYS,
	PERSONA_ART_HEIGHT,
	PERSONA_ART_WIDTH,
	parsePersonaKey,
	personaFor,
} from '@/lib/telehealth/demo-personas';

const PUBLIC_DIR = join(__dirname, '../../../public');

describe('demo persona catalog', () => {
	it('covers exactly the three keys the API allows', () => {
		expect([...DEMO_PERSONA_KEYS]).toEqual(['provider-jordan-ellis', 'nurse-riley-park', 'patient-avery-quinn']);
		expect(DEMO_PERSONAS.map((persona) => persona.key)).toEqual([...DEMO_PERSONA_KEYS]);
	});

	it('ships a first-party illustration for every persona and keeps the mouth inside the art', () => {
		for (const persona of DEMO_PERSONAS) {
			expect(persona.src).toBe(`/telehealth/personas/${persona.key}.svg`);
			expect(existsSync(join(PUBLIC_DIR, persona.src))).toBe(true);
			expect(persona.mouth.x).toBeGreaterThan(0);
			expect(persona.mouth.x).toBeLessThan(PERSONA_ART_WIDTH);
			expect(persona.mouth.y).toBeGreaterThan(0);
			expect(persona.mouth.y).toBeLessThan(PERSONA_ART_HEIGHT);
		}
	});

	it('accepts a known key and rejects anything else', () => {
		expect(parsePersonaKey('patient-avery-quinn')).toBe('patient-avery-quinn');
		expect(parsePersonaKey('provider-someone-else')).toBeNull();
		expect(parsePersonaKey(null)).toBeNull();
		expect(parsePersonaKey(undefined)).toBeNull();
		expect(parsePersonaKey(7)).toBeNull();
	});

	it('looks a persona up by key', () => {
		expect(personaFor('nurse-riley-park').roleLabel).toBe('Nurse');
	});

	// Build-time check: hosted production never renders the persona option because it never sets the flag.
	it('leaves NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS unset in the production and preview env examples', () => {
		const active = (file: string) =>
			readFileSync(join(__dirname, '../../..', file), 'utf8')
				.split(/\r?\n/)
				.filter((line) => !line.trim().startsWith('#'));
		for (const file of ['.env.production.example', '.env.preview.example']) {
			expect(active(file).some((line) => line.includes('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS'))).toBe(false);
		}
		expect(active('.env.render.example')).toContain('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS=true');
		const amplify = readFileSync(join(__dirname, '../../../../../amplify.yml'), 'utf8');
		expect(amplify).not.toContain('NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS');
	});
});
