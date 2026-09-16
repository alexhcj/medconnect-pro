export interface Vital {
	id: string;
	patientId: string;
	recordedAt: string;
	systolicMmHg: number;
	diastolicMmHg: number;
	heartRateBpm: number;
	temperatureC: number;
	respiratoryRate: number;
	spo2Percent: number;
	weightKg: number;
	recordedById: string;
	synthetic: boolean;
}
