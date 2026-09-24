'use client';

import {AppointmentList} from '@/components/appointments/appointment-list';

const AppointmentsPage = () => {
	return (
		<div>
			<h1 className="mb-2 text-2xl font-bold text-gray-900">Appointments</h1>
			<p className="mb-6 text-sm text-gray-600">Synthetic demo data. Not a real medical record.</p>
			<AppointmentList />
		</div>
	);
};

export default AppointmentsPage;
