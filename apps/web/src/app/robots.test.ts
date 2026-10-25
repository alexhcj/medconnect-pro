import {describe, expect, it} from 'vitest';
import robots from '@/app/robots';
import {metadata} from '@/app/(auth)/login/layout';

describe('/login indexing (FE-049)', () => {
	it('disallows /login in robots.txt', () => {
		expect(robots().rules).toMatchObject({userAgent: '*', disallow: '/login'});
	});

	it('marks the sign-in page noindex', () => {
		expect(metadata.robots).toMatchObject({index: false});
	});
});
