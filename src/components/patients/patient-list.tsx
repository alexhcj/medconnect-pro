'use client'

import {useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Calendar, Mail, MoreHorizontal, Phone, Plus, Search} from 'lucide-react'

interface Patient {
	id: string
	firstName: string
	lastName: string
	email: string
	phone: string
	dateOfBirth: string
	lastVisit: string
	status: 'active' | 'inactive' | 'new'
	avatar?: string
}

const PatientList = () => {
	const [searchTerm, setSearchTerm] = useState('')
	const [patients] = useState<Patient[]>([
		{
			id: '1',
			firstName: 'John',
			lastName: 'Doe',
			email: 'john.doe@email.com',
			phone: '+1 (555) 123-4567',
			dateOfBirth: '1985-03-15',
			lastVisit: '2024-01-15',
			status: 'active'
		},
		{
			id: '2',
			firstName: 'Jane',
			lastName: 'Smith',
			email: 'jane.smith@email.com',
			phone: '+1 (555) 987-6543',
			dateOfBirth: '1990-07-22',
			lastVisit: '2024-01-10',
			status: 'new'
		}
	])

	const getStatusColor = (status: Patient['status']) => {
		switch (status) {
			case 'active':
				return 'bg-green-100 text-green-800'
			case 'inactive':
				return 'bg-gray-100 text-gray-800'
			case 'new':
				return 'bg-blue-100 text-blue-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const filteredPatients = patients.filter(patient =>
		`${patient.firstName} ${patient.lastName}`
			.toLowerCase()
			.includes(searchTerm.toLowerCase()) ||
		patient.email.toLowerCase().includes(searchTerm.toLowerCase())
	)

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<CardTitle>Patients</CardTitle>
					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
							<Input
								placeholder="Search patients..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 w-full sm:w-64"
							/>
						</div>
						<Button>
							<Plus className="h-4 w-4 mr-2"/>
							Add Patient
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{filteredPatients.map((patient) => (
						<div
							key={patient.id}
							className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<div className="flex items-center space-x-4">
								<div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {patient.firstName[0]}{patient.lastName[0]}
                  </span>
								</div>
								<div>
									<h3 className="font-medium text-gray-900">
										{patient.firstName} {patient.lastName}
									</h3>
									<div className="flex items-center space-x-4 text-sm text-gray-500">
										<div className="flex items-center">
											<Mail className="h-3 w-3 mr-1"/>
											{patient.email}
										</div>
										<div className="flex items-center">
											<Phone className="h-3 w-3 mr-1"/>
											{patient.phone}
										</div>
									</div>
								</div>
							</div>
							<div className="flex items-center space-x-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patient.status)}`}>
                  {patient.status}
                </span>
								<div className="text-sm text-gray-500">
									<div className="flex items-center">
										<Calendar className="h-3 w-3 mr-1"/>
										Last visit: {new Date(patient.lastVisit).toLocaleDateString()}
									</div>
								</div>
								<Button variant="ghost" size="icon">
									<MoreHorizontal className="h-4 w-4"/>
								</Button>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

export {PatientList}