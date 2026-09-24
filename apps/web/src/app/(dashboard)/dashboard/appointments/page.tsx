'use client';

import {useState} from 'react';
import {AppointmentCalendar} from '@/components/appointments/appointment-calendar';
import {AppointmentList} from '@/components/appointments/appointment-list';
import {Button} from '@/components/ui/button';

const AppointmentsPage = () => {
	const [surface, setSurface] = useState<'calendar' | 'list'>('calendar');

	return (
		<div>
			<h1 className="mb-2 text-2xl font-bold text-gray-900">Appointments</h1>
			<p className="mb-6 text-sm text-gray-600">Synthetic demo data. Not a real medical record.</p>
			<div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Appointments view">
				<Button
					type="button"
					variant={surface === 'calendar' ? 'default' : 'outline'}
					aria-pressed={surface === 'calendar'}
					onClick={() => setSurface('calendar')}
				>
					Calendar
				</Button>
				<Button
					type="button"
					variant={surface === 'list' ? 'default' : 'outline'}
					aria-pressed={surface === 'list'}
					onClick={() => setSurface('list')}
				>
					List
				</Button>
			</div>
			{surface === 'calendar' ? <AppointmentCalendar /> : <AppointmentList />}
		</div>
	);
};

export default AppointmentsPage;
