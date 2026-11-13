import {render, screen} from '@testing-library/react';
import {VisitWrapUp, visitDurationMinutes} from '@/components/telehealth/visit-wrap-up';
import {VisitEnded} from '@/components/telehealth/visit-ended';
import type {Appointment} from '@/types/medical/appointment';
import type {TelehealthSession} from '@/types/medical/telehealth-session';

const ended: TelehealthSession = {
	id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
	appointmentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
	patientName: 'Avery Quinn',
	providerName: 'Dr. Jordan Ellis',
	start: '2026-10-29T14:30:00.000Z',
	end: '2026-10-29T15:00:00.000Z',
	type: 'telehealth',
	state: 'ended',
	participants: [],
	viewerCanEnd: true,
	joinedAt: '2026-10-29T14:30:00.000Z',
	endedAt: '2026-10-29T14:48:20.000Z',
	synthetic: true,
};

const next: Appointment = {
	id: 'next-1',
	practiceId: 'p1',
	patientId: 'patient-1',
	providerId: 'provider-1',
	start: '2026-11-12T15:00:00.000Z',
	end: '2026-11-12T15:15:00.000Z',
	type: 'telehealth',
	state: 'scheduled',
	patientName: 'Avery Quinn',
	providerName: 'Dr. Jordan Ellis',
	synthetic: true,
};

describe('visitDurationMinutes', () => {
	it('rounds to whole minutes and needs both times', () => {
		expect(visitDurationMinutes(ended.joinedAt, ended.endedAt)).toBe(18);
		expect(visitDurationMinutes('2026-10-29T14:30:00.000Z', '2026-10-29T14:30:05.000Z')).toBe(1);
		expect(visitDurationMinutes(undefined, ended.endedAt)).toBeUndefined();
		expect(visitDurationMinutes(ended.endedAt, ended.joinedAt)).toBeUndefined();
	});
});

describe('VisitWrapUp', () => {
	it('shows the summary and a follow-up link carrying the prefill', () => {
		render(
			<VisitWrapUp
				session={ended}
				summary={{roles: ['PROVIDER', 'PATIENT', 'NURSE'], worstNetwork: 'good'}}
				followUpHref="/dashboard/appointments/new?patientId=patient-1&providerId=provider-1"
			/>,
		);

		expect(screen.getByRole('heading', {name: 'Visit wrap-up · Avery Quinn'})).toBeInTheDocument();
		expect(screen.getByText('Visit ended')).toBeInTheDocument();
		expect(screen.getByText('18 min')).toBeInTheDocument();
		expect(screen.getByText('Provider, Patient, Nurse')).toBeInTheDocument();
		expect(screen.getByText('As seen from your call on this device.')).toBeInTheDocument();
		expect(screen.getByText('Good')).toBeInTheDocument();
		expect(screen.getByText(/^\d{1,2}:\d{2} (AM|PM)$/)).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Book follow-up'})).toHaveAttribute(
			'href',
			'/dashboard/appointments/new?patientId=patient-1&providerId=provider-1',
		);
		expect(screen.getByText('All clinical details on this screen are synthetic and for demonstration only.')).toBeInTheDocument();
	});

	it('hides the browser-only rows when nothing was recorded, and never invents them', () => {
		render(<VisitWrapUp session={ended} followUpHref="/dashboard/appointments/new" />);

		expect(screen.getByText('Duration')).toBeInTheDocument();
		expect(screen.queryByText('Seen in this call')).not.toBeInTheDocument();
		expect(screen.queryByText('Connection quality')).not.toBeInTheDocument();
	});

	it('leaves out an unknown connection quality', () => {
		render(
			<VisitWrapUp
				session={ended}
				summary={{roles: ['PROVIDER'], worstNetwork: 'unknown'}}
				followUpHref="/dashboard/appointments/new"
			/>,
		);
		expect(screen.queryByText('Connection quality')).not.toBeInTheDocument();
		expect(screen.getByText('Provider')).toBeInTheDocument();
	});
});

describe('VisitEnded', () => {
	it('confirms the visit and shows a real next appointment', () => {
		render(<VisitEnded session={ended} nextAppointment={next} />);

		expect(screen.getByRole('heading', {name: 'Your visit has ended'})).toBeInTheDocument();
		expect(screen.getByText(/Dr\. Jordan Ellis · 18 min/)).toBeInTheDocument();
		expect(screen.getByRole('heading', {name: 'Follow-up appointment'})).toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Back to appointments'})).toHaveAttribute('href', '/dashboard/appointments');
	});

	it('shows no follow-up card when there is no next appointment', () => {
		render(<VisitEnded session={ended} />);

		expect(screen.queryByText('Follow-up appointment')).not.toBeInTheDocument();
		expect(screen.getByRole('link', {name: 'Back to appointments'})).toBeInTheDocument();
	});
});
