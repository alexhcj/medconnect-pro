import {visitView} from '@/lib/telehealth/visit-view';

describe('visitView', () => {
	it('shows the green room for a waiting visit', () => {
		expect(visitView({state: 'waiting', joinedHere: false, closed: false})).toBe('green_room');
	});

	it('shows the green room to a later joiner of a live visit', () => {
		expect(visitView({state: 'in_session', joinedHere: false, closed: false})).toBe('green_room');
	});

	it('shows the stage once this page has joined a live visit', () => {
		expect(visitView({state: 'in_session', joinedHere: true, closed: false})).toBe('stage');
	});

	it('keeps the green room while a waiting visit has not flipped yet', () => {
		expect(visitView({state: 'waiting', joinedHere: true, closed: false})).toBe('green_room');
	});

	it('is closed when the visit ended or a closed error was seen', () => {
		expect(visitView({state: 'ended', joinedHere: true, closed: false})).toBe('closed');
		expect(visitView({state: 'in_session', joinedHere: true, closed: true})).toBe('closed');
	});
});
